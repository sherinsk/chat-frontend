import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';

function App() {
  const [token, setToken] = React.useState(localStorage.getItem('token') || null);

  const handleLogin = (token) => {
    setToken(token);
    localStorage.setItem('token', token); // Save token to local storage
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token'); // Remove token from local storage
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/chat" /> : <Navigate to="/login" />} />
        <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/chat" />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/chat" />} />
        <Route path="/chat" element={token ? <Chat token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
