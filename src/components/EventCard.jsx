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

export default function EventCard({ event, onCardClick, onToast, showMatchBadge = false }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [imgSrc, setImgSrc] = useState(resolveImageUrl(event?.image_url));

  if (!event) return null;

  const title = event.title || 'College Event';
  const mode = (event.mode || 'OFFLINE').toUpperCase();
  const modeClass = mode.toLowerCase() === 'online' ? 'online' : (mode.toLowerCase() === 'hybrid' ? 'hybrid' : 'offline');
  const price = event.price || 'Free';
  const isFree = price.toLowerCase().includes('free') || price === '0' || price === '₹0';
  const date = event.date || 'Aug 2026';
  const loc = event.location || 'India';
  const cat = event.category || 'Academic & Professional';
  const views = event.views_display || (event.views_count ? `${event.views_count}` : '100');

  const matchPercentage = event.match_percentage || (event.score ? Math.min(99, Math.floor(event.score * 100)) : null);
  const explanation = event.explanation || event.match_reasons?.[0] || null;
  const isExplore = event.is_explore || false;

  const toggleWishlist = (e) => {
    e.stopPropagation();
    const next = !isWishlisted;
    setIsWishlisted(next);
    if (onToast) onToast(next ? 'Added to Wishlist! ❤️' : 'Removed from Wishlist');
  };

  const toggleSave = (e) => {
    e.stopPropagation();
    const next = !isSaved;
    setIsSaved(next);
    if (onToast) onToast(next ? 'Saved to Bookmarks! 🔖' : 'Removed from Bookmarks');

    if (event.id) {
      fetch('/api/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id })
      }).catch(() => {});
    }
  };

  return (
    <div
      className="event-card"
      role="button"
      tabIndex={0}
      onClick={() => onCardClick && onCardClick(event)}
    >
      <div className="event-img-wrapper" style={{ position: 'relative' }}>
        <img
          className="event-img"
          alt={title}
          loading="lazy"
          src={imgSrc}
          onError={() => setImgSrc('/ace_files/dfa7a08a-4016-4409-aefa-a87b4000da9a-ECLearnix---Hero-Section-Banners.png')}
          style={{ objectFit: 'cover' }}
        />
        
        {/* Recommendation Match Badge */}
        {(showMatchBadge || matchPercentage) && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 3,
            background: isExplore ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #6D28D9, #7C3AED)',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{isExplore ? '🌟 Explore' : `✨ ${matchPercentage}% Match`}</span>
          </div>
        )}

        <div className={`ec-wishlist-btn ${isWishlisted ? 'active' : ''}`} onClick={toggleWishlist}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={isWishlisted ? '#FF3B30' : 'none'} style={{ cursor: 'pointer' }}>
            <path
              d="M12 21s-6.716-4.36-9.293-7.293C.615 11.615.615 7.615 3.05 5.18c2.05-2.05 5.364-1.66 7.03.41l1.92 2.25 1.92-2.25c1.666-2.07 4.98-2.46 7.03-.41 2.435 2.435 2.435 6.435.343 8.527C18.716 16.64 12 21 12 21z"
              stroke={isWishlisted ? '#FF3B30' : '#9E9E9E'}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <span className={`ec-mode-badge ${modeClass}`}>{mode}</span>
      </div>

      <div className="card-body">
        {/* Dynamic AI Match Explanation */}
        {explanation && (
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: isExplore ? '#D97706' : '#6D28D9',
            background: isExplore ? '#FEF3C7' : '#F3E8FF',
            padding: '2px 8px',
            borderRadius: '6px',
            marginBottom: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {explanation}
          </div>
        )}

        <div className="ec-title-row">
          <h3 className="card-title" title={title}>{title}</h3>
          <div className="Tooltip-module__w6kZxW__tooltipWrapper">
            <div className={`ec-save-btn ${isSaved ? 'active' : ''}`} onClick={toggleSave}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 24 24" fill={isSaved ? '#7F00FF' : 'transparent'} style={{ cursor: 'pointer' }}>
                <path
                  d="M6 2C4.89543 2 4 2.89543 4 4V22C4 22.3795 4.214 22.725 4.553 22.894C4.892 23.063 5.298 23.026 5.6 22.8L12 18L18.4 22.8C18.702 23.026 19.108 23.063 19.447 22.894C19.786 22.725 20 22.3795 20 22V4C20 2.89543 19.1046 2 18 2H6Z"
                  stroke={isSaved ? '#7F00FF' : '#3D3D3D'}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="ec-meta-grid">
          {/* Location */}
          <div className="ec-info-left">
            <span className="ec-icon color-red">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 14" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M0 5.67715C0 2.5498 2.49282 0 5.58568 0C8.67854 0 11.1714 2.5498 11.1714 5.67715C11.1714 7.18695 10.7411 8.80808 9.98046 10.2086C9.22077 11.6074 8.11081 12.8229 6.72229 13.472C6.00098 13.8091 5.17038 13.8091 4.44907 13.472C3.06055 12.8229 1.9506 11.6074 1.1909 10.2086C0.430275 8.80808 0 7.18695 0 5.67715ZM5.58568 0.957545C3.03761 0.957545 0.957545 3.06254 0.957545 5.67715C0.957545 7.01585 1.34224 8.48092 2.03236 9.75163C2.72341 11.0241 3.69997 12.0648 4.85453 12.6045C5.31888 12.8215 5.85248 12.8215 6.31683 12.6045C7.47139 12.0648 8.44795 11.0241 9.139 9.75163C9.82912 8.48092 10.2138 7.01585 10.2138 5.67715C10.2138 3.06254 8.13375 0.957545 5.58568 0.957545ZM5.58568 4.14936C4.79242 4.14936 4.14936 4.79242 4.14936 5.58568C4.14936 6.37894 4.79242 7.022 5.58568 7.022C6.37894 7.022 7.022 6.37894 7.022 5.58568C7.022 4.79242 6.37894 4.14936 5.58568 4.14936ZM3.19182 5.58568C3.19182 4.26359 4.26359 3.19182 5.58568 3.19182C6.90777 3.19182 7.97954 4.26359 7.97954 5.58568C7.97954 6.90777 6.90777 7.97954 5.58568 7.97954C4.26359 7.97954 3.19182 6.90777 3.19182 5.58568Z" fill="#1C1C1C" />
              </svg>
            </span>
            <span className="ec-text" title={loc}>{loc}</span>
          </div>

          {/* Views */}
          <div className="ec-info-right">
            <div className="ec-view-count">
              <span className="ec-icon" style={{ fontSize: '14px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 8 6" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M0 2.85833C0.520217 1.20173 2.0678 0 3.89632 0C5.72483 0 7.27242 1.20173 7.79263 2.85833C7.27242 4.51494 5.72483 5.71667 3.89632 5.71667C2.0678 5.71667 0.520217 4.51494 0 2.85833ZM5.52965 2.85833C5.52965 3.29152 5.35757 3.70697 5.05126 4.01328C4.74495 4.31958 4.3295 4.49167 3.89632 4.49167C3.46313 4.49167 3.04769 4.31958 2.74138 4.01328C2.43507 3.70697 2.26298 3.29152 2.26298 2.85833C2.26298 2.42515 2.43507 2.0097 2.74138 1.70339C3.04769 1.39708 3.46313 1.225 3.89632 1.225C4.3295 1.225 4.74495 1.39708 5.05126 1.70339C5.35757 2.0097 5.52965 2.42515 5.52965 2.85833Z" fill="#3D3D3D" />
                  <path d="M3.89583 3.50065C4.05054 3.50065 4.19892 3.43919 4.30831 3.3298C4.41771 3.2204 4.47917 3.07203 4.47917 2.91732C4.47917 2.76261 4.41771 2.61424 4.30831 2.50484C4.19892 2.39544 4.05054 2.33398 3.89583 3.50065Z" fill="#3D3D3D" />
                </svg>
              </span>
              <span className="ec-text">{views}</span>
            </div>
          </div>

          {/* Date */}
          <div className="ec-info-left">
            <span className="ec-icon color-green">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 15 15" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.08775 1.02344C4.32988 1.02344 4.52616 1.21972 4.52616 1.46185V1.9077C4.91314 1.90026 5.33947 1.90026 5.80836 1.90027H8.2126C8.68151 1.90026 9.1079 1.90026 9.49487 1.9077V1.46185C9.49487 1.21972 9.69116 1.02344 9.93329 1.02344C10.1754 1.02344 10.3717 1.21972 10.3717 1.46185V1.94533C10.5237 1.95692 10.6675 1.97148 10.8037 1.98978C11.489 2.08193 12.0438 2.27607 12.4812 2.71353C12.9187 3.15098 13.1128 3.7057 13.205 4.39104C13.2945 5.05697 13.2945 5.90786 13.2945 6.98211V8.2172C13.2945 9.29146 13.2945 10.1424 13.205 10.8083C13.1128 11.4936 12.9187 12.0484 12.4812 12.4858C12.0438 12.9233 11.489 13.1174 10.8037 13.2096C10.1378 13.2991 9.28689 13.2991 8.21263 13.2991H5.80844C4.73418 13.2991 3.88326 13.2991 3.21733 13.2096C2.53199 13.1174 1.97728 12.9233 1.53982 12.4858C1.10236 12.0484 0.90822 11.4936 0.816078 10.8083C0.726546 10.1424 0.726553 9.29147 0.726563 8.2172V6.98214C0.726553 5.90787 0.726546 5.05697 0.816078 4.39104C0.90822 3.7057 1.10236 3.15098 1.53982 2.71353C1.97728 2.27607 2.53199 2.08193 3.21733 1.98978C3.35349 1.97148 3.49738 1.95692 3.64933 1.94533V1.46185C3.64933 1.21972 3.84562 1.02344 4.08775 1.02344Z" fill="#1C1C1C" />
              </svg>
            </span>
            <span className="ec-text">{date}</span>
          </div>

          {/* Price */}
          <div className="ec-info-right">
            <div className={`ec-price-label ${isFree ? 'free' : 'paid'}`}>{price}</div>
          </div>
        </div>

        <div className="ec-info-row ec-meta-row-bottom">
          <div className="ec-category-badge cat-purple">{cat}</div>
        </div>
      </div>
    </div>
  );
}
