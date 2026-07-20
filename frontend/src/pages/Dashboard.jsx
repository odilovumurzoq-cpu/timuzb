import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Calendar as CalendarIcon, Users, MapPin, Video, LayoutDashboard, Save, X, BarChart2, BarChart3, Clock, DollarSign, LogOut, CheckCircle, Search, MessageCircle, Send, Link as LinkIcon, Star, Copy, Archive, ListTodo, ExternalLink, Download, Wallet, Sun, Moon, Smartphone } from 'lucide-react';
import AIChatWindow from '../components/AIChatWindow';
import TelegramChatModal from '../components/TelegramChatModal';
import { MessageCircle, Bot } from 'lucide-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';

const localizer = momentLocalizer(moment);

function Dashboard({ user }) {
  
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatPhone, setChatPhone] = useState(null);

  const [activeTab, setActiveTab] = useState('analytics'); // calendar, events, operators, analytics, finance, kanban, expenses
  const [events, setEvents] = useState([]);
  const [operators, setOperators] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [expenses, setExpenses] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('dark');
  const [adminSettings, setAdminSettings] = useState({ password: '', telegramUsername: '' });

  const formatUZS = (amount) => {
    if (!amount) return '0 UZS';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' UZS';
  };

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : '';
  }, [theme]);

  const [newOp, setNewOp] = useState({ username: '', password: '', fullName: '', telegramUsername: '', professions: ["operator"] });
  const [editOpId, setEditOpId] = useState(null);

  const [newEvent, setNewEvent] = useState({ 
    title: '', eventType: "To'y", date: '', location: '', venue: '', cameraCount: 1, assignedOperators: [], assignedEditors: [], assignedRoninchis: [], assignedPhotographers: [],
    clientName: '', clientPhone: '', budget: 0, advancePayment: 0, status: 'Kutilmoqda', comment: '', album: '', caseType: '' 
  });
  const [editEventId, setEditEventId] = useState(null);

  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, date: '' });

  const [chatPhone, setChatPhone] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsPhone, setSmsPhone] = useState(null);
  const [smsText, setSmsText] = useState("");

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessageText, setAiMessageText] = useState("");
  const [aiChatMessages, setAiChatMessages] = useState([
    { out: false, text: "Assalomu alaykum! Men TimProduction AI yordamchisiman. Menga 'Bu oy qancha tushum bo'ldi?' kabi savollar berishingiz mumkin." }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const sendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiMessageText.trim()) return;
    const msg = aiMessageText;
    setAiChatMessages(prev => [...prev, { out: true, text: msg }]);
    setAiMessageText("");
    setIsAiLoading(true);
    
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.post('/api/ai-chat', { message: msg }, config);
      setAiChatMessages(prev => [...prev, { out: false, text: data.reply }]);
    } catch (err) {
      setAiChatMessages(prev => [...prev, { out: false, text: "Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [eventsRes, operatorsRes, analyticsRes, expensesRes] = await Promise.all([
        axios.get('/api/events', config),
        axios.get('/api/operators', config),
        axios.get('/api/analytics', config),
        axios.get('/api/expenses', config)
      ]);
      setEvents(eventsRes.data);
      setOperators(operatorsRes.data);
      setAnalytics(analyticsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddOperator = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editOpId) {
        await axios.put(`/api/operators/${editOpId}`, newOp, config);
      } else {
        await axios.post('/api/operators', newOp, config);
      }
      setNewOp({ username: '', password: '', fullName: '', telegramUsername: '', professions: ["operator"] });
      setEditOpId(null);
      fetchData();
    } catch (error) {
      alert("Xatolik");
    }
  };

  const handleEditOperator = (op) => {
    setEditOpId(op._id);
    setNewOp({ username: op.username, password: '', fullName: op.fullName, telegramUsername: op.telegramUsername || '', professions: op.professions || ["operator"] });
    setActiveTab('operators');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditOperator = () => {
    setEditOpId(null);
    setNewOp({ username: '', password: '', fullName: '', telegramUsername: '', professions: ["operator"] });
  };

  const handleDeleteOperator = async (id) => {
    if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/operators/${id}`, config);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const payload = { ...newEvent };
      if (payload.date && !payload.date.includes('+') && !payload.date.includes('Z')) {
        payload.date = new Date(payload.date).toISOString();
      }

      if (editEventId) {
        await axios.put(`/api/events/${editEventId}`, payload, config);
      } else {
        await axios.post('/api/events', payload, config);
      }
      setNewEvent({ title: '', eventType: "To'y", date: '', location: '', venue: '', cameraCount: 1, assignedOperators: [], assignedEditors: [], assignedRoninchis: [], assignedPhotographers: [], clientName: '', clientPhone: '', budget: 0, advancePayment: 0, status: 'Kutilmoqda', comment: '', album: '', caseType: '' });
      setEditEventId(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditEvent = (event) => {
    setEditEventId(event._id);
    const dateStr = new Date(event.date);
    const offset = dateStr.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dateStr - offset)).toISOString().slice(0, 16);
    
    setNewEvent({
      title: event.title,
      eventType: event.eventType || "To'y",
      date: localISOTime,
      location: event.location,
      venue: event.venue,
      cameraCount: event.cameraCount,
      assignedOperators: event.assignedOperators.map(op => op._id),
      assignedEditors: event.assignedEditors ? event.assignedEditors.map(op => op._id) : [],
      assignedRoninchis: event.assignedRoninchis ? event.assignedRoninchis.map(op => op._id) : [],
      assignedPhotographers: event.assignedPhotographers ? event.assignedPhotographers.map(op => op._id) : [],
      clientName: event.clientName || '',
      clientPhone: event.clientPhone || '',
      budget: event.budget || 0,
      advancePayment: event.advancePayment || 0,
      status: event.status || 'Kutilmoqda',
      comment: event.comment || '',
      album: event.album || '',
      caseType: event.caseType || ''
    });
    setActiveTab('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditEvent = () => {
    setEditEventId(null);
    setNewEvent({ title: '', eventType: "To'y", date: '', location: '', venue: '', cameraCount: 1, assignedOperators: [], assignedEditors: [], assignedRoninchis: [], assignedPhotographers: [], clientName: '', clientPhone: '', budget: 0, advancePayment: 0, status: 'Kutilmoqda', comment: '', album: '', caseType: '' });
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/events/${id}`, config);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/expenses', newExpense, config);
      setNewExpense({ description: '', amount: 0, date: '' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Xarajatni o'chirmoqchimisiz?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/expenses/${id}`, config);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOperatorSelect = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setNewEvent({ ...newEvent, assignedOperators: options });
  };

  const handleOperatorCheckbox = (opId) => {
    let updatedOps = [...newEvent.assignedOperators];
    if (updatedOps.includes(opId)) {
      updatedOps = updatedOps.filter(id => id !== opId);
    } else {
      updatedOps.push(opId);
    }
    setNewEvent({ ...newEvent, assignedOperators: updatedOps });
  };

  const handleEditorCheckbox = (opId) => {
    let updatedOps = [...newEvent.assignedEditors];
    if (updatedOps.includes(opId)) {
      updatedOps = updatedOps.filter(id => id !== opId);
    } else {
      updatedOps.push(opId);
    }
    setNewEvent({ ...newEvent, assignedEditors: updatedOps });
  };

  const handleRoninchiCheckbox = (opId) => {
    let updatedOps = [...newEvent.assignedRoninchis];
    if (updatedOps.includes(opId)) {
      updatedOps = updatedOps.filter(id => id !== opId);
    } else {
      updatedOps.push(opId);
    }
    setNewEvent({ ...newEvent, assignedRoninchis: updatedOps });
  };

  const handleFotografCheckbox = (opId) => {
    let updatedOps = [...newEvent.assignedPhotographers];
    if (updatedOps.includes(opId)) {
      updatedOps = updatedOps.filter(id => id !== opId);
    } else {
      updatedOps.push(opId);
    }
    setNewEvent({ ...newEvent, assignedPhotographers: updatedOps });
  };

  const exportToExcel = () => {
    const dataToExport = filteredEvents.map(e => ({
      "Mijoz Ismi": e.clientName || e.title,
      "To'y Sanasi": new Date(e.date).toLocaleDateString('uz-UZ'),
      "Telefon": e.clientPhone,
      "Umumiy Narx (UZS)": e.budget,
      "Berilgan Avans (UZS)": e.advancePayment,
      "Qarz (UZS)": (e.budget || 0) - (e.advancePayment || 0),
      "Holat": e.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Moliyaviy Hisobot");
    XLSX.writeFile(workbook, "Moliya_Mijozlar_Hisoboti.xlsx");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put('/api/admin/settings', adminSettings, config);
      alert('Sozlamalar muvaffaqiyatli saqlandi!');
      setAdminSettings({ password: '', telegramUsername: '' });
    } catch (err) {
      alert('Sozlamalarni saqlashda xatolik yuz berdi.');
    }
  };

  const openChat = async (eventObj) => {
    const phone = (eventObj.clientPhone || "").replace(/\D/g, '');
    if (!phone) return alert("Mijoz raqami kiritilmagan!");
    
    let text = "";
    if (eventObj.status === 'Topshirildi') {
      text = `Assalomu Alaykum 🌟\n\nSizning Videongiz tayyor bo'ldi! 🎉\n\nIltimos, Tim ofisidan kelib olib keting. 📍\n\nLoyihangiz: ${eventObj.eventType || "To'y"}\nSana: ${new Date(eventObj.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n\nTimProduction xizmatidan foydalanganingiz uchun rahmat! 😊`;
    } else {
      const formattedDate = new Date(eventObj.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      text = `Assalomu alaykum, ${eventObj.clientName || 'Mijoz'}!\nTimProduction sizning buyurtmangizni qabul qildi.\n\nTadbir: ${eventObj.eventType}\nSana: ${formattedDate}\nKamera soni: ${eventObj.cameraCount || 1} ta\n`;
      if (eventObj.assignedRoninchis && eventObj.assignedRoninchis.length > 0) text += `Roninchi: Bor\n`;
      if (eventObj.assignedPhotographers && eventObj.assignedPhotographers.length > 0) text += `Fotograf: Bor\n`;
      if (eventObj.album) text += `Albom: ${eventObj.album}\n`;
      if (eventObj.caseType) text += `Keys: ${eventObj.caseType}\n`;
      if (eventObj.budget) text += `\nUmumiy summa: ${eventObj.budget.toLocaleString()} so'm\n`;
      if (eventObj.advancePayment) text += `Berilgan avans: ${eventObj.advancePayment.toLocaleString()} so'm\n`;
      text += `\nTadbir kuni xizmat ko'rsatuvchilar yetib borishadi. Ishonchingiz uchun rahmat!`;
    }

    setNewMessageText(text);

    setChatPhone(phone);
    setIsChatLoading(true);
    setChatMessages([]);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get(`/api/telegram/chat/${encodeURIComponent(phone)}`, config);
      setChatMessages(data.reverse() || []);
    } catch (error) {
      console.error(error);
      alert("Chat tarixini olishda xatolik. Userbot ulanmagan bo'lishi mumkin.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const openSmsModal = (event) => {
    const formattedDate = new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let text = `Assalomu alaykum, ${event.clientName || 'Mijoz'}!\nTimProduction sizning buyurtmangizni qabul qildi.\n\nTadbir: ${event.eventType}\nSana: ${formattedDate}\nKamera soni: ${event.cameraCount || 1} ta\n`;
    if (event.assignedRoninchis && event.assignedRoninchis.length > 0) text += `Roninchi: Bor\n`;
    if (event.assignedPhotographers && event.assignedPhotographers.length > 0) text += `Fotograf: Bor\n`;
    if (event.album) text += `Albom: ${event.album}\n`;
    if (event.caseType) text += `Keys: ${event.caseType}\n`;
    
    if (event.budget) text += `\nUmumiy summa: ${event.budget.toLocaleString()} so'm\n`;
    if (event.advancePayment) text += `Berilgan avans: ${event.advancePayment.toLocaleString()} so'm\n`;
    
    text += `\nTadbir kuni xizmat ko'rsatuvchilar yetib borishadi. Ishonchingiz uchun rahmat!`;
    
    setSmsText(text);
    setSmsPhone(event.clientPhone);
    setSmsModalOpen(true);
  };

  const sendSmsMessage = async () => {
    if (!smsPhone || !smsText.trim()) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('/api/sms/send', { phone: smsPhone, message: smsText }, config);
      alert("SMS muvaffaqiyatli yuborildi!");
      setSmsModalOpen(false);
    } catch (err) {
      alert("SMS yuborishda xatolik yuz berdi.");
    }
  };

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

  const handleShareTelegram = async (event) => {
    if (!window.confirm("Barcha biriktirilgan operatorlarga avtomatik xabar yuborilsinmi?")) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/events/${event._id}/send`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const filteredEvents = events.filter(e => 
    (e.title && e.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (e.clientName && e.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.clientPhone && e.clientPhone.toString().includes(searchQuery)) ||
    (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const calendarEvents = filteredEvents.map(e => ({
    id: e._id,
    title: `${e.title} (${e.venue})`,
    start: new Date(e.date),
    end: new Date(new Date(e.date).getTime() + 2 * 60 * 60 * 1000), // 2 hours duration
    resource: e
  }));

  const kanbanColumns = ['Kutilmoqda', 'Syomka qilindi', 'Montajda', 'Tayyor', 'Topshirildi'];

  return (
    <div>
      <div className="dashboard-header" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', display: 'flex' }}>
        <h1 className="dashboard-title">Boshqaruv Paneli</h1>
        <div className="flex gap-4 items-center flex-1 justify-end">
          <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Qidiruv (Ism, To'yxona...)" 
              className="form-input" 
              style={{ paddingLeft: '35px', borderRadius: '20px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" style={{ borderRadius: '50%', padding: '0.6rem' }} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <div className="tabs-container fade-in-up" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <BarChart2 size={18} /> Statistika
        </button>
        <button className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
          <DollarSign size={18} /> Moliya & Mijozlar
        </button>
        <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
          <Wallet size={18} /> Xarajatlar
        </button>
        <button className={`tab-btn ${activeTab === 'kanban' ? 'active' : ''}`} onClick={() => setActiveTab('kanban')}>
          <ListTodo size={18} /> Montaj (Kanban)
        </button>
        <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <CalendarIcon size={18} /> Kalendar
        </button>
        <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          <LayoutDashboard size={18} /> To'ylar
        </button>
        <button className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`} onClick={() => setActiveTab('archive')}>
          <Archive size={18} /> Arxiv
        </button>
        <button className={`tab-btn ${activeTab === 'operators' ? 'active' : ''}`} onClick={() => setActiveTab('operators')}>
          <Users size={18} /> Xodimlar
        </button>
        <button className={`tab-btn ${activeTab === 'salaries' ? 'active' : ''}`} onClick={() => setActiveTab('salaries')}>
          <Wallet size={18} /> Oyliklar
        </button>
        {user?.role === 'admin' && (
          <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <LayoutDashboard size={18} /> Sozlamalar
          </button>
        )}
      </div>

      <div className="tab-content" style={{ marginTop: '1.5rem' }}>
        
        {/* STATISTIKA */}
        {activeTab === 'analytics' && analytics && (
          <div className="fade-in-up">
            <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
              <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>UMUMIY TO'YLAR</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>{analytics.totalEvents} ta</div>
              </div>
              <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>TUSHUMLAR</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>{formatUZS(analytics.totalBudget)}</div>
              </div>
              <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <div className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>XARAJATLAR</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>{formatUZS(analytics.totalExpense)}</div>
              </div>
              <div className="card" style={{ borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
                <div className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fcd34d' }}>SOF FOYDA (NET PROFIT)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{formatUZS(analytics.netProfit)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginTop: '2rem' }}>
              <div className="card">
                <h2 className="card-title mb-4">Oylik Moliyaviy Analitika</h2>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={analytics.monthlyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="budget" name="Tushum (UZS)" fill="var(--success)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Xarajat (UZS)" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Sof Foyda (UZS)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h2 className="card-title mb-4"><Star size={20} color="#f59e0b" /> Top Operatorlar Reytingi</h2>
                <div className="flex-col gap-3">
                  {operators.map(op => {
                    const opsEvents = events.filter(e => e.assignedOperators && e.assignedOperators.some(assignedOp => assignedOp && (assignedOp._id || assignedOp) === op._id));
                    const completedOpsEvents = opsEvents.filter(e => e.status === 'Topshirildi');
                    return { ...op, eventCount: opsEvents.length, completedCount: completedOpsEvents.length };
                  }).sort((a, b) => b.eventCount - a.eventCount).slice(0, 5).map((op, idx) => (
                    <div key={op._id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'white' }}>{op.fullName}</div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>Jami qatnashgan: {op.eventCount} ta</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>{op.completedCount} topshirdi</div>
                      </div>
                    </div>
                  ))}
                  {operators.length === 0 && <div className="text-muted text-center" style={{padding: '1rem'}}>Ma'lumot yo'q</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* XARAJATLAR */}
        {activeTab === 'expenses' && (
          <div className="grid grid-cols-2 fade-in-up" style={{alignItems: 'start'}}>
            <div className="card">
              <h2 className="card-title"><Wallet size={20} /> Xarajat Qo'shish</h2>
              <form onSubmit={handleAddExpense}>
                <div className="form-group">
                  <label className="form-label">Xarajat nomi (M-n: Kamera arendasi, Ofis ijara)</label>
                  <input type="text" className="form-input" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Summa (UZS)</label>
                    <input type="number" min="0" className="form-input" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: parseInt(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sana</label>
                    <input type="date" className="form-input" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} required />
                  </div>
                </div>
                <button type="submit" className="btn w-full" style={{justifyContent: 'center'}}>
                  <Plus size={16} /> Qo'shish
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="card-title">Oxirgi Xarajatlar</h2>
              <div className="flex-col gap-3">
                {expenses.map(exp => (
                  <div key={exp._id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{exp.description}</div>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>{new Date(exp.date).toLocaleDateString('uz-UZ')}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>-{formatUZS(exp.amount)}</span>
                      <button className="btn btn-danger" onClick={() => handleDeleteExpense(exp._id)} style={{ padding: '0.4rem' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && <div className="text-center text-muted" style={{padding: '1rem'}}>Hali xarajatlar yo'q</div>}
              </div>
            </div>
          </div>
        )}

        {/* MOLIYA VA MIJOZLAR */}
        {activeTab === 'finance' && (
          <div className="card fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title" style={{ margin: 0 }}>Moliya va Mijozlar Bazasi</h2>
              <button className="btn btn-success" onClick={exportToExcel} style={{ background: '#10b981', color: 'white', borderColor: '#10b981' }}>
                <Download size={18} /> Excel ga Yuklash
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'white' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem 0' }}>Mijoz</th>
                    <th>To'y sanasi</th>
                    <th>Telefon & Aloqa</th>
                    <th>Umumiy Narx</th>
                    <th>Avans</th>
                    <th>Qarz</th>
                    <th>Harakat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => (
                    <tr key={event._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem 0', fontWeight: 600 }}>{event.clientName || event.title}</td>
                      <td>{new Date(event.date).toLocaleDateString('uz-UZ')}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span>{event.clientPhone || '-'}</span>
                          {event.clientPhone && (
                            <a href={`https://wa.me/${event.clientPhone.replace(/[^0-9]/g, '')}?text=Assalomu alaykum! TimProduction jamoasi to'yingizga tayyor. Shartlarni kelishib olsak degandik...`} target="_blank" rel="noreferrer" title="WhatsApp orqali yozish" style={{ color: '#25D366' }}>
                              <MessageCircle size={18} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--success)' }}>{formatUZS(event.budget)}</td>
                      <td>{formatUZS(event.advancePayment)}</td>
                      <td style={{ color: (event.budget - event.advancePayment > 0) ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {formatUZS(event.budget - event.advancePayment)}
                      </td>
                      <td>
                        <button className="btn btn-outline" onClick={() => handleEditEvent(event)} style={{ padding: '0.4rem', border: 'none' }}><Edit size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr><td colSpan="7" className="text-center text-muted" style={{ padding: '2rem' }}>Ma'lumot yo'q</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MONTAGE KANBAN */}
        {activeTab === 'kanban' && (
          <div className="kanban-board fade-in-up">
            {kanbanColumns.map(column => (
              <div key={column} className="kanban-column">
                <div className="kanban-column-title">
                  {column}
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {filteredEvents.filter(e => e.status === column).length}
                  </span>
                </div>
                {filteredEvents.filter(e => e.status === column).map(event => (
                  <div key={event._id} className="kanban-card">
                    <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>{event.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <CalendarIcon size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {new Date(event.date).toLocaleDateString('uz-UZ')}
                    </div>
                    {event.videoLink && (
                      <a href={event.videoLink} target="_blank" rel="noreferrer" className="text-primary" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem' }}>
                        <ExternalLink size={14} /> Videoni ko'rish
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* KALENDAR */}
        {activeTab === 'calendar' && (
          <div className="card fade-in-up" style={{ height: '700px', padding: '1rem', background: 'var(--bg-dark)' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={(event) => handleEditEvent(event.resource)}
              style={{ height: '100%', color: 'white' }}
              messages={{ next: "Keyingi", previous: "Oldingi", today: "Bugun", month: "Oy", week: "Hafta", day: "Kun", agenda: "Ro'yxat" }}
            />
          </div>
        )}

        {/* TO'YLAR VA QO'SHISH */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-2 fade-in-up" style={{alignItems: 'start'}}>
            <div className="card">
              <h2 className="card-title"><CalendarIcon size={20} /> {editEventId ? "To'yni Tahrirlash" : "Yangi To'y Qo'shish"}</h2>
              <form onSubmit={handleAddEvent}>
                <div className="form-group">
                  <label className="form-label">Sarlavha (M-n: Alisher & Malika)</label>
                  <input type="text" className="form-input" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Agar bo'sh qoldirsangiz ismlardan olinadi" />
                </div>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  
                </div>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Boshqa mijoz (Tashkilot, tug'ilgan kun)</label>
                    <input type="text" className="form-input" value={newEvent.clientName} onChange={e => setNewEvent({...newEvent, clientName: e.target.value})} placeholder="Faqat to'y bo'lmasa to'ldiring" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mijoz Telefoni</label>
                    <input type="text" className="form-input" value={newEvent.clientPhone} onChange={e => setNewEvent({...newEvent, clientPhone: e.target.value})} placeholder="+998901234567" required />
                  </div>
                </div>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Loyiha turi</label>
                    <select className="form-input" value={newEvent.eventType} onChange={e => setNewEvent({...newEvent, eventType: e.target.value})}>
                      <option value="To'y">To'y</option>
                      <option value="Fotiha">Fotiha</option>
                      <option value="Fotosessiya">Fotosessiya</option>
                      <option value="Love Story">Love Story</option>
                      <option value="Boshqa">Boshqa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sana va Vaqt</label>
                    <input type="datetime-local" className="form-input" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">To'yxona</label>
                    <input type="text" className="form-input" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manzil (Shahar, Tuman)</label>
                    <input type="text" className="form-input" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Kamera soni</label>
                    <input type="number" min="1" className="form-input" value={newEvent.cameraCount} onChange={e => setNewEvent({...newEvent, cameraCount: parseInt(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Umumiy Narx (UZS)</label>
                    <input type="number" min="0" className="form-input" value={newEvent.budget} onChange={e => setNewEvent({...newEvent, budget: e.target.value === '' ? '' : parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Olingan Avans (UZS)</label>
                    <input type="number" min="0" className="form-input" value={newEvent.advancePayment} onChange={e => setNewEvent({...newEvent, advancePayment: e.target.value === '' ? '' : parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="grid grid-cols-2" style={{gap: '1rem'}}>
                  <div className="form-group">
                    <label className="form-label">Kameraman Haqi (UZS)</label>
                    <input type="number" min="0" className="form-input" value={newEvent.operatorFee} onChange={e => setNewEvent({...newEvent, operatorFee: e.target.value === '' ? '' : parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Montajyor Haqi (UZS)</label>
                    <input type="number" min="0" className="form-input" value={newEvent.editorFee} onChange={e => setNewEvent({...newEvent, editorFee: e.target.value === '' ? '' : parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roninchi Haqi (UZS)</label>
                    <input type="number" min="0" className="form-input" value={newEvent.roninFee} onChange={e => setNewEvent({...newEvent, roninFee: e.target.value === '' ? '' : parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fotograf Haqi (UZS)</label>
                    <input type="number" min="0" className="form-input" value={newEvent.photoFee} onChange={e => setNewEvent({...newEvent, photoFee: e.target.value === '' ? '' : parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Qo'shimcha izoh (Kommentariy)</label>
                  <input type="text" className="form-input" value={newEvent.comment} onChange={e => setNewEvent({...newEvent, comment: e.target.value})} placeholder="M-n: 4K Syomka, Dron kerak..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Albom tanlash</label>
                  <select className="form-input" value={newEvent.album} onChange={e => setNewEvent({...newEvent, album: e.target.value})}>
                    <option value="">Albom yo'q</option>
                    <option value="Классик 20x60">Классик 20x60</option>
                    <option value="Престиж 30x60">Престиж 30x60</option>
                    <option value="Премиум 30x90">Премиум 30x90</option>
                    <option value="Фотосъёмка без альбома (Предсвадебная)">Фотосъёмка без альбома (Предсвадебная)</option>
                    <option value="Фотосъёмка без альбома (Свадебный день)">Фотосъёмка без альбома (Свадебный день)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Keys tanlash</label>
                  <select className="form-input" value={newEvent.caseType} onChange={e => setNewEvent({...newEvent, caseType: e.target.value})}>
                    <option value="">Keys yo'q</option>
                    <option value="Классический">Кейс (Классический)</option>
                    <option value="Живой">Кейс (Живой)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Holat (Status)</label>
                  <select className="form-input" value={newEvent.status} onChange={e => setNewEvent({...newEvent, status: e.target.value})}>
                    <option value="Kutilmoqda">Kutilmoqda</option>
                    <option value="Syomka qilindi">Syomka qilindi</option>
                    <option value="Montajda">Montajda</option>
                    <option value="Tayyor">Tayyor</option>
                    <option value="Topshirildi">Topshirildi</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kameramanlarni tanlash</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {operators.filter(o => o.professions?.includes('operator')).map(op => (
                      <label key={op._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'white', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={newEvent.assignedOperators.includes(op._id)} 
                          onChange={() => handleOperatorCheckbox(op._id)} 
                          style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        {op.fullName}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Montajyorlarni tanlash</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {operators.filter(o => o.professions?.includes('editor')).map(op => (
                      <label key={op._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'white', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={newEvent.assignedEditors.includes(op._id)} 
                          onChange={() => handleEditorCheckbox(op._id)} 
                          style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--success)', cursor: 'pointer' }}
                        />
                        {op.fullName}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Roninchilarni tanlash</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {operators.filter(o => o.professions?.includes('roninchi')).map(op => (
                      <label key={op._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'white', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={newEvent.assignedRoninchis.includes(op._id)} 
                          onChange={() => handleRoninchiCheckbox(op._id)} 
                          style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--warning)', cursor: 'pointer' }}
                        />
                        {op.fullName}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Fotograflarni tanlash</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {operators.filter(o => o.professions?.includes('fotograf')).map(op => (
                      <label key={op._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'white', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={newEvent.assignedPhotographers.includes(op._id)} 
                          onChange={() => handleFotografCheckbox(op._id)} 
                          style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--info)', cursor: 'pointer' }}
                        />
                        {op.fullName}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn w-full" style={{justifyContent: 'center'}}>
                    {editEventId ? <><Save size={16} /> Saqlash</> : <><Plus size={16} /> To'yni Saqlash</>}
                  </button>
                  {editEventId && (
                    <button type="button" className="btn btn-danger" onClick={cancelEditEvent} style={{padding: '0.75rem'}}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="card">
              <h2 className="card-title">Kutilayotgan To'ylar (Hali boshlanmagan)</h2>
              <div className="flex-col gap-4">
                {filteredEvents.filter(e => e.status === 'Kutilmoqda').map(event => (
                  <div key={event._id} style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white' }}>{event.title}</h3>
                      <div className="flex gap-2">
                        <button className="btn btn-outline" onClick={() => {
                          const link = `${window.location.origin}/track/${event._id}`;
                          navigator.clipboard.writeText(link);
                          alert("Mijoz uchun kuzatish ssilkasi nusxalandi! Endi mijozga yuboring.\n" + link);
                        }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} title="Mijoz Ssilkasi"><LinkIcon size={14} style={{marginRight: '4px'}} /> Nusxa</button>
                        
                        <a href={`/contract/${event._id}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', textDecoration: 'none', color: '#f59e0b', borderColor: '#f59e0b' }} title="Shartnoma (PDF) Yaratish">📄 Shartnoma</a>
                        {event.clientPhone && <button className="btn btn-info" onClick={() => openChat(event)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', background: '#0088cc', color: 'white' }} title="Telegram Chat"><MessageCircle size={14} style={{marginRight: '4px'}} /> Chat</button>}
                        {event.clientPhone && <button className="btn btn-info" onClick={() => openSmsModal(event)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', background: '#4CAF50', color: 'white' }} title="SMS Yuborish"><Smartphone size={14} style={{marginRight: '4px'}} /> SMS</button>}
                        <button className="btn btn-primary" onClick={() => handleShareTelegram(event)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} title="Operatorga yuborish"><Send size={14} style={{marginRight: '4px'}} /> Yuborish</button>
                        <button className="btn btn-outline" onClick={() => handleEditEvent(event)} style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}><Edit size={16} /></button>
                        <button className="btn btn-danger" onClick={() => handleDeleteEvent(event._id)} style={{ padding: '0.4rem' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Holat: <span className="badge">{event.status}</span></div>
                    {event.album && <div className="text-muted" style={{ fontSize: '0.875rem', color: '#ffb300' }}>📸 Albom: {event.album}</div>}
                    {event.caseType && <div className="text-muted" style={{ fontSize: '0.875rem', color: '#00e5ff' }}>💼 Keys: {event.caseType}</div>}
                    {event.comment && <div className="text-muted" style={{ fontSize: '0.875rem' }}>💬 {event.comment}</div>}
                    
                    {/* Xodimlar Badgelari */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {event.assignedOperators && event.assignedOperators.map(op => (
                        <span key={op._id} className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid #3b82f6' }}>🎥 {op.fullName}</span>
                      ))}
                      {event.assignedEditors && event.assignedEditors.map(op => (
                        <span key={op._id} className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid #10b981' }}>✂️ {op.fullName}</span>
                      ))}
                      {event.assignedRoninchis && event.assignedRoninchis.map(op => (
                        <span key={op._id} className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', border: '1px solid #f59e0b' }}>🚁 {op.fullName}</span>
                      ))}
                      {event.assignedPhotographers && event.assignedPhotographers.map(op => (
                        <span key={op._id} className="badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#67e8f9', border: '1px solid #06b6d4' }}>📸 {op.fullName}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredEvents.filter(e => e.status === 'Kutilmoqda').length === 0 && <div className="text-muted text-center" style={{padding: '2rem 0'}}>Hozircha kutilayotgan to'ylar yo'q</div>}
              </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem', border: '1px solid var(--primary)' }}>
              <h2 className="card-title text-primary">Jarayondagi To'ylar (Syomka / Montaj)</h2>
              <div className="flex-col gap-4">
                {filteredEvents.filter(e => e.status !== 'Kutilmoqda' && e.status !== 'Topshirildi').map(event => (
                  <div key={event._id} style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white' }}>{event.title}</h3>
                      <div className="flex gap-2">
                        <button className="btn btn-outline" onClick={() => {
                          const link = `${window.location.origin}/track/${event._id}`;
                          navigator.clipboard.writeText(link);
                          alert("Mijoz uchun kuzatish ssilkasi nusxalandi! Endi mijozga yuboring.\n" + link);
                        }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} title="Mijoz Ssilkasi"><LinkIcon size={14} style={{marginRight: '4px'}} /> Nusxa</button>
                        
                        <a href={`/contract/${event._id}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', textDecoration: 'none', color: '#f59e0b', borderColor: '#f59e0b' }} title="Shartnoma (PDF) Yaratish">📄 Shartnoma</a>
                        {event.clientPhone && <button className="btn btn-info" onClick={() => openChat(event)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', background: '#0088cc', color: 'white' }} title="Telegram Chat"><MessageCircle size={14} style={{marginRight: '4px'}} /> Chat</button>}
                        {event.clientPhone && <button className="btn btn-info" onClick={() => openSmsModal(event)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', background: '#4CAF50', color: 'white' }} title="SMS Yuborish"><Smartphone size={14} style={{marginRight: '4px'}} /> SMS</button>}
                        <button className="btn btn-outline" onClick={() => handleEditEvent(event)} style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}><Edit size={16} /></button>
                      </div>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Holat: <span className="badge" style={{background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd'}}>{event.status}</span></div>
                    {event.album && <div className="text-muted" style={{ fontSize: '0.875rem', color: '#ffb300' }}>📸 Albom: {event.album}</div>}
                    {event.caseType && <div className="text-muted" style={{ fontSize: '0.875rem', color: '#00e5ff' }}>💼 Keys: {event.caseType}</div>}
                  </div>
                ))}
                {filteredEvents.filter(e => e.status !== 'Kutilmoqda' && e.status !== 'Topshirildi').length === 0 && <div className="text-muted text-center" style={{padding: '2rem 0'}}>Hozircha jarayondagi to'ylar yo'q</div>}
              </div>
            </div>
          </div>
        )}

        {/* ARXIV */}
        {activeTab === 'archive' && (
          <div className="card fade-in-up">
            <h2 className="card-title"><Archive size={20} /> Mijozlar Tarixi (O'tgan oydagi va topshirilgan to'ylar)</h2>
            <div className="flex-col gap-4">
              {filteredEvents.filter(e => e.status === 'Topshirildi').map(event => (
                <div key={event._id} style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)', opacity: 0.8 }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white' }}>{event.title}</h3>
                    <div className="flex gap-2">
                      {event.clientPhone && <button className="btn btn-info" onClick={() => openChat(event)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', background: '#0088cc', color: 'white' }} title="Telegram Chat"><MessageCircle size={14} style={{marginRight: '4px'}} /> Chat</button>}
                      {event.clientPhone && <button className="btn btn-info" onClick={() => openSmsModal(event)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', background: '#4CAF50', color: 'white' }} title="SMS Yuborish"><Smartphone size={14} style={{marginRight: '4px'}} /> SMS</button>}
                      <button className="btn btn-outline" onClick={() => handleEditEvent(event)} style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}><Edit size={16} /></button>
                      <button className="btn btn-danger" onClick={() => handleDeleteEvent(event._id)} style={{ padding: '0.4rem' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <CalendarIcon size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {new Date(event.date).toLocaleDateString('uz-UZ')}
                  </div>
                  {event.album && <div className="text-muted" style={{ fontSize: '0.875rem', color: '#ffb300', marginBottom: '0.2rem' }}>📸 Albom: {event.album}</div>}
                  {event.caseType && <div className="text-muted" style={{ fontSize: '0.875rem', color: '#00e5ff', marginBottom: '0.5rem' }}>💼 Keys: {event.caseType}</div>}
                  <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Holat: <span className="badge" style={{background: 'var(--success)'}}>{event.status}</span></div>
                  <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Umumiy byudjet: <span style={{color: 'var(--success)'}}>{formatUZS(event.budget)}</span></div>
                  {event.comment && <div className="text-muted" style={{ fontSize: '0.875rem' }}>💬 {event.comment}</div>}
                  {event.clientRating && event.clientRating > 0 && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'white', marginRight: '0.5rem' }}>Mijoz bahosi:</span>
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} size={14} fill={star <= event.clientRating ? '#f59e0b' : 'transparent'} color={star <= event.clientRating ? '#f59e0b' : '#64748b'} />
                        ))}
                      </div>
                      {event.clientFeedback && <div style={{ fontSize: '0.875rem', color: '#f59e0b', fontStyle: 'italic' }}>"{event.clientFeedback}"</div>}
                    </div>
                  )}
                </div>
              ))}
              {filteredEvents.filter(e => e.status === 'Topshirildi').length === 0 && <div className="text-muted text-center" style={{padding: '2rem 0'}}>Arxivda to'ylar yo'q</div>}
            </div>
          </div>
        )}

        {/* XODIMLAR VA QO'SHISH */}
        {activeTab === 'operators' && (
          <div className="grid grid-cols-2 fade-in-up" style={{alignItems: 'start'}}>
            <div className="card">
              <h2 className="card-title"><Users size={20} /> {editOpId ? "Xodimni Tahrirlash" : "Yangi Xodim Qo'shish"}</h2>
              <form onSubmit={handleAddOperator}>
                <div className="form-group">
                  <label className="form-label">To'liq ism</label>
                  <input type="text" className="form-input" value={newOp.fullName} onChange={e => setNewOp({...newOp, fullName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Login</label>
                  <input type="text" className="form-input" value={newOp.username} onChange={e => setNewOp({...newOp, username: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Parol {editOpId && "(O'zgartirmasangiz bo'sh qoldiring)"}</label>
                  <input type="password" className="form-input" value={newOp.password} onChange={e => setNewOp({...newOp, password: e.target.value})} required={!editOpId} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telegram Username (Misol: @operator1)</label>
                  <input type="text" className="form-input" value={newOp.telegramUsername} onChange={e => setNewOp({...newOp, telegramUsername: e.target.value})} placeholder="@username" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kasbi (Yo'nalishi)</label>
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {['operator', 'editor', 'roninchi', 'fotograf'].map(prof => (
                      <label key={prof} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={newOp.professions?.includes(prof)}
                          onChange={e => {
                            let updatedProfs = newOp.professions || [];
                            if (e.target.checked) {
                              updatedProfs = [...updatedProfs, prof];
                            } else {
                              updatedProfs = updatedProfs.filter(p => p !== prof);
                            }
                            setNewOp({...newOp, professions: updatedProfs});
                          }}
                        />
                        {prof.charAt(0).toUpperCase() + prof.slice(1)}
                      </label>
                    ))}
                  </div>

                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn w-full" style={{justifyContent: 'center'}}>
                    {editOpId ? <><Save size={16} /> Saqlash</> : <><Plus size={16} /> Qo'shish</>}
                  </button>
                  {editOpId && (
                    <button type="button" className="btn btn-danger" onClick={cancelEditOperator} style={{padding: '0.75rem'}}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="card">
              <h2 className="card-title">Xodimlar Ro'yxati</h2>
              <div className="flex-col gap-3">
                {operators.map(op => (
                  <div key={op._id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{op.fullName} <span style={{fontSize: '0.75rem', padding: '2px 6px', background: op.professions?.join(', ') === 'editor' ? '#007bff' : op.professions?.join(', ') === 'roninchi' ? '#ffc107' : op.professions?.join(', ') === 'fotograf' ? '#dc3545' : '#28a745', color: op.professions?.join(', ') === 'roninchi' ? '#000' : '#fff', borderRadius: '10px', marginLeft: '6px'}}>{(op.professions?.join(', ') || 'operator').toUpperCase()}</span></div>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>@{op.username} {op.telegramUsername && `| Telegram: ${op.telegramUsername}`}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-outline" onClick={() => handleEditOperator(op)} style={{ padding: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}><Edit size={16} /></button>
                      <button className="btn btn-danger" onClick={() => handleDeleteOperator(op._id)} style={{ padding: '0.4rem' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OYLIKLAR */}
        {activeTab === 'salaries' && (
          <div className="card fade-in-up">
            <h2 className="card-title"><Wallet size={20} /> Xodimlar Oyliklari</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Bu yerda qaysi xodim nechta loyihani "Topshirdi" holatiga o'tkazgani va ularga yig'ilgan jami oylik ko'rsatiladi.</p>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Xodim</th>
                    <th>Kasbi</th>
                    <th>Topshirilgan Loyihalar Soni</th>
                    <th>Yig'ilgan Oylik (UZS)</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map(op => {
                    let completedCount = 0;
                    let totalSalary = 0; /* removed */
                    
                    events.forEach(event => {
                      if (event.status === 'Topshirildi') {
                        let isAssigned = false;
                        if (event.assignedOperators?.some(u => u._id === op._id)) {
                          totalSalary += (event.operatorFee || 0) / (event.assignedOperators?.length || 1);
                          isAssigned = true;
                        }
                        if (event.assignedEditors?.some(u => u._id === op._id)) {
                          totalSalary += (event.editorFee || 0) / (event.assignedEditors?.length || 1);
                          isAssigned = true;
                        }
                        if (event.assignedRoninchis?.some(u => u._id === op._id)) {
                          totalSalary += (event.roninFee || 0) / (event.assignedRoninchis?.length || 1);
                          isAssigned = true;
                        }
                        if (event.assignedPhotographers?.some(u => u._id === op._id)) {
                          totalSalary += (event.photoFee || 0) / (event.assignedPhotographers?.length || 1);
                          isAssigned = true;
                        }
                        if (isAssigned) completedCount++;
                      }
                    });

                    return (
                      <tr key={op._id}>
                        <td style={{ fontWeight: 600 }}>{op.fullName}</td>
                        <td><span className="badge" style={{ backgroundColor: 'var(--primary)' }}>{op.professions?.join(', ')}</span></td>
                        <td style={{ color: 'var(--success)' }}>{completedCount} ta loyiha</td>
                        <td style={{ fontWeight: 700, color: '#f59e0b' }}>{formatUZS(totalSalary)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SOZLAMALAR */}
        {activeTab === 'settings' && user?.role === 'admin' && (
          <div className="card fade-in-up" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2 className="card-title"><LayoutDashboard size={20} /> Admin Sozlamalari</h2>
            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Yangi Parol (Agar o'zgartirmoqchi bo'lsangiz)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Yangi parol..." 
                  value={adminSettings.password}
                  onChange={e => setAdminSettings({...adminSettings, password: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telegram Username (Telegram orqali kirish uchun)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="@username" 
                  value={adminSettings.telegramUsername}
                  onChange={e => setAdminSettings({...adminSettings, telegramUsername: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Save size={18} /> Sozlamalarni Saqlash
              </button>
            </form>
          </div>
        )}

      </div>
      {/* TELEGRAM CHAT MODAL */}
      {chatPhone && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-dark)', width: '90%', maxWidth: '700px', height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', background: '#0088cc', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={18}/> {chatPhone} bilan Chat</div>
              <button onClick={() => setChatPhone(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isChatLoading ? (
                <div style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>Yuklanmoqda... (GramJS)</div>
              ) : chatMessages.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '20px' }}>Xabarlar yo'q yoki Userbot yopiq</div>
              ) : (
                chatMessages.map((m, i) => (
                  <div key={m.id || i} style={{ alignSelf: m.out ? 'flex-end' : 'flex-start', background: m.out ? '#0088cc' : 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: '14px', maxWidth: '80%', wordBreak: 'break-word', borderBottomRightRadius: m.out ? '0' : '14px', borderBottomLeftRadius: m.out ? '14px' : '0', whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendChatMessage} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <textarea value={newMessageText} onChange={e => setNewMessageText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(e); } }} placeholder="Xabar yozing..." style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', resize: 'none', height: '45px', overflowY: 'auto' }} />
              <button type="submit" style={{ padding: '10px 15px', borderRadius: '8px', background: '#0088cc', color: 'white', border: 'none', cursor: 'pointer', height: '45px' }}><Send size={18}/></button>
            </form>
          </div>
        </div>
      )}

      {/* SMS YUBORISH MODAL */}
      {smsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-dark)', width: '90%', maxWidth: '700px', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>SMS Yuborish</h2>
              <button onClick={() => setSmsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label>Telefon raqami:</label>
              <input type="text" className="form-input" value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>SMS Matni:</label>
              <textarea 
                className="form-input" 
                value={smsText} 
                onChange={(e) => setSmsText(e.target.value)} 
                rows="8"
                style={{ width: '100%', resize: 'none', padding: '10px', boxSizing: 'border-box' }}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn btn-outline" onClick={() => setSmsModalOpen(false)}>Bekor qilish</button>
              <button type="button" className="btn" onClick={sendSmsMessage}>Yuborish</button>
            </div>
          </div>
        </div>
      )}

      {/* AI ASSISTANT FLOATING BUTTON */}
      <button 
        className="btn btn-primary" 
        style={{ position: 'fixed', bottom: '20px', right: '20px', borderRadius: '50%', width: '60px', height: '60px', padding: 0, justifyContent: 'center', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)', zIndex: 1000 }}
        onClick={() => setAiChatOpen(!aiChatOpen)}
      >
        <MessageCircle size={28} />
      </button>

      {/* AI ASSISTANT CHAT WINDOW */}
      
          </div>
          <form onSubmit={sendAiMessage} style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
            <input type="text" className="form-input" style={{ padding: '0.5rem 1rem' }} placeholder="Savol bering..." value={aiMessageText} onChange={e => setAiMessageText(e.target.value)} />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }} disabled={isAiLoading}><Send size={18} /></button>
          </form>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
