'use client';

import React, { useState, useEffect } from 'react';

const AVAILABLE_INTERESTS = [
  { id: 'ai', label: '🤖 AI & Agentic LLMs', tag: 'AI / Machine Learning' },
  { id: 'hackathon', label: '💻 Hackathons & Codathons', tag: 'Hackathons' },
  { id: 'web', label: '🌐 Web & Full-Stack', tag: 'Web Development' },
  { id: 'robotics', label: '⚙️ Robotics & Embedded IoT', tag: 'Robotics' },
  { id: 'cyber', label: '🔒 Cybersecurity & Web3', tag: 'Cybersecurity' },
  { id: 'design', label: '🎨 UI/UX & Product Design', tag: 'UI/UX Design' },
  { id: 'research', label: '📑 Paper Presentation & Symposia', tag: 'Research & Conference' },
  { id: 'competitive', label: '🏆 Competitive Coding & Contests', tag: 'Contests' },
  { id: 'workshops', label: '🚀 Hands-on Workshops', tag: 'Workshops' }
];

const PRESET_PERSONAS = [
  {
    name: '🤖 AI & Agentic Hacker',
    interests: ['AI / Machine Learning', 'Hackathons'],
    city: 'Coimbatore',
    skillLevel: 'Intermediate',
    role: 'AI Developer'
  },
  {
    name: '⚙️ Robotics & Hardware Maker',
    interests: ['Robotics', 'Workshops'],
    city: 'Coimbatore',
    skillLevel: 'Beginner',
    role: 'Hardware Engineer'
  },
  {
    name: '🎨 Web & UI/UX Designer',
    interests: ['Web Development', 'UI/UX Design'],
    city: 'Online',
    skillLevel: 'Intermediate',
    role: 'Frontend / UI Designer'
  },
  {
    name: '📑 Research & Symposia Scholar',
    interests: ['Research & Conference', 'Contests'],
    city: 'Chennai',
    skillLevel: 'Advanced',
    role: 'Researcher'
  }
];

export default function UserProfileModal({ isOpen, onClose, currentProfile, onSaveProfile, onToast }) {
  const [name, setName] = useState('Kishor (Student)');
  const [selectedInterests, setSelectedInterests] = useState(['AI / Machine Learning', 'Hackathons']);
  const [city, setCity] = useState('Coimbatore');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [role, setRole] = useState('Engineering Student');

  useEffect(() => {
    if (currentProfile) {
      if (currentProfile.name) setName(currentProfile.name);
      if (currentProfile.interests) setSelectedInterests(currentProfile.interests);
      if (currentProfile.city) setCity(currentProfile.city);
      if (currentProfile.skillLevel) setSkillLevel(currentProfile.skillLevel);
      if (currentProfile.role) setRole(currentProfile.role);
    }
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const toggleInterest = (tag) => {
    if (selectedInterests.includes(tag)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter(i => i !== tag));
      } else {
        if (onToast) onToast('⚠️ Select at least one interest domain');
      }
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const applyPreset = (persona) => {
    setSelectedInterests(persona.interests);
    setCity(persona.city);
    setSkillLevel(persona.skillLevel);
    setRole(persona.role);
    if (onToast) onToast(`✨ Loaded persona: ${persona.name}`);
  };

  const handleSave = () => {
    const updated = {
      name,
      interests: selectedInterests,
      city,
      skillLevel,
      role,
      updatedAt: Date.now()
    };
    if (onSaveProfile) {
      onSaveProfile(updated);
    }
    if (onToast) {
      onToast('🎉 Interests saved! AI feed updated.');
    }
    onClose();
  };

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-content-custom"
        style={{
          maxWidth: '620px',
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          background: '#FFFFFF',
          padding: '0',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E5E7EB'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
          padding: '24px 28px',
          color: '#FFFFFF',
          borderTopLeftRadius: '19px',
          borderTopRightRadius: '19px',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}
          >
            ✕
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src="/ace_files/unnamed.png"
              alt="avatar"
              style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid #FFFFFF', background: '#FFFFFF' }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
                Personalize Your Event Feed
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                Tell AI your skills & interests for calibrated recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>

          {/* Quick Preset Personas for Fast Demo */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6B7280', display: 'block', marginBottom: '8px' }}>
              ⚡ 1-Click Demo Personas
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PRESET_PERSONAS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(p)}
                  style={{
                    background: '#F3E8FF',
                    border: '1px solid #DDD6FE',
                    color: '#6D28D9',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#E9D5FF'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#F3E8FF'}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interest Chips Multi-Select */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6B7280', display: 'block', marginBottom: '10px' }}>
              🎯 Select Domain Interests ({selectedInterests.length} selected)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {AVAILABLE_INTERESTS.map((item) => {
                const isSelected = selectedInterests.includes(item.tag);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleInterest(item.tag)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: isSelected ? '2px solid #7C3AED' : '1px solid #E5E7EB',
                      background: isSelected ? '#FAF5FF' : '#F9FAFB',
                      color: isSelected ? '#6D28D9' : '#374151',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{item.label}</span>
                    {isSelected && <span style={{ color: '#7C3AED', fontWeight: 800 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location & Experience Level Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
            {/* Preferred City */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                📍 Preferred Location
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                  outline: 'none'
                }}
              >
                <option value="Coimbatore">Coimbatore (Local Campus)</option>
                <option value="Chennai">Chennai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Online">Online / Remote Only</option>
                <option value="All">All Cities in India</option>
              </select>
            </div>

            {/* Experience / Year Level */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                🎓 Academic Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                  outline: 'none'
                }}
              >
                <option value="Beginner">1st / 2nd Year (Beginner Friendly)</option>
                <option value="Intermediate">3rd / 4th Year (Hackathons & Hands-on)</option>
                <option value="Advanced">Postgraduate / Research & Advanced</option>
              </select>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #D1D5DB',
                background: '#F3F4F6',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(109, 40, 217, 0.3)'
              }}
            >
              Save &amp; Personalize Feed ✨
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
