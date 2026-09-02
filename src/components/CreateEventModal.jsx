'use client';

import React, { useState } from 'react';

export default function CreateEventModal({ isOpen, onClose, onToast }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hackathon',
    mode: 'OFFLINE',
    college: '',
    location: 'Coimbatore',
    price: 'Free'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onClose();
    if (onToast) onToast('🎉 Event submitted successfully for moderation!');
  };

  return (
    <div className="ace-modal-backdrop active" onClick={onClose}>
      <div className="ace-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="ace-modal-close" onClick={onClose}>&times;</button>
        
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>
          🚀 Publish a College Event
        </h2>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px 0' }}>
          List your hackathon, technical symposium, or conference to 10,000+ students across India.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
              Event Title
            </label>
            <input
              required
              placeholder="e.g. National Hackathon 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option>Hackathon</option>
                <option>Workshop</option>
                <option>Conference</option>
                <option>Contest</option>
                <option>Internship</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Mode
              </label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option>OFFLINE</option>
                <option>ONLINE</option>
                <option>HYBRID</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
              College / Organization
            </label>
            <input
              required
              placeholder="e.g. Kumaraguru College of Technology"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '10px',
              background: '#7F00FF',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Submit Event Listing
          </button>
        </form>
      </div>
    </div>
  );
}
