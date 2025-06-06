import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import "./App.css";
import React, { useEffect, useState } from "react";
import axios from "axios";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div>
        <input type="text" placeholder="Search Harmony" className="search" />
        <Link to="/" className="navItem">
          🏠 메인페이지
        </Link>
        <Link to="/room/1" className="navItem">
          📞 통화방 1
        </Link>
        <Link to="/room/2" className="navItem">
          📞 통화방 2
        </Link>
        <Link to="/room/3" className="navItem">
          📞 통화방 3
        </Link>
      </div>
      <div className="profileSection">
        <div>⚪</div>
        <Link to="/profile">Profile</Link>
        <Link to="/settings">⚙️</Link>
      </div>
    </div>
  );
};

const RoomCreate = () => {
  return (
    <div className="formWrapper">
      <div className="formBox">
        <h2 style={{ textAlign: "center", marginBottom: 30 }}>방 생성</h2>
        <div className="formGroup">
          <label className="label">방 이름 :</label>
          <input type="text" className="input" placeholder="방 이름 입력" />
        </div>
        <div className="formGroup">
          <label className="label">카테고리 :</label>
          <select className="input">
            <option>카테고리 선택</option>
            <option>업무</option>
            <option>친목</option>
            <option>스터디</option>
          </select>
        </div>
        <button className="button">방 생성</button>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <Routes>
          <Route path="/" element={<RoomCreate />} />
          <Route path="/room/:id" element={<Room />} />
          <Route path="/profile" element={<Dummy text="프로필 페이지" />} />
          <Route path="/settings" element={<Dummy text="설정 페이지" />} />
        </Routes>
      </div>
    </Router>
  );
};

const Room = () => {
  const { id } = useParams(); // URL에서 방 ID 가져오기
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // 서버 API 호출: 방 ID에 해당하는 유저 리스트 받아오기
    axios
      .get(`http://localhost:3001/api/rooms/${id}/users`)
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  return (
    <div className="content">
      <h2>{`통화방 ${id}`}</h2>
      <div
        className="user-boxes"
        style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
      >
        {users.length === 0 && <p>아직 참가자가 없습니다.</p>}
        {users.map((user, index) => (
          <div
            key={index}
            className="user-card"
            style={{
              padding: "10px 20px",
              border: "2px solid #8650a8",
              borderRadius: "12px",
              backgroundColor: "#f3eaff",
              fontWeight: "600",
            }}
          >
            {user.name}
          </div>
        ))}
      </div>
    </div>
  );
};

const Dummy = ({ text }) => (
  <div className="content">
    <h2>{text}</h2>
  </div>
);

export default App;
