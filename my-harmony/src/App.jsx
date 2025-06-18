import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  connectToChannel,
  leaveChannel,
  startScreenShare,
  stopScreenShare,
} from "../ReactForAgora"; // Agora 함수 임포트
import "./App.css";

// Sidebar 컴포넌트
const Sidebar = ({ rooms, selectedRoomName }) => {
  const navigate = useNavigate();

  const handleRoomClick = (room) => {
    navigate(`/server/${room.roomID || room.id}`); // 경로 변경
  };

  return (
    <div className="sidebar">
      <input className="search" placeholder="Search Harmony" />
      <div className="roomListBox">
        <div
          className={`roomLink${!selectedRoomName ? " active" : ""}`}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          🏠 메인페이지
        </div>
        {rooms &&
          Array.isArray(rooms) &&
          rooms.map((room) => {
            const isActive = selectedRoomName === (room.roomname || "");
            return (
              <div
                key={room.roomID || room.id}
                className={"roomLink" + (isActive ? " active" : "")}
                onClick={() => handleRoomClick(room)}
                title={`${room.roomname} (${room.roomtype})`}
                style={{ cursor: "pointer" }}
              >
                📞 {room.roomname}
              </div>
            );
          })}
      </div>
      {/* 프로필 등 UI 유지 */}
      <div className="profileSection">
        <div className="profileCircle"></div>
        <span>Profile</span>
        <button className="settingsIcon" aria-label="Settings"
        onClick={() => navigate("/settings")}
          style={{ cursor: "pointer" }}>
          ⚙️
        </button>
      </div>
    </div>
  );
};

const CallRoom = ({ roomName }) => {
  const [participants] = useState(["Samantha", "jackson", "jennie", "winter"]);
  const [sharing, setSharing] = useState(false);

  return (
    <div className="callPage">
      {/* 참가자 박스 */}
      <div className="userbox">
        {participants.map((user, i) => (
          <div key={i} className="participant">
            <div className="participant-avatar" />
            {user}
          </div>
        ))}
      </div>

      {/* 영상영역 */}
      <div id="local-video" className="screen-share" />

      {/* 버튼들 */}
      <div className="call-controls">
        <button className="btn connect" onClick={() => connectToChannel(roomName)} aria-label="채널 연결">
          📞
        </button>
        <button className="btn disconnect" onClick={leaveChannel} aria-label="채널 연결 해제">
          ✖️
        </button>
        <button
          className="btn share"
          onClick={() => {
            if (sharing) {
              stopScreenShare();
              setSharing(false);
            } else {
              startScreenShare();
              setSharing(true);
            }
          }}
        >
          {sharing ? "화면공유 중지" : "화면공유 시작"}
        </button>
      </div>
    </div>
  );
};


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
    } catch {
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
        <button type="submit" className="createButton">
          방 생성
        </button>
      </form>
    </div>
  );
};

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
          `http://localhost:3000/api/rooms/${matchedRoom.roomID ?? matchedRoom.id}/users`
        )
        .then((res) => {
          if (res.data.success && Array.isArray(res.data.users)) {
            setUsers(res.data.users);
          } else {
            setUsers([]);
          }
        })
        .catch(() => {
          setUsers([]);
        })
        .finally(() => {
          setLoadingUsers(false);
        });
    } else {
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
      {/* <h2>{`통화방: ${currentRoom.roomname}`}</h2> */}
      <CallRoom roomName={currentRoom.roomname} />
      {loadingUsers ? (
        <p>참가자 목록 로딩 중...</p>
      ) : (
        <div
          className="user-boxes"
          style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
           {users.length === 0 ? (
            <p></p>
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

const Setting = () => {
  return (
    <div className="settingContainer">
      <h1 className="settingTitle">설정</h1>
      <section className="settingSection">
        {/* 프로필 */}
        <div className="settingRow">
          <div className="settingProfileInfo">
            <div style={{ fontWeight: 700, marginRight: 12 }}>프로필</div>
            <div className="settingProfileCircle"></div>
            <div className="settingNickname">닉네임</div>
          </div>
          <button className="settingModifyBtn" type="button">수정</button>
        </div>

        {/* 이메일 */}
        <div className="settingRow" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 20 }}>
          <div style={{ fontWeight: 700 }}>이메일</div>
          <button className="settingModifyBtn" type="button">수정</button>
        </div>
        <div style={{ padding: '8px 0 12px 0', fontSize: 16, fontWeight: 400 }}>
          test@test.com
        </div>

        {/* 미디어 장치 */}
        <div className="settingSectionTitle">미디어 장치</div>
        <div className="settingMediaDeviceRow">
          <label htmlFor="input-device" className="settingMediaDeviceLabel">입력 장치</label>
          <select id="input-device" name="input-device" className="settingSelect">
            <option value="">선택하세요</option>
            <option value="mic1">마이크 1</option>
            <option value="mic2">마이크 2</option>
          </select>
        </div>
        <div className="settingMediaDeviceRow">
          <label htmlFor="output-device" className="settingMediaDeviceLabel">출력 장치</label>
          <select id="output-device" name="output-device" className="settingSelect">
            <option value="">선택하세요</option>
            <option value="speaker1">스피커 1</option>
            <option value="speaker2">스피커 2</option>
          </select>
        </div>
        <div className="settingMediaDeviceRow">
          <label htmlFor="camera-device" className="settingMediaDeviceLabel">카메라 장치</label>
          <select id="camera-device" name="camera-device" className="settingSelect">
            <option value="">선택하세요</option>
            <option value="camera1">카메라 1</option>
            <option value="camera2">카메라 2</option>
          </select>
        </div>
      </section>
    </div>
  );
};

    
 

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
        <Sidebar
          rooms={allRooms}
          onSelectRoom={setSelectedRoomName}
          selectedRoomName={selectedRoomName}
        />
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
          <Route path="/profile" element={<Dummy text="프로필 페이지" />} />
          <Route path="/settings" element={<Setting />} />
        </Routes>
      </Router>
    </div>
  );
};

export default MainApp;
