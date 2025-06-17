import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useLocation,
  useNavigate
} from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { connectToChannel, leaveChannel } from '../ReactForAgora'; // Agora 함수 임포트
import "./App.css";

// Sidebar 컴포넌트
const Sidebar = ({ rooms, onSelectRoom, selectedRoomName }) => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <input type="text" placeholder="Search Harmony" className="search" />
      <div className="roomListBox">
        <Link to="/" className={`roomLink${location.pathname === "/" ? " active" : ""}`}>
          <span role="img" aria-label="home" className="icon">🏠</span> 메인페이지
        </Link>
        {rooms && Array.isArray(rooms) && rooms.map((room) => {
          const isActive = selectedRoomName === room.roomname;
          return (
            <div
              key={room.roomID ?? room.id}
              className={`roomLink ${isActive ? 'active' : ''}`} // active 클래스 조건부 적용
              style={{
                padding: '8px',
                cursor: 'pointer',
              }}
              onClick={() => {
                onSelectRoom(room.roomname); // 선택 저장
              }}
              title={`${room.roomname} (${room.roomtype})`}
            >
              <span className="icon" role="img" aria-label="room-phone">📞</span> {room.roomname}
            </div>
          );
        })}
        {(!rooms || rooms.length === 0) && (
          <div className="roomLink placeholder">
            <span className="icon">...</span> 방 목록 로딩 중
          </div>
        )}
      </div>
      {/* 기타 프로필 등 */}
      <div className="profileSection">
        <div className="profileCircle"></div>
        <span>Profile</span>
        <button className="settingsIcon" aria-label="Settings">⚙️</button>
      </div>
    </div>
  );
};

// 메인 페이지에서 방 생성하는 컴포넌트
const RoomPage = ({ refreshRoomList, allRooms, loadingRooms }) => {
  const [roomName, setRoomName] = useState("");
  const [category, setCategory] = useState("업무");
  const navigate = useNavigate();

const handleCreateRoom = async () => {
  if (!roomName.trim()) {
    alert("방 이름을 입력하세요.");
    return;
  }
  try {
    const response = await axios.post("http://localhost:3000/createroom", {
      roomname: roomName,
      roomtype: category,
      createdby: "test",
    });
    console.log("방 생성 API 응답:", response.data);
    if (response.data && response.data.success) {
      const newRoomID = response.data.roomID;
      if (newRoomID) {
        await refreshRoomList();
        navigate(`/server/${newRoomID}`);
      } else {
        await refreshRoomList();
        setRoomName("");
        alert("방이 성공적으로 만들어졌으나, 방 ID를 받지 못했습니다.");
      }
    } else {
      alert("방 생성 실패: " + (response.data.message || "알 수 없는 오류"));
    }
  } catch (err) {
    console.error("방 생성 에러:", err);
    alert("방 생성 중 오류 발생");
  }
};

if (!loadingRooms && allRooms.length === 0) {
  return (
    <div className="content">
      <h2>생성된 방이 없습니다.</h2>
      <p>새로운 방을 만들어 주세요.</p>
    </div>
  );
}

return (
  <div className="content">
    <form
      className="roomForm"
      onSubmit={(e) => {
        e.preventDefault();
        handleCreateRoom();
      }}
    >
      <h2>방 생성</h2>
      <div className="formRow">
        <label htmlFor="roomName">방 이름 :</label>
        <input
          id="roomName"
          type="text"
          placeholder="방 이름 입력"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
      </div>
      <div className="formRow">
        <label htmlFor="category">카테고리 :</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="업무">업무</option>
          <option value="친목">친목</option>
          <option value="스터디">스터디</option>
        </select>
      </div>
      <button type="submit" className="createButton">방 생성</button>
    </form>
  </div>
);
};

// 채팅방 상세 페이지
const Room = ({ rooms }) => {
  const { roomId } = useParams();
  const [users, setUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

useEffect(() => {
  setLoadingUsers(true);
  if (!roomId || !rooms || rooms.length === 0) {
    setCurrentRoom(null);
    setUsers([]);
    setLoadingUsers(false);
    return;
  }

  const matchedRoom =
    rooms.find(
      (room) => String(room.roomID) === roomId || String(room.id) === roomId
    ) || null;
  setCurrentRoom(matchedRoom);

  if (matchedRoom) {
    axios
      .get(
        `http://localhost:3000/api/rooms/${
          matchedRoom.roomID ?? matchedRoom.id
        }/users`
      )
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
        } else {
          console.warn(
            `API call for users in room ${
              matchedRoom.roomID ?? matchedRoom.id
            } failed or returned unexpected data:`,
            res.data
          );
          setUsers([]);
        }
      })
      .catch((err) => {
        console.error(
          `${matchedRoom.roomID ?? matchedRoom.id} 방 유저 목록 불러오기 실패:`,
          err
        );
        setUsers([]);
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  } else {
    console.warn(`Room with ID ${roomId} not found in the fetched room list.`);
    setCurrentRoom(null);
    setUsers([]);
    setLoadingUsers(false);
  }
}, [roomId, rooms]);

if (!currentRoom && loadingUsers) {
  return (
    <div className="content">
      <h2>방 정보를 불러오는 중...</h2>
    </div>
  );
}

if (!currentRoom && !loadingUsers) {
  return (
    <div className="content">
      <h2>존재하지 않는 방입니다. (Room ID: {roomId})</h2>
    </div>
  );
}

return (
  <div className="content">
    <h2>{`통화방: ${currentRoom.roomname}`}</h2>
    {/* 채널 연결 & 해제 버튼 */}
    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      <button onClick={() => connectToChannel(currentRoom.roomname)}>연결하기</button>
      <button onClick={() => leaveChannel()}>해제하기</button>
    </div>
    {/* 화면공유 버튼 (필요시 활성화) */}
    {/* <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      <button onClick={() => startScreenShare()}>화면공유 시작</button>
      <button onClick={() => stopScreenShare()}>공유 중지</button>
    </div> */}
    {loadingUsers ? (
      <p>참가자 목록 로딩 중...</p>
    ) : (
      <div
        className="user-boxes"
        style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
      >
        {users.length === 0 ? (
          <p>아직 참가자가 없습니다.</p>
        ) : (
          users.map((user, idx) => (
            <div
              key={user.id || idx}
              className="user-card"
              style={{
                padding: "10px 20px",
                border: "2px solid #8650a8",
                borderRadius: "12px",
                backgroundColor: "#f3eaff",
                fontWeight: "600",
              }}
            >
              {user.name || `사용자 ${idx + 1}`}
            </div>
          ))
        )}
      </div>
    )}
  </div>
);
};

// 더미 컴포넌트
const Dummy = ({ text }) => (
  <div className="content">
    <h2>{text}</h2>
  </div>
);

const MainApp = () => {
  const [allRooms, setAllRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoomName, setSelectedRoomName] = useState(null);

  const fetchRooms = () => {
    setLoadingRooms(true);
    axios
      .get("http://localhost:3000/fetchroom")
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.rooms)) {
          setAllRooms(res.data.rooms);
        } else {
          setAllRooms([]);
        }
      })
      .catch((err) => {
        console.error("전역 방 목록 로드 실패:", err);
        setAllRooms([]);
      })
      .finally(() => {
        setLoadingRooms(false);
      });
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="app">
      <Router>
        {/* 방 목록 사이드바 */}
        <Sidebar
          rooms={allRooms}
          onSelectRoom={setSelectedRoomName}
          selectedRoomName={selectedRoomName}
        />

        {/* "방 클릭 후, 연결 버튼" */}
        <div style={{ padding: "10px" }}>
          <button
            onClick={() => {
              if (selectedRoomName) {
                console.log("호출 시 넘긴 채널명:", selectedRoomName); 
                connectToChannel(selectedRoomName);
              } else {
                alert("방을 먼저 클릭해서 선택하세요");
              }
            }}
          >
            채널 연결
          </button>
          <button onClick={() => leaveChannel()}>연결 해제</button>
        </div>

        {/* 라우터 */}
        <Routes>
          <Route
            path="/"
            element={
              <RoomPage
                refreshRoomList={fetchRooms}
                allRooms={allRooms}
                loadingRooms={loadingRooms}
              />
            }
          />
          <Route path="/server/:roomId" element={<Room rooms={allRooms} />} />
          <Route path="/profile" element={<Dummy text="프로필" />} />
          <Route path="/settings" element={<Dummy text="설정" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default MainApp;
