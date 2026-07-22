import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import ClientPortal from './pages/ClientPortal';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName');
    
    if (token && role) {
      setUser({ token, role, fullName });
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('fullName', userData.fullName);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    setUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
          />
          <Route path="/track/:id" element={<ClientPortal />} />
          
          <Route 
            path="/" 
            element={
              !user ? <Navigate to="/login" /> : 
              <main className="main-content">
                {user.role === 'admin' ? <Dashboard user={user} /> : <OperatorDashboard user={user} />}
              </main>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
