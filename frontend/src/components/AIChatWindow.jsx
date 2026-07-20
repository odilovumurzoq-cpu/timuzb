import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Send, Bot } from 'lucide-react';

export default function AIChatWindow({ isOpen, onClose }) {
  const [aiMessageText, setAiMessageText] = useState("");
  const [aiChatMessages, setAiChatMessages] = useState([
    { out: false, text: "Assalomu alaykum! Men TimProduction AI yordamchisiman. Menga 'Bu oy qancha tushum bo'ldi?' yoki 'Jami to'ylar nechta?' kabi savollar berishingiz mumkin." }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiChatMessages, isOpen]);

  const sendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiMessageText.trim()) return;
    const msg = aiMessageText;
    setAiChatMessages([...aiChatMessages, { out: true, text: msg }]);
    setAiMessageText("");
    setIsAiLoading(true);

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.post('/api/ai/chat', { message: msg }, config);
      setAiChatMessages(prev => [...prev, { out: false, text: data.reply }]);
    } catch (err) {
      setAiChatMessages(prev => [...prev, { out: false, text: "Xatolik yuz berdi. Iltimos qayta urinib ko'ring." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', bottom: '90px', right: '20px', width: '350px', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '1rem', background: 'var(--primary)', color: 'white', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={20}/> Tim AI Yordamchi
        </div>
        <X size={20} style={{ cursor: 'pointer' }} onClick={onClose} />
      </div>
      
      <div style={{ height: '350px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {aiChatMessages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.out ? 'flex-end' : 'flex-start', background: msg.out ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem 1rem', borderRadius: '12px', maxWidth: '85%', fontSize: '0.9rem', lineHeight: '1.4' }}>
            {msg.text}
          </div>
        ))}
        {isAiLoading && (
          <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem' }}>
            Yozmoqda...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendAiMessage} style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
        <input 
          type="text" 
          value={aiMessageText}
          onChange={e => setAiMessageText(e.target.value)}
          placeholder="Savolingizni yozing..." 
          style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'white', fontSize: '0.9rem' }} 
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.75rem' }} disabled={isAiLoading}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
