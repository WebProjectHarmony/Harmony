// 로그인 폼, 닉네임 입력 필드 선택
const form = document.getElementById('login-form');
const nicknameInput = document.getElementById('nickname');

// 폼 제출 이벤트 리스너 추가
form.addEventListener('submit', function(event) {
    event.preventDefault(); // 기본 제출 동작 방지
    
    // 입력된 닉네임 값 가져오기
    const nickname = nicknameInput.value;
    
    // 새로운 창 열기
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>환영합니다</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin-top: 50px;
                }
            </style>
        </head>
        <body>
            <h1>${nickname} 님 환영합니다</h1>
        </body>
        </html>
    `);
    
    // 입력 필드 비우기
    nicknameInput.value = '';
});
