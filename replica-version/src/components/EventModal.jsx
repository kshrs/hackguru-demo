'use client';

import React, { useState } from 'react';

const resolveImageUrl = (url) => {
  if (!url) return '/ace_files/dfa7a08a-4016-4409-aefa-a87b4000da9a-ECLearnix---Hero-Section-Banners.png';
  if (url.startsWith('data:image/svg+xml')) {
    return url.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  }
  if (url.startsWith('/static/')) {
    return url.replace('/static/', '/');
  }
  if (!url.startsWith('/') && !url.startsWith('http')) {
    return `/ace_files/${url}`;
  }
  return url;
};

export default function EventModal({ event, onClose, onRegister, onShare }) {
  if (!event) return null;

  const title = event.title || 'College Event';
  const img = resolveImageUrl(event.image_url);
  const mode = (event.mode || 'OFFLINE').toUpperCase();
  const price = event.price || 'Free';
  const isFree = price.toLowerCase().includes('free') || price === '0' || price === '₹0';
  const date = event.date || '04 Aug 2026';
  const loc = event.location || 'Coimbatore';
  const cat = event.category || 'Academic & Professional';
  const views = event.views_display || (event.views_count ? `${event.views_count}` : '100');
  const desc = event.description || `Participate, compete, and connect in ${title} with top college participants.`;

  return (
    <div className="ace-modal-backdrop active" onClick={onClose}>
      <div className="ace-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="ace-modal-close" onClick={onClose}>&times;</button>
        
        <div
          id="modalEventImage"
          style={{
            height: '220px',
            borderRadius: '12px',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: `url("${img}")`,
            marginBottom: '16px',
            position: 'relative'
          }}
        >
          <span
            id="modalEventMode"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fff',
              background: mode.toLowerCase().includes('online') ? '#10B981' : '#7F00FF'
            }}
          >
            {mode}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
          <h2 id="modalEventTitle" style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.3 }}>
            {title}
          </h2>
          <span id="modalEventPrice" style={{ fontSize: '16px', fontWeight: 800, color: isFree ? '#10B981' : '#7F00FF', whiteSpace: 'nowrap' }}>
            {price}
          </span>
        </div>

        <div
          id="modalEventSubtitle"
          style={{ fontSize: '14px', color: '#4B5563', marginBottom: '16px', lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: desc }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', background: '#F9FAFB', padding: '14px', borderRadius: '12px', fontSize: '13px' }}>
          <div><strong>📅 Date:</strong> <span style={{ color: '#4B5563' }}>{date}</span></div>
          <div><strong>📍 Location:</strong> <span style={{ color: '#4B5563' }}>{loc}</span></div>
          <div><strong>🏷️ Category:</strong> <span style={{ color: '#4B5563' }}>{cat}</span></div>
          <div><strong>👥 Views:</strong> <span style={{ color: '#4B5563' }}>{views}</span></div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            id="modalRegisterBtn"
            onClick={() => onRegister && onRegister(event)}
            style={{
              flex: 1,
              background: '#7F00FF',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            Register Now
          </button>
          <button
            onClick={() => onShare && onShare(event)}
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
