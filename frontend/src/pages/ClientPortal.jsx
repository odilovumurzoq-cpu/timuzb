import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Video, CheckCircle, Clock, Camera, Film, Star } from 'lucide-react';

function ClientPortal() {
  const { id } = useParams();
  const [eventData, setEventData] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/api/events/track/${id}`);
        setEventData(res.data);
      } catch (err) {
        setError('Ma\'lumot topilmadi yoxud ssilka eskirgan.');
      }
    };
    fetchEvent();
  }, [id]);

  if (error) {
    return (
      <div className="login-container" style={{ background: '#0f172a' }}>
        <div className="login-card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Xatolik!</h2>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="login-container" style={{ background: '#0f172a' }}>
        <div className="login-card" style={{ textAlign: 'center' }}>
          <p className="text-muted pulse-anim">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const getStepProgress = () => {
    switch(eventData.status) {
      case 'Kutilmoqda': return 1;
      case 'Syomka qilindi': return 2;
      case 'Montajda': return 3;
      case 'Tayyor': return 4;
      case 'Topshirildi': return 5;
      default: return 1;
    }
  };
  
  const step = getStepProgress();

  const handleRatingSubmit = async () => {
    if (rating === 0) return alert("Iltimos, baho qo'ying (yulduzchani bosing)!");
    setIsSubmitting(true);
    try {
      await axios.post(`/api/events/track/${id}/rate`, { rating, feedback });
      setSubmitted(true);
      setEventData(prev => ({ ...prev, clientRating: rating, clientFeedback: feedback }));
    } catch (err) {
      alert("Xatolik yuz berdi.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="login-container" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1rem' }}>
      <div className="login-card fade-in-up" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="logo-icon-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', background: 'transparent' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', padding: '1rem', borderRadius: '50%' }}>
            <Video size={40} color="white" />
          </div>
        </div>
        <h2 className="login-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>TIM PRODUCTION</h2>
        <p className="login-subtitle">Sizning loyihangiz holati</p>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem' }}>{eventData.title}</h3>
          <p className="text-muted">Sana: {new Date(eventData.date).toLocaleDateString('uz-UZ')} | {eventData.venue}</p>
        </div>

        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '20px', width: '2px', background: 'var(--border)' }}></div>
          <div style={{ position: 'absolute', top: 0, bottom: `${100 - (step/5)*100}%`, left: '20px', width: '2px', background: 'var(--success)', transition: 'bottom 1s ease' }}></div>

          {[
            { s: 'Kutilmoqda', desc: 'To\'y kuni kutilmoqda', icon: Clock },
            { s: 'Syomka qilindi', desc: 'Sifatli kadrlarga muhrlandi', icon: Camera },
            { s: 'Montajda', desc: 'Ehtiyotkorlik bilan montaj qilinmoqda', icon: Film },
            { s: 'Tayyor', desc: 'Video to\'liq tayyorlandi!', icon: CheckCircle },
            { s: 'Topshirildi', desc: 'Mijozga topshirildi. Baxtli bo\'ling!', icon: CheckCircle }
          ].map((item, idx) => {
            const isCompleted = step > idx;
            const isCurrent = step === idx + 1;
            const Icon = item.icon;
            
            return (
              <div key={item.s} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', position: 'relative', zIndex: 2, opacity: isCompleted || isCurrent ? 1 : 0.4 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--bg-dark)', border: `2px solid ${isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="white" className={isCurrent && !isCompleted ? 'pulse-anim' : ''} />
                </div>
                <div>
                  <div style={{ color: isCurrent ? 'var(--primary)' : 'white', fontWeight: 600, fontSize: '1.1rem' }}>{item.s}</div>
                  <div className="text-muted" style={{ fontSize: '0.875rem' }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {eventData.videoLink && step >= 4 && (
          <div className="fade-in-up">
            <a href={eventData.videoLink} target="_blank" rel="noreferrer" className="btn btn-login" style={{ display: 'flex', background: 'var(--success)', textDecoration: 'none' }}>
              Videoni Tomosha Qilish
            </a>
          </div>
        )}

        {step === 5 && (
          <div className="fade-in-up" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '1rem' }}>Ishimizga baho bering! ⭐</h3>
            {(eventData.clientRating > 0 || submitted) ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} size={28} fill={star <= eventData.clientRating ? '#f59e0b' : 'transparent'} color={star <= eventData.clientRating ? '#f59e0b' : '#64748b'} />
                  ))}
                </div>
                <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>Raxmat! Fikr-mulohazangiz qabul qilingan.</p>
                {eventData.clientFeedback && <p className="text-muted" style={{marginTop: '0.5rem', fontStyle: 'italic'}}>"{eventData.clientFeedback}"</p>}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {[1,2,3,4,5].map(star => (
                    <Star 
                      key={star} 
                      size={32} 
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      fill={star <= rating ? '#f59e0b' : 'transparent'} 
                      color={star <= rating ? '#f59e0b' : '#94a3b8'} 
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  placeholder="Fikringizni yozib qoldiring (ixtiyoriy)..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  style={{ marginBottom: '1rem', resize: 'none' }}
                />
                <button className="btn w-full" onClick={handleRatingSubmit} disabled={isSubmitting} style={{ justifyContent: 'center', background: 'var(--primary)' }}>
                  {isSubmitting ? 'Yuborilmoqda...' : 'Bahoni Yuborish'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientPortal;
