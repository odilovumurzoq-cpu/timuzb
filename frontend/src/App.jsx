import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import ClientPortal from './pages/ClientPortal';
import FreelancerView from './pages/FreelancerView';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName');
    const profession = localStorage.getItem('profession');
    
    if (token && role) {
      setUser({ token, role, fullName, profession });
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('fullName', userData.fullName);
    if (userData.profession) localStorage.setItem('profession', Array.isArray(userData.profession) ? userData.profession.join(',') : userData.profession);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('profession');
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
          <Route path="/freelancer/:token" element={<FreelancerView />} />
          
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
