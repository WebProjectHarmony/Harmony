// 로그인
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userNAME = this.userNAME.value;
    const userPWD = this.userPWD.value;
    
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userNAME, userPWD })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('로그인 성공!');
            window.location.href = '/dashboard';
        } else {
            alert('로그인 실패: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// 회원가입
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userNAME = this.userNAME.value;
    const userPWD = this.userPWD.value;
    const email = this.email.value;
    
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userNAME, userPWD, email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('회원가입 성공!');
            window.location.href = '/login';
        } else {
            alert('회원가입 실패: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});