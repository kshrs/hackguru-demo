'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import EventCard from './EventCard';

export default function EventSliderSection({ title, count, seeAllHref, events, onCardClick, onToast }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (trackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
  }, [events]);

  const handleScroll = (dir) => {
    if (trackRef.current) {
      const scrollAmt = dir === 'left' ? -360 : 360;
      trackRef.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section className="event-slider-section sl-mounted" style={{ position: 'relative', marginBottom: '40px' }}>
      <div className="slider-header">
        <div className="slider-title-group">
          <h2 className="land-title">{title}</h2>
          <div className="ec-header-meta">
            <span className="slider-count-chip">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="12" width="12">
                <rect width="416" height="384" x="48" y="80" fill="none" strokeLinejoin="round" strokeWidth="32" rx="48"></rect>
                <circle cx="296" cy="232" r="24"></circle>
                <circle cx="376" cy="232" r="24"></circle>
                <circle cx="296" cy="312" r="24"></circle>
                <circle cx="376" cy="312" r="24"></circle>
                <circle cx="136" cy="312" r="24"></circle>
                <circle cx="216" cy="312" r="24"></circle>
                <circle cx="136" cy="392" r="24"></circle>
                <circle cx="216" cy="392" r="24"></circle>
                <circle cx="296" cy="392" r="24"></circle>
                <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M128 48v32m256-32v32"></path>
                <path fill="none" strokeLinejoin="round" strokeWidth="32" d="M464 160H48"></path>
              </svg>
              {count || (events ? `${events.length} Events` : '50 Events')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Scroll navigation arrows */}
          <button
            className="track-nav"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canScrollLeft ? 'pointer' : 'default',
              opacity: canScrollLeft ? 1 : 0.4
            }}
          >
            ‹
          </button>
          <button
            className="track-nav"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canScrollRight ? 'pointer' : 'default',
              opacity: canScrollRight ? 1 : 0.4
            }}
          >
            ›
          </button>

          <div className="Tooltip-module__w6kZxW__tooltipWrapper">
            <Link href={seeAllHref || '/events'} className="see-all-btn" style={{ textDecoration: 'none' }}>
              See all{' '}
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true" height="14" width="14">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={checkScroll}
        className="slider-track-wrap at-start"
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          paddingBottom: '16px',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="slider-track" style={{ display: 'flex', gap: '20px', width: 'max-content' }}>
          {(events || []).map((e, idx) => (
            <div
              key={e.id || idx}
              style={{
                opacity: 1,
                width: '320px',
                flexShrink: 0
              }}
            >
              <EventCard event={e} onCardClick={onCardClick} onToast={onToast} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
