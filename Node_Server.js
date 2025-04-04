// 실행 전 확인사항
// 1. HTTPS 설정: localhost 테스트 시 생략 가능
// 2. 방화벽 설정: 3000 포트 개방
// 3. 종속성 설치 : npm install express socket.io

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const socketIO = require('socket.io');
const http = require('http');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

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

// // 기본 경로 라우팅 설정
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'register.html'));
// });

// WebRTC 시그널링 처리
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('ice-candidate', (candidate) => {
        socket.broadcast.emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// 404 에러 처리 (라우팅되지 않은 요청)
app.use((req, res) => {
    res.status(404).send('<h1>Page not found</h1>');
});


// 서버 실행
server.listen(3000, () => {
    console.log('서버 실행 중: http://localhost:3000');

});
