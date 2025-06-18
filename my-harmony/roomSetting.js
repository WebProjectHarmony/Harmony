import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RoomSetting = () => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [category, setCategory] = useState('업무'); // 기본값

  // 방 목록 불러오기
  useEffect(() => {
    //axios.get('http://localhost:3000/fetchroom') // API 주소 수정 필요
    axios.get('https://25d8-203-243-7-226.ngrok-free.app/fetchroom') // API 주소 수정 필요
      .then((res) => {
        setRooms(res.data);
      })
      .catch((err) => {
        console.error('방 목록 가져오기 실패:', err);
      });
  }, []);

  // 방 생성 핸들러
  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert('방 이름을 입력하세요.');
      return;
    }

    const newRoom = {
      name: roomName,
      category: category,
    };

    // 서버에 방 생성 요청
    //axios.post('http://localhost:3000/Test.html', newRoom) 
    axios.post('https://25d8-203-243-7-226.ngrok-free.app/Test.html', newRoom) 
      .then((res) => {
        // 성공 시 목록에 새 방 추가
        setRooms([...rooms, res.data]);
        setRoomName(''); // 입력창 초기화
      })
      .catch((err) => {
        console.error('방 생성 실패:', err);
        alert('방 생성에 실패했습니다.');
      });
  };

  return (
    <div className="roomSetting">
      {/* 방 목록 보여주기 */}
      <h3>방 목록</h3>
      {rooms.length === 0 ? (
        <p>등록된 방이 없습니다.</p>
      ) : (
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>{room.name} ({room.category})</li>
          ))}
        </ul>
      )}

      {/* 방 생성 폼 */}
      <h3>방 생성</h3>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="방 이름 입력"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          style={{ marginRight: '10px' }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="업무">업무</option>
          <option value="친목">친목</option>
          <option value="스터디">스터디</option>
        </select>
      </div>
      <button onClick={handleCreateRoom}>방 생성</button>
    </div>
  );
};

export default RoomSetting;
