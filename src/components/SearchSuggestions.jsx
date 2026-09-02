'use client';

import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_SUGGESTIONS = [
  'Hackathons',
  'Free Events',
  'Coding Events',
  'Workshops',
  'Online Events',
  'Offline Events',
  'Competitions',
  'Events in Chennai'
];

export default function SearchSuggestions({
  isOpen,
  onSelect,
  onClose,
  suggestions = DEFAULT_SUGGESTIONS
}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        const item = suggestions[activeIndex];
        const label = typeof item === 'string' ? item : item.label;
        onSelect(label);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, suggestions, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="search-suggestions-dropdown"
      role="listbox"
      aria-label="Popular search suggestions"
      style={{
        position: 'absolute',
        top: 'calc(100% - 10px)',
        left: 0,
        right: 0,
        background: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: '14px',
        boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        padding: '10px 8px',
        zIndex: 1050,
        animation: 'dropFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px 8px 10px',
          borderBottom: '1px solid #F3F4F6',
          marginBottom: '6px',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7F00FF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.9 }}
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#6B7280',
          }}
        >
          Popular searches
        </span>
      </div>

      {/* Suggestion Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {suggestions.map((item, index) => {
          const label = typeof item === 'string' ? item : item.label;
          const isSelected = activeIndex === index;

          return (
            <div
              key={label}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                // Prevent input blur before click registers
                e.preventDefault();
                onSelect(label);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: isSelected ? '#7F00FF' : '#1F2937',
                backgroundColor: isSelected ? '#F3E8FF' : 'transparent',
                transition: 'background-color 0.12s ease, color 0.12s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  style={{ opacity: isSelected ? 0.9 : 0.45 }}
                >
                  <circle cx="6.5" cy="6.5" r="4"></circle>
                  <path d="M11 11l3 3"></path>
                </svg>
                <span>{label}</span>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  opacity: isSelected ? 0.8 : 0.25,
                  transform: 'rotate(-45deg)',
                  transition: 'opacity 0.12s ease',
                }}
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
