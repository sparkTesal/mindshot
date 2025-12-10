import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import { getToken } from './utils/auth';

function App() {
  const [token, setToken] = useState(getToken());

  // 监听 token 变化
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(getToken());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            token ? <Navigate to="/" replace /> : <LoginPage setToken={setToken} />
          } 
        />
        <Route 
          path="/" 
          element={
            token ? <ChatPage setToken={setToken} /> : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
