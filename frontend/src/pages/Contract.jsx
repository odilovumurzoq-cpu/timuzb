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
        setTimeout(() => window.print(), 1000); // Auto-print dialog after render
      } catch (error) {
        console.error(error);
      }
    };
    fetchEvent();
  }, [id]);

  if (!event) return <div style={{ padding: '2rem', textAlign: 'center' }}>Shartnoma yuklanmoqda...</div>;

  const dateStr = new Date(event.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Tashkent' });

  return (
    <div style={{
      background: '#fff',
      color: '#000',
      fontFamily: '"Times New Roman", Times, serif',
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-contract, #printable-contract * { visibility: visible; }
            #printable-contract { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .no-print { display: none; }
          }
          h1, h2, h3 { font-family: 'Playfair Display', "Times New Roman", serif; }
        `}
      </style>
      
      <div id="printable-contract">
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>TIM PRODUCTION</h1>
            <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#555' }}>Video & Foto xizmatlari</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '14px' }}>
            <p style={{ margin: '2px 0' }}>Toshkent shahar, Chilonzor tumani</p>
            <p style={{ margin: '2px 0' }}>Tel: +998 90 123 45 67</p>
            <p style={{ margin: '2px 0' }}>Sana: {new Date().toLocaleDateString('uz-UZ')}</p>
          </div>
        </div>

        {/* TITLE */}
        <h2 style={{ textAlign: 'center', fontSize: '24px', margin: '0 0 40px', textDecoration: 'underline' }}>
          XIZMAT KO'RSATISH SHARTNOMASI
        </h2>

        {/* CLIENT DETAILS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ width: '48%' }}>
            <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>Tadbir Ma'lumotlari</h3>
            <p style={{ margin: '8px 0' }}><strong>Loyiha turi:</strong> {event.eventType || "To'y"}</p>
            <p style={{ margin: '8px 0' }}><strong>Tadbir sanasi:</strong> {dateStr}</p>
            <p style={{ margin: '8px 0' }}><strong>To'yxona/Manzil:</strong> {event.venue}, {event.location}</p>
          </div>
          <div style={{ width: '48%' }}>
            <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>Mijoz Ma'lumotlari</h3>
            {event.groomName || event.brideName ? (
              <>
                <p style={{ margin: '8px 0' }}><strong>Kuyov Ismi:</strong> {event.groomName || '-'}</p>
                <p style={{ margin: '8px 0' }}><strong>Kelin Ismi:</strong> {event.brideName || '-'}</p>
              </>
            ) : (
              <p style={{ margin: '8px 0' }}><strong>Mijoz Ismi:</strong> {event.clientName || event.title}</p>
            )}
            <p style={{ margin: '8px 0' }}><strong>Telefon:</strong> {event.clientPhone}</p>
          </div>
        </div>

        {/* PACKAGE DETAILS */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '15px' }}>Kelishilgan Xizmatlar</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Xizmat Turi</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Izoh</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Video xizmati</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{event.cameraCount || 1} ta kamera</td>
              </tr>
              {event.assignedRoninchis && event.assignedRoninchis.length > 0 && (
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Roninchi / Kvadrokopter</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Kiritilgan</td>
                </tr>
              )}
              {event.assignedPhotographers && event.assignedPhotographers.length > 0 && (
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Foto xizmati</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Kiritilgan</td>
                </tr>
              )}
              {event.album && (
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Fotokitob / Albom</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{event.album}</td>
                </tr>
              )}
              {event.caseType && (
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Fleshka / Keys</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{event.caseType}</td>
                </tr>
              )}
              {event.comment && (
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Qo'shimcha kelishuv</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{event.comment}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FINANCIALS */}
        <div style={{ marginBottom: '50px' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '15px' }}>Moliyaviy Hisob-kitob</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '5px', borderBottom: '1px dashed #eee' }}>
              <span>Umumiy Kelishilgan Summa:</span>
              <strong>{event.budget?.toLocaleString()} UZS</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '5px', borderBottom: '1px dashed #eee' }}>
              <span>To'langan Avans Summasi:</span>
              <strong>{event.advancePayment?.toLocaleString()} UZS</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '5px', borderBottom: '2px solid #000', fontSize: '18px', marginTop: '5px' }}>
              <strong>Qolgan Qarz Summasi:</strong>
              <strong>{((event.budget || 0) - (event.advancePayment || 0)).toLocaleString()} UZS</strong>
            </div>
          </div>
        </div>

        {/* SIGNATURES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
          <div style={{ width: '40%', textAlign: 'center' }}>
            <p style={{ margin: '0 0 40px', fontWeight: 'bold' }}>Ijrochi (Tim Production):</p>
            <div style={{ borderBottom: '1px solid #000', width: '100%' }}></div>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>(Imzo)</p>
          </div>
          <div style={{ width: '40%', textAlign: 'center' }}>
            <p style={{ margin: '0 0 40px', fontWeight: 'bold' }}>Buyurtmachi (Mijoz):</p>
            <div style={{ borderBottom: '1px solid #000', width: '100%' }}></div>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>(Imzo)</p>
          </div>
        </div>

      </div>

      <div className="no-print" style={{ textAlign: 'center', marginTop: '40px' }}>
        <button onClick={() => window.print()} style={{
          padding: '10px 30px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
        }}>
          PDF Yuklab Olish / Chop Etish
        </button>
      </div>

    </div>
  );
}

export default Contract;
