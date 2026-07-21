import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, MapPin, Video, LayoutDashboard, Send, Link as LinkIcon, Save, Edit2 } from 'lucide-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function OperatorDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('events'); // 'calendar', 'events'
  const [events, setEvents] = useState([]);
  
  const [editingLink, setEditingLink] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/events', config);
      setEvents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/events/${eventId}/status`, { status: newStatus }, config);
      fetchData();
    } catch (error) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleLinkSave = async (eventId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/events/${eventId}/status`, { videoLink: editingLink[eventId] }, config);
      alert("Havola saqlandi!");
      fetchData();
    } catch (error) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleTaskComplete = async (eventId) => {
    if (!window.confirm("Rostdan ham o'z vazifangizni tugatdingizmi? Bu oyligingizga qo'shiladi.")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/events/${eventId}/task`, {}, config);
      alert("Vazifa muvaffaqiyatli topshirildi!");
      fetchData();
    } catch (error) {
      alert("Xatolik yuz berdi");
    }
  };

  const calendarEvents = events.map(e => ({
    id: e._id,
    title: `${e.title} (${e.venue})`,
    start: new Date(e.date),
    end: new Date(new Date(e.date).getTime() + 6 * 60 * 60 * 1000),
    resource: e
  }));

  return (
    <div>
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="dashboard-title">Mening To'ylarim</h1>
      </div>

      <div className="card fade-in-up" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)', borderColor: 'var(--primary)', display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2.5rem', padding: '1.5rem 2rem' }}>
        <div style={{ background: 'var(--primary)', padding: '1rem', borderRadius: '50%', display: 'flex' }}>
          <Send color="white" size={28} />
        </div>
        <div>
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '0.25rem', fontSize: '1.25rem' }}>Telegram bildirishnomalarini yoqish</h3>
          <p className="text-muted" style={{ fontSize: '0.95rem' }}>
            To'ylardan bir kun oldin avtomatik xabar olishingiz uchun Telegram botga kirib quyidagi buyruqni yuboring:
          </p>
          <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', color: '#93c5fd', marginTop: '0.75rem', display: 'inline-block', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            /start {user.username}
          </code>
        </div>
      </div>

      <div className="tabs-container fade-in-up">
        <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          <LayoutDashboard size={18} /> Vazifalar (To'ylar)
        </button>
        <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <CalendarIcon size={18} /> Kalendar
        </button>
      </div>

      <div className="tab-content fade-in-up" style={{ marginTop: '1.5rem' }}>
        
        {activeTab === 'calendar' && (
          <div className="card" style={{ height: '700px', padding: '1.5rem', background: 'var(--bg-dark)' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', color: 'white' }}
              messages={{ next: "Keyingi", previous: "Oldingi", today: "Bugun", month: "Oy", week: "Hafta", day: "Kun", agenda: "Ro'yxat" }}
            />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="grid grid-cols-3">
            {events.map(event => (
              <div key={event._id} className="card" style={{ border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(90deg, var(--primary), #8b5cf6)', height: '4px', position: 'absolute', top: 0, left: 0, right: 0 }}></div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'white', marginTop: '0.5rem' }}>{event.title}</h3>
                
                <div className="flex-col" style={{ gap: '0.85rem' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                      <CalendarIcon size={18} className="text-muted" />
                    </div>
                    <span style={{ fontWeight: 500 }}>{new Date(event.date).toLocaleString('uz-UZ', { dateStyle: 'full', timeStyle: 'short' })}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                      <MapPin size={18} className="text-muted" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{event.venue}</div>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>{event.location}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <label className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>HOLAT (STATUS):</label>
                  <select 
                    className="form-input" 
                    value={event.status || 'Kutilmoqda'} 
                    onChange={(e) => handleStatusChange(event._id, e.target.value)}
                    style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                  >
                    <option value="Kutilmoqda">Kutilmoqda</option>
                    <option value="Syomka qilindi">Syomka qilindi</option>
                    <option value="Montajda">Montajda</option>
                    <option value="Tayyor">Tayyor</option>
                    <option value="Topshirildi">Topshirildi</option>
                  </select>
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <label className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>TAYYOR VIDEO HAVOLASI (YOUTUBE/DRIVE):</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="https://..." 
                      value={editingLink[event._id] !== undefined ? editingLink[event._id] : (event.videoLink || '')}
                      onChange={(e) => setEditingLink({...editingLink, [event._id]: e.target.value})}
                      style={{ padding: '0.5rem', fontSize: '0.875rem', flex: 1 }}
                    />
                    <button className="btn" onClick={() => handleLinkSave(event._id)} style={{ padding: '0.5rem' }}>
                      <Save size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 text-center">
                  {event.completedTasks && event.completedTasks.find(t => t.userId === user.id) ? (
                    <div style={{ color: 'var(--success)', fontWeight: 600, padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                      ✅ Siz bu loyihani topshirgansiz
                    </div>
                  ) : (
                    <button className="btn btn-success" onClick={() => handleTaskComplete(event._id)} style={{ width: '100%', padding: '0.75rem' }}>
                      O'z vazifamni topshirdim
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'events' && events.length === 0 && (
          <div className="card text-center text-muted" style={{ padding: '4rem 2rem', borderStyle: 'dashed' }}>
            <CalendarIcon size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Hozircha bo'sh</div>
            Sizga hali to'y biriktirilmagan. Dam oling!
          </div>
        )}
      </div>
    </div>
  );
}

export default OperatorDashboard;
