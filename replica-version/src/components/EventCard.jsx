'use client';

import React, { useState } from 'react';

export default function EventCard({ event, onCardClick, onToast }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const title = event.title || '';
  const img = event.image_url || '/ace_files/no-image-found.png';
  const mode = event.mode || 'OFFLINE';
  const price = event.price || 'Free';
  const isFree = price.toLowerCase().includes('free') || price === '0' || price === '₹0';
  const date = event.date || '2026';
  const loc = event.location || 'India';
  const cat = event.category || 'Academic & Professional';
  const views = event.views_display || '100';
  const desc = event.description || '';
  const priceCls = isFree ? 'price-free' : 'price-paid';

  const handleLike = (e) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    if (onToast) onToast(next ? 'Added to Wishlist! ❤️' : 'Removed from Wishlist');
  };

  const handleSave = (e) => {
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    if (onToast) onToast(next ? 'Saved to Bookmarks! 🔖' : 'Removed from Bookmarks');

    // Post to bookmark API
    if (event.id) {
      fetch('/api/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id })
      }).catch(() => {});
    }
  };

  return (
    <article
      className="modern-card"
      role="button"
      tabIndex={0}
      aria-label={`View event: ${title}`}
      onClick={() => onCardClick && onCardClick(event)}
    >
      <div className="modern-image">
        <img alt={title} loading="lazy" src={img} />
        <span className="mode-overlay-badge">{mode}</span>
        <button
          className="image-like-btn"
          aria-label="Like"
          aria-pressed={liked}
          onClick={handleLike}
        >
          <svg width="22" height="20" viewBox="0 0 24 24" fill="none" style={{ cursor: 'pointer' }}>
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={liked ? '#FF3B30' : 'none'}
              stroke={liked ? '#FF3B30' : '#3D3D3D'}
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>

      <div className="modern-content">
        <div className="modern-title-row">
          <h4 className="modern-title">{title}</h4>
          <div className="modern-actions">
            <button
              className="save-btn"
              aria-label="Save"
              aria-pressed={saved}
              onClick={handleSave}
            >
              <svg width="22" height="24" viewBox="0 0 24 24" fill="none" style={{ cursor: 'pointer' }}>
                <path
                  d="M6 2C4.89543 2 4 2.89543 4 4V22C4 22.3795 4.214 22.725 4.553 22.894C4.892 23.063 5.298 23.026 5.6 22.8L12 18L18.4 22.8C18.702 23.026 19.108 23.063 19.447 22.894C19.786 22.725 20 22.3795 20 22V4C20 2.89543 19.1046 2 18 2H6Z"
                  fill={saved ? '#7F00FF' : 'transparent'}
                  stroke={saved ? '#7F00FF' : '#3D3D3D'}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="modern-desc">
          <p>{desc}</p>
        </div>

        <div className="card-info-rows">
          <div className="info-row">
            <span className="meta-item">
              <svg width="18" height="18" viewBox="0 0 12 14" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M0 5.67715C0 2.5498 2.49282 0 5.58568 0C8.67854 0 11.1714 2.5498 11.1714 5.67715C11.1714 7.18695 10.7411 8.80808 9.98046 10.2086C9.22077 11.6074 8.11081 12.8229 6.72229 13.472C6.00098 13.8091 5.17038 13.8091 4.44907 13.472C3.06055 12.8229 1.9506 11.6074 1.1909 10.2086C0.430275 8.80808 0 7.18695 0 5.67715Z" fill="#1C1C1C" />
              </svg>
              <span className="meta-text">{loc}</span>
            </span>
            <span className="meta-item">
              <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
                <path d="M9.93329 8.18422C10.2561 8.18422 10.5178 7.92251 10.5178 7.59967C10.5178 7.27683 10.2561 7.01512 9.93329 7.01512C9.61045 7.01512 9.34873 7.27683 9.34873 7.59967C9.34873 7.92251 9.61045 8.18422 9.93329 8.18422Z" fill="#1C1C1C" />
                <path fillRule="evenodd" clipRule="evenodd" d="M4.08775 1.02344C4.32988 1.02344 4.52616 1.21972 4.52616 1.46185V1.9077C4.91314 1.90026 5.33947 1.90026 5.80836 1.90027H8.2126C8.68151 1.90026 9.1079 1.90026 9.49487 1.9077V1.46185C9.49487 1.21972 9.69116 1.02344 9.93329 1.02344C10.1754 1.02344 10.3717 1.21972 10.3717 1.46185V1.94533C10.5237 1.95692 10.6675 1.97148 10.8037 1.98978C11.489 2.08193 12.0438 2.27607 12.4812 2.71353C12.9187 3.15098 13.1128 3.7057 13.205 4.39104C13.2945 5.05697 13.2945 5.90786 13.2945 6.98211V8.2172C13.2945 9.29146 13.2945 10.1424 13.205 10.8083C13.1128 11.4936 12.9187 12.0484 12.4812 12.4858C12.0438 12.9233 11.489 13.1174 10.8037 13.2096C10.1378 13.2991 9.28689 13.2991 8.21263 13.2991H5.80844C4.73418 13.2991 3.88326 13.2991 3.21733 13.2096C2.53199 13.1174 1.97728 12.9233 1.53982 12.4858C1.10236 12.0484 0.90822 11.4936 0.816078 10.8083C0.726546 10.1424 0.726553 9.29147 0.726563 8.2172V6.98214C0.726553 5.90787 0.726546 5.05697 0.816078 4.39104C0.90822 3.7057 1.10236 3.15098 1.53982 2.71353C1.97728 2.27607 2.53199 2.08193 3.21733 1.98978C3.35349 1.97148 3.49738 1.95692 3.64933 1.94533V1.46185C3.64933 1.21972 3.84562 1.02344 4.08775 1.02344Z" fill="#1C1C1C" />
              </svg>
              <span>{date}</span>
            </span>
          </div>
        </div>

        <div className="card-divider"></div>

        <div className="modern-footer-new">
          <div className="footer-left-group">
            <span
              className="modern-category-badge"
              style={{
                background: 'rgb(245, 243, 255)',
                color: 'rgb(109, 40, 217)',
                border: '1px solid rgb(221, 214, 254)'
              }}
            >
              {cat}
            </span>
            <span
              className="modern-status"
              style={{
                background: 'rgb(243, 244, 246)',
                color: 'rgb(31, 41, 55)',
                border: '1px solid rgb(229, 231, 235)'
              }}
            >
              Upcoming
            </span>
            <span className="meta-item views-meta">
              <svg width="20" height="15" viewBox="0 0 8 6" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M0 2.85833C0.520217 1.20173 2.0678 0 3.89632 0C5.72483 0 7.27242 1.20173 7.79263 2.85833C7.27242 4.51494 5.72483 5.71667 3.89632 5.71667C2.0678 5.71667 0.520217 4.51494 0 2.85833Z" fill="#3D3D3D" />
              </svg>
              <span>{views}</span>
            </span>
          </div>
          <span className={`modern-price ${priceCls}`}>{price}</span>
        </div>
      </div>
    </article>
  );
}
