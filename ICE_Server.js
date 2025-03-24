const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
            urls: 'turn:your_turn_server.com',
            username: 'user',
            credential: 'pass' 
        }
    ]
};

// STUN 서버: 공인 IP 확인용
// TURN 서버: NAT 우회용 (실제 구현 시 필요)