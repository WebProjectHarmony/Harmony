import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

// Sidebar 컴포넌트 (사이드바 너비 200px로 조정)
const Sidebar = ({ rooms }) => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <input type="text" placeholder="Search Harmony" className="search" />
      <div className="roomListBox">
        <Link
          to="/"
          className={`roomLink${location.pathname === "/" ? " active" : ""}`}
        >
          <span role="img" aria-label="home" className="icon">
            🏠
          </span>{" "}
          메인페이지
        </Link>

        {rooms && Array.isArray(rooms) && rooms.map((room) => {
          const path = `/server/${room.roomID || room.id}`;
          const isActive = location.pathname === path;

          return (
            <Link
              key={room.roomID || room.id}
              to={path}
              className={`roomLink${isActive ? " active" : ""}`}
              title={`${room.roomname} (${room.roomtype})`}
            >
              <span className="icon" role="img" aria-label="room-phone">
                📞
              </span>
              {room.roomname}
            </Link>
          );
        })}
        {(!rooms || rooms.length === 0) && (
          <div className="roomLink placeholder">
            <span className="icon">...</span> 방 목록 로딩 중
          </div>
        )}
      </div>
      <div className="profileSection">
        <div className="profileCircle"></div>
        <span>Profile</span>
        <button className="settingsIcon" aria-label="Settings">
          ⚙️
        </button>
      </div>
    </div>
  );
};

// RoomPage 컴포넌트 (방 생성 및 기본 화면)
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
        createdby: "admin",
      });
      if (response.data.success) {
        const newRoomID = response.data.roomID;
        if (newRoomID) {
          await refreshRoomList();
          navigate(`/server/${newRoomID}`);
        } else {
          await refreshRoomList();
          setRoomName("");
        }
      } else {
        alert("방 생성 실패: " + response.data.message);
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
        <p>새로운 방을 생성해주세요.</p>
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

// Room 컴포넌트 (특정 방 상세 페이지)
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
            matchedRoom.roomID || matchedRoom.id
          }/users`
        )
        .then((res) => {
          if (res.data.success && Array.isArray(res.data.users)) {
            setUsers(res.data.users);
          } else {
            console.warn(
              `API call for users in room ${
                matchedRoom.roomID || matchedRoom.id
              } failed or returned unexpected data:`,
              res.data
            );
            setUsers([]);
          }
        })
        .catch((err) => {
          console.error(
            `${matchedRoom.roomID || matchedRoom.id} 방 유저 목록 불러오기 실패:`,
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

const Dummy = ({ text }) => (
  <div className="content">
    <h2>{text}</h2>
  </div>
);

const App = () => {
  const [allRooms, setAllRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const fetchRooms = () => {
    setLoadingRooms(true);
    axios
      .get("http://localhost:3000/fetchroom")
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.rooms)) {
          console.log("--- 서버에서 불러온 채팅방 목록 ---");
          res.data.rooms.forEach((room) => {
            console.log("방 상세 정보:", room);
          });
          console.log("-------------------------------");
          setAllRooms(res.data.rooms);
        } else {
          console.warn(
            "fetchRooms: 응답 성공이 아니거나 rooms가 배열이 아닙니다.",
            res.data
          );
          setAllRooms([]);
        }
      })
      .catch((error) => {
        console.error("전역 방 목록 로드 실패:", error);
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
    <Router>
      <div className="app">
        <Sidebar rooms={allRooms} />

        {loadingRooms ? (
          <div className="content">
            <h2>방 목록을 불러오는 중입니다...</h2>
          </div>
        ) : (
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
            <Route path="/settings" element={<Dummy text="설정 페이지" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;