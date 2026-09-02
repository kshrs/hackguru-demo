'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Navbar({ onPostEventClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const showToast = (msg) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'ace-toast';
    toast.innerHTML = `<span>✨</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    setCreateModalOpen(false);
    showToast('🎉 Event submitted successfully for moderation!');
  };

  return (
    <>
      <header className="site-navbar" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontSize: '18px' }}>
                H
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
                Hack<span style={{ color: '#7F00FF' }}>GURU</span>
              </span>
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Link href="/events" style={{ fontSize: '14px', fontWeight: 600, color: '#374151', textDecoration: 'none', transition: 'color 0.15s' }}>
                Find Events
              </Link>
              <Link href="/events?category=Hackathon" style={{ fontSize: '14px', fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
                Hackathons
              </Link>
              <Link href="/events?category=Workshop" style={{ fontSize: '14px', fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
                Workshops
              </Link>
              <Link href="/events?category=Conference" style={{ fontSize: '14px', fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
                Conferences
              </Link>
            </nav>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #7F00FF 0%, #9333EA 100%)',
                color: '#FFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(127, 0, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>+</span> Post an Event
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => showToast('🔔 You have 3 upcoming event reminders')}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', color: '#FFF', fontSize: '10px', fontWeight: 700, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                3
              </span>
            </div>

            {/* User Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => showToast('👤 Profile: Kishor (Active)')}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                KS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Create Event Modal */}
      {createModalOpen && (
        <div className="ace-modal-backdrop active" onClick={() => setCreateModalOpen(false)}>
          <div className="ace-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="ace-modal-close" onClick={() => setCreateModalOpen(false)}>&times;</button>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>🚀 Post a New College Event</h2>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Publish your hackathon, technical symposium, or conference to 10,000+ students across India.</p>

            <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Event Title</label>
                <input required placeholder="e.g. National AI & Autonomous Agents Hackathon 2026" style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}>
                    <option>Hackathon</option>
                    <option>Workshop</option>
                    <option>Conference</option>
                    <option>Contest</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Mode</label>
                  <select style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}>
                    <option>OFFLINE</option>
                    <option>ONLINE</option>
                    <option>HYBRID</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>College / Host Institute</label>
                <input required placeholder="e.g. Kumaraguru College of Technology, Coimbatore" style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <button type="submit" style={{ marginTop: '12px', background: '#7F00FF', color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
                Submit Event Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
