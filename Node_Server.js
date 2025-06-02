const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const http = require('http');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const { RtcTokenBuilder, RtcRole } = require('agora-access-token'); // Agora 토큰 생성 라이브러리

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// === Agora 설정 ===
const appId = process.env.Agora_appId;
const appCertificate = process.env.Agora_appCertificate;
// === Agora 설정 끝 ===

app.get('/env', (req, res) => {
  res.json({ appId });
});

const db = mysql.createConnection({
    host: process.env.db_host,
    user: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_database
});

db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 오류:', err);
        process.exit(1); // 서버 종료
    }
    console.log('MySQL 연결 성공');
});

// 미들웨어 설정
app.use(express.json()); // JSON 요청 본문 파싱
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'itsRandomString',
    resave: false,
    saveUninitialized: true
}));

// 로그인 처리
app.post('/login', async (req, res) => {
    try {
        const { userNAME, userPWD } = req.body;
        if (!userNAME || !userPWD) {
            console.error('요청 본문이 비어 있습니다.');
            return res.status(400).json({ success: false, message: '사용자 이름과 비밀번호를 입력하세요.' });
        }

        db.query('SELECT * FROM users WHERE userNAME = ?', [userNAME], async (error, results) => {
            if (error) {
                console.error('Database query error:', error);
                return res.status(500).json({ success: false, message: '데이터베이스 오류' });
            }

            if (results.length > 0) {
                try {
                    const comparison = await bcrypt.compare(userPWD, results[0].userPWD);
                    if (comparison) {
                        req.session.loggedin = true;
                        req.session.username = userNAME;
                        return res.json({ success: true });
                    } else {
                        return res.status(401).json({ success: false, message: '잘못된 비밀번호' });
                    }
                } catch (bcryptError) {
                    console.error('bcrypt compare error:', bcryptError);
                    return res.status(500).json({ success: false, message: '비밀번호 비교 중 오류' });
                }
            } else {
                return res.status(404).json({ success: false, message: '존재하지 않는 사용자' });
            }
        });
    } catch (err) {
        console.error('서버 처리 중 오류:', err);
        res.status(500).json({ success: false, message: '서버 내부 오류' });
    }
});


app.get('/Test.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Test.html')); 
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});



app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
    //res.sendFile(path.join(__dirname, 'Test.html'));
});

  
// 로그인 처리
app.post('/login', async (req, res) => {
  try {
      const { userNAME, userPWD } = req.body;

      if (!userNAME || !userPWD) {
          console.error('요청 본문이 비어 있습니다.');
          return res.status(400).json({ success: false, message: '사용자 이름과 비밀번호를 입력하세요.' });
      }

      db.query('SELECT * FROM users WHERE userNAME = ?', [userNAME], async (error, results) => {
          if (error) {
              console.error('Database query error:', error);
              return res.status(500).json({ success: false, message: '데이터베이스 오류' });
          }

          if (results.length > 0) {
              try {
                  const comparison = await bcrypt.compare(userPWD, results[0].userPWD);
                  if (comparison) {
                      req.session.loggedin = true;
                      req.session.username = userNAME;
                      return res.json({ success: true });
                  } else {
                      return res.status(401).json({ success: false, message: '잘못된 비밀번호' });
                  }
              } catch (bcryptError) {
                  console.error('bcrypt compare error:', bcryptError);
                  return res.status(500).json({ success: false, message: '비밀번호 비교 중 오류' });
              }
          } else {
              return res.status(404).json({ success: false, message: '존재하지 않는 사용자' });
          }
      });
  } catch (err) {
      console.error('서버 처리 중 오류:', err);
      res.status(500).json({ success: false, message: '서버 내부 오류' });
  }
});


  
  // 회원가입 처리
  app.post('/register', async (req, res) => {
    try {
      const { userNAME, userPWD, userNickname, email } = req.body;
  
      if (!userNAME || !userPWD || !email || !userNickname) {
        return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
      }
  
      // 비밀번호 암호화
      const hashedPassword = await bcrypt.hash(userPWD, 10);
  
      // 데이터베이스에 사용자 추가
      db.query(
        'INSERT INTO users (userNAME, userPWD, userNickname, email) VALUES (?, ?, ?, ?)',
        [userNAME, hashedPassword, userNickname, email],
        (error) => {
          if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ success: false, message: '회원가입 실패' });
          }
          return res.json({ success: true });
        }
      );
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ success: false, message: '서버 내부 오류' });
    }
  });
  
// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname)));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// === Agora RTC 토큰 생성 API 엔드포인트 추가 ===
// 클라이언트(브라우저)가 이 경로로 요청하여 RTC 토큰을 받음
app.get('/rtcToken', (req, res) => {
    // 클라이언트로부터 채널 이름과 UID를 쿼리 파라미터로 받음
    const channelName = req.query.channelName;
    // UID는 클라이언트에서 지정하거나 서버에서 생성 가능
    // 여기서는 클라이언트에서 넘겨받거나 (없으면 ''로 처리), 서버에서 Agora에 자동 할당을 맡긴다....
    const uid = req.query.uid || 0; // 0 또는 null을 넘기면 Agora가 자동 할당

    if (!channelName) {
        // 채널 이름이 없으면 오류 응답
        return res.status(400).json({ error: 'channelName is required' });
    }

    // 토큰 만료 시간 설정 (초 단위)
    // 예: 3600초 = 1시간 후 만료
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // RTC 토큰 생성
    // buildTokenWithUid: UID 기반 토큰 생성
    // buildTokenWithAccount: 사용자 계정 이름 기반 토큰 생성
    const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, RtcRole.PUBLISHER, privilegeExpiredTs);

    // 생성된 토큰을 클라이언트에게 JSON 형태로 응답
    res.json({ rtcToken: token });
});
// === Agora RTC 토큰 생성 API 엔드포인트 끝 ===


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// 404 에러 처리 (라우팅되지 않은 요청)
app.use((req, res) => {
    res.status(404).send('<h1>Page not found</h1>');
});


// 서버 실행
server.listen(3000, () => {
    console.log('서버 실행 중: http://localhost:3000');

});
