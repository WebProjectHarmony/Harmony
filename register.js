
// 회원가입
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userNAME = this.userNAME.value.trim();
    const userPWD = this.userPWD.value.trim();
    const email = this.email.value.trim();
    
    if (!userNAME || !userPWD || !email) {
        alert('사용자 이름, 비밀번호, 이메일을 모두 입력해주세요.');
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userNAME, userPWD, email })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('회원가입 성공!');
            window.location.href = '/login.html';
        } else {
            alert('회원가입 실패: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('회원가입 중 오류가 발생했습니다.');
    });
});