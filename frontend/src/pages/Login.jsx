import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Video } from 'lucide-react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const telegramWrapperRef = useRef(null);

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.post('/api/auth/telegram', user);
        onLogin(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Telegram orqali ulanishda xatolik. Avval tizimga kiritilganingizga ishonch hosil qiling.');
        setLoading(false);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'timinnotificationbot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    if (telegramWrapperRef.current) {
      telegramWrapperRef.current.appendChild(script);
    }

    return () => {
      if (telegramWrapperRef.current) {
        telegramWrapperRef.current.innerHTML = '';
      }
      delete window.onTelegramAuth;
    };
  }, [onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/login', { username, password });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Xatolik yuz berdi. Backend bilan ulanishni tekshiring.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay"></div>
      <div className="login-card fade-in-up">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="logo-icon-wrap pulse-anim">
            <Video size={40} color="white" />
          </div>
        </div>
        <h2 className="login-title">TIMPRODUCTION</h2>
        <p className="login-subtitle">Rejalashtirish Tizimi</p>
        
        {error && <div className="error-message shake-anim">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Login</label>
            <input 
              type="text" 
              className="form-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
              placeholder="admin"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Parol</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-login" disabled={loading}>
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>Yoki Telegram orqali kiring</p>
          <div ref={telegramWrapperRef} style={{ display: 'flex', justifyContent: 'center' }}></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
