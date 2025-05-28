import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div style={styles.sidebar}>
      <div>
        <input type="text" placeholder="Search Harmony" style={styles.search} />
        <Link to="/" style={styles.navItem}>🏠 메인페이지</Link>
        <Link to="/room/1" style={styles.navItem}>📞 통화방 1</Link>
        <Link to="/room/2" style={styles.navItem}>📞 통화방 2</Link>
        <Link to="/room/3" style={styles.navItem}>📞 통화방 3</Link>
      </div>
      <div style={styles.profileSection}>
        <div>⚪</div>
        <Link to="/profile">Profile</Link>
        <Link to="/settings">⚙️</Link>
      </div>
    </div>
  );
};

const RoomCreate = () => {
  return (
    <div style={styles.formWrapper}>
      <div style={styles.formBox}>
        <h2 style={{ textAlign: 'center', marginBottom: 30 }}>방 생성</h2>
        <div style={styles.formGroup}>
          <label style={styles.label}>방 이름 :</label>
          <input type="text" style={styles.input} placeholder="방 이름 입력" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>카테고리 :</label>
          <select style={styles.input}>
            <option>카테고리 선택</option>
            <option>업무</option>
            <option>친목</option>
            <option>스터디</option>
          </select>
        </div>
        <button style={styles.button}>방 생성</button>
      </div>
    </div>
  );
};


const App = () => {
  return (
    <Router>
      <div style={styles.app}>
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
  const { id } = useParams();
  return <div style={styles.content}><h2>{`통화방 ${id}`}</h2></div>;
};

const Dummy = ({ text }) => <div style={styles.content}><h2>{text}</h2></div>;

const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    border: '4px solid #a88cc8'
  },
  sidebar: {
    width: 260,
    backgroundColor: '#f3f1f9',
    borderRight: '2px solid #a88cc8',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  search: {
    padding: 8,
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#eae6f3',
    marginBottom: 20,
    width: '100%'
  },
  navItem: {
    display: 'block',
    padding: '10px 12px',
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#eae6f3',
    textDecoration: 'none',
    color: 'black'
  },
  profileSection: {
    backgroundColor: '#c5bed9',
    borderRadius: 10,
    padding: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  formWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formBox: {
    border: '1px solid #333',
    borderRadius: 10,
    padding: 40,
    width: 500
  },
  formGroup: {
    marginBottom: 25,
    display: 'flex',
    alignItems: 'center'
  },
  label: {
    width: 120,
    fontSize: 18
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
    border: '1px solid #aaa'
  },
  button: {
    backgroundColor: '#8650a8',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    fontSize: 16,
    borderRadius: 10,
    float: 'right',
    cursor: 'pointer'
  },
  content: {
    flex: 1,
    padding: 40
  }
};

export default App;

