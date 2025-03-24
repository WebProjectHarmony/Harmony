// 실행 전 확인사항
// 1. HTTPS 설정: localhost 테스트 시 생략 가능
// 2. 방화벽 설정: 3000 포트 개방
// 3. 종속성 설치 : npm install express socket.io

const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const path = require('path'); // 경로 처리를 위한 모듈

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// 정적 파일 제공 설정 (public 폴더 사용)
app.use(express.static(path.join(__dirname)));

// 기본 경로 라우팅 설정
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Test.html'));
});

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
