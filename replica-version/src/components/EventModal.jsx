'use client';

import React from 'react';

export default function EventModal({ event, onClose, onRegister, onShare }) {
  if (!event) return null;

  const isFree = (event.price || '').toLowerCase().includes('free') || event.price === '0' || event.price === '₹0';
  const mode = event.mode || 'OFFLINE';

  return (
    <div className="ace-modal-backdrop active" onClick={onClose}>
      <div className="ace-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="ace-modal-close" onClick={onClose}>&times;</button>
        
        <div
          style={{
            height: '220px',
            borderRadius: '14px',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: `url("${event.image_url || '/ace_files/no-image-found.png'}")`,
            marginBottom: '16px',
            position: 'relative'
          }}
        >
          <span
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#FFF',
              background: mode.toLowerCase().includes('online') ? '#10B981' : '#7F00FF'
            }}
          >
            {mode}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.3 }}>
            {event.title}
          </h2>
          <span style={{ fontSize: '18px', fontWeight: 800, color: isFree ? '#10B981' : '#7F00FF', whiteSpace: 'nowrap' }}>
            {event.price || 'Free'}
          </span>
        </div>

        <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '18px', lineHeight: '1.5' }}>
          {event.description || `Participate, compete, and connect in ${event.title} with top college participants.`}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', background: '#F9FAFB', padding: '16px', borderRadius: '12px', fontSize: '13px' }}>
          <div><strong>📅 Date:</strong> <span style={{ color: '#4B5563' }}>{event.date || 'Aug 2026'}</span></div>
          <div><strong>📍 Location:</strong> <span style={{ color: '#4B5563' }}>{event.location || 'India'}</span></div>
          <div><strong>🏷️ Category:</strong> <span style={{ color: '#4B5563' }}>{event.category || 'Academic & Professional'}</span></div>
          <div><strong>👥 Views:</strong> <span style={{ color: '#4B5563' }}>{event.views_display || '100'}</span></div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onRegister(event)}
            style={{
              flex: 1,
              background: '#7F00FF',
              color: '#FFF',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Register Now
          </button>
          <button
            onClick={() => onShare(event)}
            style={{
              background: '#F3E8FF',
              color: '#7F00FF',
              border: 'none',
              padding: '12px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
