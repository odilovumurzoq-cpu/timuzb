import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send } from 'lucide-react';

export default function TelegramChatModal({ chatPhone, onClose }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatPhone) return;
    
    const fetchChat = async () => {
      setIsChatLoading(true);
      setChatMessages([]);
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const { data } = await axios.get(`/api/telegram/chat/${encodeURIComponent(chatPhone)}`, config);
        if (data.messages) {
          setChatMessages(data.messages.reverse());
        }
      } catch (error) {
        console.error("Xabar olish xatosi:", error);
      } finally {
        setIsChatLoading(false);
      }
    };
    
    fetchChat();
  }, [chatPhone]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !chatPhone) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post(`/api/telegram/chat/${encodeURIComponent(chatPhone)}`, { message: newMessageText }, config);
      setChatMessages([...chatMessages, { text: newMessageText, out: true, id: Date.now() }]);
      setNewMessageText("");
    } catch (error) {
      console.error(error);
      alert("Xabar yuborishda xatolik yuz berdi.");
    }
  };

  if (!chatPhone) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'var(--bg-dark)', width: '90%', maxWidth: '700px', height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', background: '#0088cc', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={18}/> {chatPhone} bilan Chat
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
        </div>
        
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isChatLoading ? (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>Yuklanmoqda... (GramJS)</div>
          ) : chatMessages.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>Xabarlar yo'q yoki mijoz topilmadi.</div>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={msg.id || i} style={{ alignSelf: msg.out ? 'flex-end' : 'flex-start', background: msg.out ? '#0088cc' : 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 15px', borderRadius: '12px', maxWidth: '80%', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {msg.text}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendChatMessage} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="text" 
            value={newMessageText}
            onChange={e => setNewMessageText(e.target.value)}
            placeholder="Xabar yozing..." 
            style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'white' }} 
          />
          <button type="submit" style={{ padding: '10px 15px', borderRadius: '8px', background: '#0088cc', color: 'white', border: 'none', cursor: 'pointer', height: '45px' }}>
            <Send size={18}/>
          </button>
        </form>
      </div>
    </div>
  );
}
