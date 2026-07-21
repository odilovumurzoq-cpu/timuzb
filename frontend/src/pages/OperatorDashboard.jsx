import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, MapPin, Users, LayoutDashboard, Send, Wallet, X, Phone, Video, Camera } from 'lucide-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function OperatorDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Foydalanuvchi kasbi: operator/roninchi/fotograf uchun arxiv = "Syomka qilindi" dan boshlanadi
  // Montajyor (editor) uchun arxiv = faqat "Topshirildi"
  const userProfession = user.profession || '';
  const isEditorOnly = userProfession.includes('editor') && !userProfession.includes('operator') && !userProfession.includes('roninchi') && !userProfession.includes('fotograf');

  const activeStatuses = isEditorOnly
    ? ['Kutilmoqda', 'Syomka qilindi', 'Montajda', 'Tayyor']
    : ['Kutilmoqda'];

  const archiveStatuses = isEditorOnly
    ? ['Topshirildi']
    : ['Syomka qilindi', 'Montajda', 'Tayyor', 'Topshirildi'];

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

  const formatUZS = (amount) => {
    if (!amount) return '0 UZS';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' UZS';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Kutilmoqda': return '#f59e0b';
      case 'Syomka qilindi': return '#3b82f6';
      case 'Montajda': return '#8b5cf6';
      case 'Tayyor': return '#10b981';
      case 'Topshirildi': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const calendarEvents = events.map(e => ({
    id: e._id,
    title: e.title || e.clientName || "To'y",
    start: new Date(e.date),
    end: new Date(new Date(e.date).getTime() + 6 * 60 * 60 * 1000),
    resource: e
  }));

  // To'y batafsil ma'lumot komponenti
  const EventDetailCard = ({ event, onClose }) => (
    <div className="modal fade-in">
      <div className="modal-content" style={{ maxWidth: '520px', padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{event.eventType || "To'y"}</div>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{event.title || event.clientName}</h2>
            <div style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
              {new Date(event.date).toLocaleString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)' }}>
          
          {/* Holat */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '20px', alignSelf: 'flex-start' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(event.status) }}></div>
            <span style={{ color: getStatusColor(event.status), fontWeight: 600, fontSize: '0.875rem' }}>{event.status || 'Kutilmoqda'}</span>
          </div>

          {/* Mijoz ma'lumotlari */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Mijoz Ma'lumotlari</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {event.title && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Users size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ color: 'white', fontWeight: 600 }}>{event.title}</span>
                </div>
              )}
              {event.clientName && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Users size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ color: 'white' }}>{event.clientName}</span>
                </div>
              )}
              {event.clientPhone && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Phone size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ color: '#93c5fd' }}>{event.clientPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Manzil */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Joylashuv</div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <MapPin size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ color: 'white', fontWeight: 600 }}>{event.venue}</div>
                {event.location && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{event.location}</div>}
              </div>
            </div>
          </div>

          {/* Xizmat tafsilotlari */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Xizmat Tafsilotlari</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kamera soni</div>
                <div style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Camera size={14} /> {event.cameraCount || 1} ta
                </div>
              </div>
              {event.album && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Albom</div>
                  <div style={{ color: '#fbbf24', fontWeight: 600 }}>📸 {event.album}</div>
                </div>
              )}
              {event.caseType && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keys turi</div>
                  <div style={{ color: '#67e8f9', fontWeight: 600 }}>💼 {event.caseType}</div>
                </div>
              )}
            </div>
            {event.comment && (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                💬 {event.comment}
              </div>
            )}
          </div>

          {/* Moliya (faqat budjet va avans - narx) */}
          <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Moliya</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Umumiy narx</div>
                <div style={{ color: '#4ade80', fontWeight: 700 }}>{formatUZS(event.budget)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Olingan avans</div>
                <div style={{ color: '#86efac', fontWeight: 700 }}>{formatUZS(event.advancePayment)}</div>
              </div>
            </div>
          </div>

          {/* Biriktirilgan xodimlar */}
          {(event.assignedOperators?.length > 0 || event.assignedEditors?.length > 0 || event.assignedRoninchis?.length > 0 || event.assignedPhotographers?.length > 0) && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Biriktirilgan Xodimlar</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {event.assignedOperators?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#28a745', minWidth: '80px' }}>🎥 Kameraman:</span>
                    {event.assignedOperators.map(op => (
                      <span key={op._id || op} style={{ background: 'rgba(40,167,69,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {op.fullName || op}
                      </span>
                    ))}
                  </div>
                )}
                {event.assignedEditors?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#007bff', minWidth: '80px' }}>🎬 Montajyor:</span>
                    {event.assignedEditors.map(op => (
                      <span key={op._id || op} style={{ background: 'rgba(0,123,255,0.15)', color: '#93c5fd', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {op.fullName || op}
                      </span>
                    ))}
                  </div>
                )}
                {event.assignedRoninchis?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#ffc107', minWidth: '80px' }}>🎭 Roninchi:</span>
                    {event.assignedRoninchis.map(op => (
                      <span key={op._id || op} style={{ background: 'rgba(255,193,7,0.15)', color: '#fcd34d', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {op.fullName || op}
                      </span>
                    ))}
                  </div>
                )}
                {event.assignedPhotographers?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#dc3545', minWidth: '80px' }}>📸 Fotograf:</span>
                    {event.assignedPhotographers.map(op => (
                      <span key={op._id || op} style={{ background: 'rgba(220,53,69,0.15)', color: '#fca5a5', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {op.fullName || op}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="dashboard-title">Mening To'ylarim</h1>
      </div>

      {/* Telegram bot ulash */}
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

      {/* Tabs */}
      <div className="tabs-container fade-in-up">
        <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          <LayoutDashboard size={18} /> Mening Vazifalarim
          {events.filter(e => activeStatuses.includes(e.status)).length > 0 && (
            <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem', marginLeft: '6px', fontWeight: 700 }}>
              {events.filter(e => activeStatuses.includes(e.status)).length}
            </span>
          )}
        </button>
        <button className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`} onClick={() => setActiveTab('archive')}>
          📦 Arxiv
          {events.filter(e => archiveStatuses.includes(e.status)).length > 0 && (
            <span style={{ background: '#6b7280', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem', marginLeft: '6px', fontWeight: 700 }}>
              {events.filter(e => archiveStatuses.includes(e.status)).length}
            </span>
          )}
        </button>
        <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <CalendarIcon size={18} /> Kalendar
        </button>
        <button className={`tab-btn ${activeTab === 'salaries' ? 'active' : ''}`} onClick={() => setActiveTab('salaries')}>
          <Wallet size={18} /> Mening Oyligim
        </button>
      </div>

      <div className="tab-content fade-in-up" style={{ marginTop: '1.5rem' }}>

        {/* KALENDAR */}
        {activeTab === 'calendar' && (
          <div className="card" style={{ height: '700px', padding: '1.5rem', background: 'var(--bg-dark)' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', color: 'white' }}
              messages={{ next: "Keyingi", previous: "Oldingi", today: "Bugun", month: "Oy", week: "Hafta", day: "Kun", agenda: "Ro'yxat" }}
              onSelectEvent={(calEvent) => setSelectedEvent(calEvent.resource)}
            />
          </div>
        )}

        {/* ARXIV */}
        {activeTab === 'archive' && (
          <div>
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(107,114,128,0.1)', borderRadius: '12px', border: '1px solid rgba(107,114,128,0.3)', color: '#9ca3af', fontSize: '0.875rem' }}>
              📦 {isEditorOnly ? 'Bu yerda topshirilgan loyihalar ko\'rsatiladi.' : 'Bu yerda syomka qilingan va montajda bo\'lgan loyihalar ko\'rsatiladi. Sizning sahna ishingiz tugagan.'}
            </div>
            <div className="grid grid-cols-3">
              {events.filter(e => archiveStatuses.includes(e.status)).map(event => (
                <div key={event._id} className="card" style={{ border: '1px solid rgba(107,114,128,0.3)', position: 'relative', overflow: 'hidden', cursor: 'pointer', opacity: 0.85 }} onClick={() => setSelectedEvent(event)}>
                  <div style={{ background: getStatusColor(event.status), height: '4px', position: 'absolute', top: 0, left: 0, right: 0 }}></div>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.7rem', background: 'rgba(107,114,128,0.3)', color: '#9ca3af', padding: '2px 8px', borderRadius: '10px' }}>Arxiv</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'white', marginTop: '0.75rem', paddingRight: '60px' }}>{event.title || event.clientName}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{event.eventType}</div>
                  <div className="flex-col" style={{ gap: '0.6rem' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '8px' }}><CalendarIcon size={16} className="text-muted" /></div>
                      <span style={{ fontSize: '0.875rem' }}>{new Date(event.date).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '8px' }}><MapPin size={16} className="text-muted" /></div>
                      <div><div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{event.venue}</div></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(event.status), flexShrink: 0 }}></div>
                      <span style={{ fontSize: '0.8rem', color: getStatusColor(event.status), fontWeight: 600 }}>{event.status}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: '0.8rem', color: '#60a5fa', textAlign: 'center' }}>👆 Batafsil ma'lumot uchun bosing</div>
                </div>
              ))}
            </div>
            {events.filter(e => archiveStatuses.includes(e.status)).length === 0 && (
              <div className="card text-center text-muted" style={{ padding: '4rem 2rem', borderStyle: 'dashed' }}>
                <span style={{ fontSize: '3rem' }}>📦</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', margin: '1rem 0 0.5rem' }}>Arxiv bo'sh</div>
                Hozircha arxivga o'tgan loyihalar yo'q.
              </div>
            )}
          </div>
        )}

        {/* TO'YLAR RO'YXATI */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-3">
            {events.filter(e => activeStatuses.includes(e.status)).map(event => (
              <div key={event._id} className="card" style={{ border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedEvent(event)}>
                
                {/* Status rangli chiziq */}
                <div style={{ background: getStatusColor(event.status), height: '4px', position: 'absolute', top: 0, left: 0, right: 0 }}></div>
                
                {/* Sarlavha */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'white', marginTop: '0.75rem' }}>
                  {event.title || event.clientName}
                </h3>

                {/* Loyiha turi */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{event.eventType}</div>

                <div className="flex-col" style={{ gap: '0.6rem' }}>
                  {/* Sana */}
                  <div className="flex items-center gap-3">
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '8px' }}>
                      <CalendarIcon size={16} className="text-muted" />
                    </div>
                    <span style={{ fontSize: '0.875rem' }}>{new Date(event.date).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Manzil */}
                  <div className="flex items-center gap-3">
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '8px' }}>
                      <MapPin size={16} className="text-muted" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{event.venue}</div>
                      {event.location && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{event.location}</div>}
                    </div>
                  </div>

                  {/* Kamera soni */}
                  <div className="flex items-center gap-3">
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '8px' }}>
                      <Video size={16} className="text-muted" />
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Kamera: <strong style={{ color: 'white' }}>{event.cameraCount || 1} ta</strong></span>
                  </div>

                  {/* Holat */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(event.status), flexShrink: 0 }}></div>
                    <span style={{ fontSize: '0.8rem', color: getStatusColor(event.status), fontWeight: 600 }}>{event.status || 'Kutilmoqda'}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: '0.8rem', color: '#60a5fa', textAlign: 'center' }}>
                  👆 Batafsil ma'lumot uchun bosing
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'events' && events.filter(e => activeStatuses.includes(e.status)).length === 0 && (
          <div className="card text-center text-muted" style={{ padding: '4rem 2rem', borderStyle: 'dashed' }}>
            <CalendarIcon size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Hozircha bo'sh</div>
            Sizga hali faol to'y biriktirilmagan. Dam oling!
          </div>
        )}

        {/* OYLIK */}
        {activeTab === 'salaries' && (
          <div className="card fade-in-up">
            <h2 className="card-title"><Wallet size={20} /> Mening Oyligim</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Bu yerda siz qatnashgan va "Topshirildi" holatiga o'tgan loyihalar uchun yig'ilgan jami oylik ko'rsatiladi.</p>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Loyiha / Mijoz</th>
                    <th>Sana</th>
                    <th>To'yxona</th>
                    <th>Holat</th>
                    <th>Yig'ilgan Oylik (UZS)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let totalSalary = 0;
                    const completedEvents = events.filter(e => e.status === 'Topshirildi');

                    if (completedEvents.length === 0) {
                      return (
                        <tr>
                          <td colSpan="5" className="text-center text-muted">Hozircha oylik hisoblanmagan</td>
                        </tr>
                      );
                    }

                    return (
                      <>
                        {completedEvents.map(event => {
                          let earned = 0;
                          let roles = [];
                          if (event.assignedOperators?.some(u => u._id === user.id || u === user.id)) {
                            earned += (event.operatorFee || 0) / (event.assignedOperators?.length || 1);
                            roles.push('Kameraman');
                          }
                          if (event.assignedEditors?.some(u => u._id === user.id || u === user.id)) {
                            earned += (event.editorFee || 0) / (event.assignedEditors?.length || 1);
                            roles.push('Montajyor');
                          }
                          if (event.assignedRoninchis?.some(u => u._id === user.id || u === user.id)) {
                            earned += (event.roninFee || 0) / (event.assignedRoninchis?.length || 1);
                            roles.push('Roninchi');
                          }
                          if (event.assignedPhotographers?.some(u => u._id === user.id || u === user.id)) {
                            earned += (event.photoFee || 0) / (event.assignedPhotographers?.length || 1);
                            roles.push('Fotograf');
                          }
                          totalSalary += earned;

                          return (
                            <tr key={event._id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{event.eventType}</div>
                                <div className="text-muted" style={{ fontSize: '0.875rem' }}>{event.clientName} ({roles.join(', ')})</div>
                              </td>
                              <td>{new Date(event.date).toLocaleDateString('uz-UZ')}</td>
                              <td>{event.venue}</td>
                              <td><span className="status-badge" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>Topshirildi</span></td>
                              <td style={{ fontWeight: 600, color: '#4ade80' }}>{earned.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>Jami Oylik:</td>
                          <td style={{ fontWeight: 700, fontSize: '1.2rem', color: '#4ade80' }}>{totalSalary.toLocaleString()} UZS</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* To'y batafsil ma'lumot modali */}
      {selectedEvent && (
        <EventDetailCard event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}

export default OperatorDashboard;
