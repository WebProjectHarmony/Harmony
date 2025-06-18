// 로그인
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userNAME = this.userNAME.value.trim();
    const userPWD = this.userPWD.value.trim();
  
    if (!userNAME || !userPWD) {
      alert('사용자 이름과 비밀번호를 입력하세요.');
      return;
    }
  
    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userNAME, userPWD })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        alert('로그인 성공!');
        //window.location.href = '/Test.html';
         window.location.href = 'http://localhost:5173';
        // window.location.href = 'https://a89e-203-243-7-226.ngrok-free.app';
      } else {
        alert('로그인 실패: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('로그인 중 오류가 발생했습니다.');
    });
  });


  document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // 두 폼 안의 라디오 버튼을 모두 가져오기
    const loginRadioButtons = loginForm.querySelectorAll('input[name="authType"]');
    const registerRadioButtons = registerForm.querySelectorAll('input[name="authType"]');
  
    // 라디오 버튼 상태를 동기화하는 함수
    function syncRadioButtons(selectedValue) {
      loginRadioButtons.forEach(radio => {
        radio.checked = radio.value === selectedValue;
      });
      registerRadioButtons.forEach(radio => {
        radio.checked = radio.value === selectedValue;
      });
      
      // 선택된 값에 따라 폼 표시/숨김 처리
      if (selectedValue === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
      } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
      }
    }
  
    // 로그인 폼의 라디오 버튼에 이벤트 리스너 추가
    loginRadioButtons.forEach(radio => {
      radio.addEventListener('change', function() {
        syncRadioButtons(this.value);
      });
    });
  
    // 회원가입 폼의 라디오 버튼에 이벤트 리스너 추가
    registerRadioButtons.forEach(radio => {
      radio.addEventListener('change', function() {
        syncRadioButtons(this.value);
      });
    });
  });