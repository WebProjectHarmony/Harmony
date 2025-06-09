document.getElementById('createRoomForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const roomname = document.getElementById('roomname').value.trim();
  const roomtype = document.getElementById('roomtype').value;
  const createdby = document.getElementById('createdby').value.trim();

  const resultDiv = document.getElementById('result');
  resultDiv.textContent = '방을 생성 중입니다...';

  try {
    const response = await fetch('/createroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomname, roomtype, createdby })
    });
    const data = await response.json();

    if (data.success) {
      resultDiv.textContent = '✅ 방 생성 성공!';
      // 필요하다면 방 목록 새로고침 또는 이동
    } else {
      resultDiv.textContent = '❌ ' + data.message;
    }
  } catch (error) {
    resultDiv.textContent = '서버 오류가 발생했습니다.';
    console.error(error);
  }
});

async function fetchRooms() {
  const roomListDiv = document.getElementById('roomList');
  roomListDiv.textContent = '불러오는 중...';

  try {
    const response = await fetch('/fetchroom');
    const data = await response.json();

    if (data.success) {
      if (data.rooms.length === 0) {
        roomListDiv.textContent = '채팅방이 없습니다.';
        return;
      }
      roomListDiv.innerHTML = '';
      data.rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'room';
        div.innerHTML = `
          <span class="room-title">${room.roomname}</span>
          <span class="room-type">(${room.roomtype === 'voice' ? '음성' : '텍스트'})</span><br>
          <small>생성자: ${room.createdby}</small>
        `;
        // 클릭 이벤트 추가
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          // 예: 방 상세 페이지로 이동 (roomid 사용)
          // location.href = `/room.html?roomid=${room.roomid}`;
          // 또는 상세 정보 모달 띄우기 등
          alert(`방 "${room.roomname}"을(를) 클릭했습니다!`);
        });
        roomListDiv.appendChild(div);
      });
    } else {
      roomListDiv.textContent = '채팅방 목록을 불러오지 못했습니다.';
    }
  } catch (err) {
    roomListDiv.textContent = '서버 오류가 발생했습니다.';
    console.error(err);
  }
}

// 페이지 로드 시 자동 실행
window.onload = fetchRooms;