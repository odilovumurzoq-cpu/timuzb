import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function Contract() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const { data } = await axios.get(`/api/events/${id}`, config);
        setEvent(data);
        setTimeout(() => window.print(), 1500); // Auto-print dialog after render
      } catch (error) {
        console.error(error);
      }
    };
    fetchEvent();
  }, [id]);

  if (!event) return <div style={{ padding: '2rem', textAlign: 'center', color: 'black' }}>Shartnoma yuklanmoqda...</div>;

  const dateStr = new Date(event.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Tashkent' });
  const qrData = encodeURIComponent(`TimProduction Loyiha: ${event.title}\nSana: ${dateStr}\nTelefon: ${event.clientPhone}`);

  return (
    <div style={{
      background: '#fff',
      color: '#1a1a1a',
      fontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
      padding: '50px',
      maxWidth: '900px',
      margin: '0 auto',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');
          @media print {
            body * { visibility: hidden; }
            #printable-contract, #printable-contract * { visibility: visible; }
            #printable-contract { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
            .no-print { display: none; }
          }
        `}
      </style>
      
      <div id="printable-contract" style={{ background: '#fff', position: 'relative' }}>
        
        {/* Decorative Header Bar */}
        <div style={{ height: '8px', background: 'linear-gradient(90deg, #1e3a8a, #3b82f6, #93c5fd)', marginBottom: '40px', borderRadius: '4px' }}></div>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '30px', marginBottom: '40px', borderBottom: '1px solid #eaeaea' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 800, fontSize: '28px', fontFamily: '"Playfair Display", serif' }}>
              TP
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', letterSpacing: '1px', color: '#1e3a8a' }}>TIM PRODUCTION</h1>
              <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>Premium Video & Foto</p>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '14px', color: '#475569' }}>
            <p style={{ margin: '4px 0' }}>📍 Toshkent shahar, Markaziy ofis</p>
            <p style={{ margin: '4px 0' }}>📞 +998 88 055 60 66</p>
            <p style={{ margin: '4px 0' }}>🕒 Hujjat sanasi: <strong>{new Date().toLocaleDateString('uz-UZ')}</strong></p>
          </div>
        </div>

        {/* TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 10px', fontFamily: '"Playfair Display", serif', color: '#0f172a' }}>
            XIZMAT KO'RSATISH SHARTNOMASI
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>№ {event._id.substring(event._id.length - 6).toUpperCase()} - Hujjat</p>
        </div>

        {/* DETAILS GRID */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', background: '#f8fafc', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '45%' }}>
            <h3 style={{ fontSize: '14px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Tadbir Ma'lumotlari</h3>
            <p style={{ margin: '10px 0', fontSize: '15px' }}><strong style={{ color: '#0f172a' }}>Loyiha turi:</strong> {event.eventType || "To'y"}</p>
            <p style={{ margin: '10px 0', fontSize: '15px' }}><strong style={{ color: '#0f172a' }}>Tadbir sanasi:</strong> {dateStr}</p>
            <p style={{ margin: '10px 0', fontSize: '15px' }}><strong style={{ color: '#0f172a' }}>Manzil:</strong> {event.venue || '-'}, {event.location || '-'}</p>
          </div>
          
          <div style={{ width: '1px', background: '#cbd5e1' }}></div>
          
          <div style={{ width: '45%' }}>
            <h3 style={{ fontSize: '14px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Mijoz Ma'lumotlari</h3>
            <p style={{ margin: '10px 0', fontSize: '15px' }}><strong style={{ color: '#0f172a' }}>Ismi:</strong> {event.clientName || event.title}</p>
            <p style={{ margin: '10px 0', fontSize: '15px' }}><strong style={{ color: '#0f172a' }}>Telefon:</strong> {event.clientPhone}</p>
          </div>
        </div>

        {/* FINANCIALS */}
        <div style={{ marginBottom: '50px' }}>
          <h3 style={{ fontSize: '18px', color: '#1e3a8a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>Moliyaviy Hisob-kitoblar</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Umumiy Kelishilgan Summa:</td>
                <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', textAlign: 'right', fontSize: '18px' }}>{new Intl.NumberFormat('uz-UZ').format(event.budget)} UZS</td>
              </tr>
              <tr>
                <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Oldindan to'lov (Zaklad):</td>
                <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', textAlign: 'right', color: '#10b981' }}>{new Intl.NumberFormat('uz-UZ').format(event.advancePayment)} UZS</td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 'bold' }}>Qoldiq Summa:</td>
                <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', textAlign: 'right', color: '#ef4444', fontSize: '18px' }}>{new Intl.NumberFormat('uz-UZ').format((event.budget || 0) - (event.advancePayment || 0))} UZS</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* QR CODE & SIGNATURES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
          <div style={{ width: '30%' }}>
            <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Tashkilotchi (TimProduction):</p>
            <div style={{ borderBottom: '1px solid #000', height: '40px', width: '100%' }}></div>
            <p style={{ fontSize: '12px', margin: '5px 0 0', color: '#94a3b8' }}>(Imzo)</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`} 
              alt="QR Code" 
              style={{ width: '120px', height: '120px', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '12px' }} 
            />
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Hujjat haqiqiyligini tekshirish</p>
          </div>

          <div style={{ width: '30%' }}>
            <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Buyurtmachi (Mijoz):</p>
            <div style={{ borderBottom: '1px solid #000', height: '40px', width: '100%' }}></div>
            <p style={{ fontSize: '12px', margin: '5px 0 0', color: '#94a3b8' }}>(Imzo)</p>
          </div>
        </div>

        {/* FOOTER MESSAGE */}
        <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid #eaeaea', paddingTop: '20px' }}>
          * Ushbu shartnoma mijoz va TimProduction o'rtasidagi kelishuvni tasdiqlaydi. 
          Kelgusi matnni siz yuborganingizdan so'ng, tizim unga moslashadi.
        </div>
      </div>
      
      <div className="no-print" style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          Chop etish (Print)
        </button>
      </div>
    </div>
  );
}

export default Contract;
