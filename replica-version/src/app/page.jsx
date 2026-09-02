'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [activeCityTab, setActiveCityTab] = useState('All');

  const hackathonsRef = useRef(null);
  const workshopsRef = useRef(null);
  const conferencesRef = useRef(null);

  useEffect(() => {
    fetch('/api/events?limit=50')
      .then(r => r.json())
      .then(d => {
        if (d && d.success && Array.isArray(d.results)) {
          setEvents(d.results.map(r => r.event));
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'ace-toast';
    toast.innerHTML = `<span>✨</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const hackathons = events.filter(e => (e.category || '').toLowerCase().includes('academic') || (e.title || '').toLowerCase().includes('hack'));
  const workshops = events.filter(e => (e.title || '').toLowerCase().includes('workshop') || (e.title || '').toLowerCase().includes('sttp') || (e.title || '').toLowerCase().includes('training'));
  const conferences = events.filter(e => (e.title || '').toLowerCase().includes('conference') || (e.category || '').toLowerCase().includes('conference'));
  const featured = events.filter(e => e.is_featured || (e.views_count || 0) > 1500);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #C026D3 100%)', color: '#FFF', padding: '70px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 700, marginBottom: '20px' }}>
            <span>🔥</span> Verified Official College Events 2026
          </div>
          
          <h1 style={{ fontSize: '46px', fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px 0', letterSpacing: '-1px', maxWidth: '850px' }}>
            Discover Top Hackathons, Workshops & Technical Conferences Across India
          </h1>
          
          <p style={{ fontSize: '18px', color: '#E9D5FF', margin: '0 0 32px 0', maxWidth: '680px', lineHeight: 1.5 }}>
            Direct access to 45+ premier engineering college events. Explore Coimbatore, Chennai, Bengaluru, and national online competitions with instant AI semantic matching.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/events"
              style={{
                background: '#FFF',
                color: '#7F00FF',
                padding: '14px 28px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '15px',
                textDecoration: 'none',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Explore All 45 Events →
            </Link>

            <Link
              href="/events?category=Hackathon"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(6px)',
                color: '#FFF',
                padding: '14px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              Hackathons Only
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', width: '100%', flex: 1 }}>
        
        {/* City Filter Pills */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '32px' }}>
          {['All', 'Coimbatore', 'Chennai', 'Bengaluru', 'New Delhi', 'Online'].map(city => (
            <Link
              key={city}
              href={city === 'All' ? '/events' : `/events?location=${city}`}
              style={{
                padding: '8px 18px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                background: activeCityTab === city ? '#7F00FF' : '#FFF',
                color: activeCityTab === city ? '#FFF' : '#374151',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                whiteSpace: 'nowrap'
              }}
            >
              📍 {city}
            </Link>
          ))}
        </div>

        {/* Section 1: Featured & Popular Hackathons */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#7F00FF', textTransform: 'uppercase', letterSpacing: '1px' }}>Trending Nationwide</span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: '4px 0 0 0' }}>National Level Hackathons</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => scrollCarousel(hackathonsRef, 'left')} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontWeight: 700 }}>‹</button>
              <button onClick={() => scrollCarousel(hackathonsRef, 'right')} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontWeight: 700 }}>›</button>
              <Link href="/events?category=Hackathon" style={{ marginLeft: '12px', fontSize: '13px', fontWeight: 700, color: '#7F00FF', textDecoration: 'none' }}>See All →</Link>
            </div>
          </div>

          <div
            ref={hackathonsRef}
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: 'minmax(300px, 340px)',
              gap: '20px',
              overflowX: 'auto',
              paddingBottom: '16px',
              scrollSnapType: 'x mandatory'
            }}
          >
            {(hackathons.length > 0 ? hackathons : events).slice(0, 10).map((e, idx) => (
              <EventCard key={e.id || idx} event={e} onCardClick={setActiveModalEvent} onToast={showToast} />
            ))}
          </div>
        </section>

        {/* Section 2: AI & Short-Term Training Programmes */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px' }}>Skill Development</span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: '4px 0 0 0' }}>Workshops, STTP & Bootcamps</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => scrollCarousel(workshopsRef, 'left')} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontWeight: 700 }}>‹</button>
              <button onClick={() => scrollCarousel(workshopsRef, 'right')} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontWeight: 700 }}>›</button>
              <Link href="/events?category=Workshop" style={{ marginLeft: '12px', fontSize: '13px', fontWeight: 700, color: '#7F00FF', textDecoration: 'none' }}>See All →</Link>
            </div>
          </div>

          <div
            ref={workshopsRef}
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: 'minmax(300px, 340px)',
              gap: '20px',
              overflowX: 'auto',
              paddingBottom: '16px',
              scrollSnapType: 'x mandatory'
            }}
          >
            {(workshops.length > 0 ? workshops : events).slice(0, 10).map((e, idx) => (
              <EventCard key={e.id || idx} event={e} onCardClick={setActiveModalEvent} onToast={showToast} />
            ))}
          </div>
        </section>

        {/* Section 3: Research Conferences & Paper Presentations */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '1px' }}>Academia & Patents</span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: '4px 0 0 0' }}>International Conferences & Symposiums</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => scrollCarousel(conferencesRef, 'left')} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontWeight: 700 }}>‹</button>
              <button onClick={() => scrollCarousel(conferencesRef, 'right')} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', fontWeight: 700 }}>›</button>
              <Link href="/events?category=Conference" style={{ marginLeft: '12px', fontSize: '13px', fontWeight: 700, color: '#7F00FF', textDecoration: 'none' }}>See All →</Link>
            </div>
          </div>

          <div
            ref={conferencesRef}
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: 'minmax(300px, 340px)',
              gap: '20px',
              overflowX: 'auto',
              paddingBottom: '16px',
              scrollSnapType: 'x mandatory'
            }}
          >
            {(conferences.length > 0 ? conferences : events).slice(0, 10).map((e, idx) => (
              <EventCard key={e.id || idx} event={e} onCardClick={setActiveModalEvent} onToast={showToast} />
            ))}
          </div>
        </section>

        {/* Why Choose Section */}
        <section style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #E5E7EB', padding: '40px', marginTop: '40px' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 32px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Why Top Engineering Students Use HackGURU</h3>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>The premier unified portal connecting college innovators with tier-1 hackathons and tech events.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            <div style={{ padding: '20px', borderRadius: '16px', background: '#F9FAFB' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚡</div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>Sub-20ms Semantic Search</h4>
              <p style={{ fontSize: '13px', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                Dense 384-d vector embeddings and BM25 index find exact hackathons even with conversational queries and typos.
              </p>
            </div>

            <div style={{ padding: '20px', borderRadius: '16px', background: '#F9FAFB' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛡️</div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>100% Verified Organizers</h4>
              <p style={{ fontSize: '13px', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                Direct partnerships with Kumaraguru, PSG Tech, IITs, NITs, and premier state universities across India.
              </p>
            </div>

            <div style={{ padding: '20px', borderRadius: '16px', background: '#F9FAFB' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎟️</div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>Instant Registration</h4>
              <p style={{ fontSize: '13px', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                One-click team registrations and automated reminder notifications for upcoming project submission deadlines.
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* Modal */}
      {activeModalEvent && (
        <EventModal
          event={activeModalEvent}
          onClose={() => setActiveModalEvent(null)}
          onRegister={(e) => {
            showToast('🎉 Registered successfully! Confirmation email sent.');
            setActiveModalEvent(null);
          }}
          onShare={(e) => {
            navigator.clipboard.writeText(window.location.href);
            showToast('📋 Event link copied to clipboard!');
          }}
        />
      )}
    </div>
  );
}
