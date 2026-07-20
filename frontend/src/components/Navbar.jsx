import React from 'react';
import { LogOut, Video } from 'lucide-react';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Video size={28} color="var(--primary)" />
        TIMPRODUCTION
      </div>
      <div className="nav-links">
        <span style={{ fontWeight: 500 }}>{user.fullName} <span className="badge" style={{ marginLeft: '0.5rem' }}>{user.role === 'admin' ? 'BOSH KOORDINATOR' : 'OPERATOR'}</span></span>
        <button className="btn btn-outline" onClick={onLogout} style={{ padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Chiqish
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
