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

export default function ModernCard({ event, onCardClick, onToast }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [imgSrc, setImgSrc] = useState(resolveImageUrl(event?.image_url));

  if (!event) return null;

  const title = event.title || 'College Event';
  const mode = (event.mode || 'OFFLINE').toUpperCase();
  const price = event.price || 'Free';
  const isFree = price.toLowerCase().includes('free') || price === '0' || price === '₹0';
  const priceCls = isFree ? 'price-free' : 'price-paid';
  const date = event.date || '04 Aug 2026';
  const loc = event.location || 'Coimbatore';
  const cat = event.category || 'Academic & Professional';
  const views = event.views_display || (event.views_count ? `${event.views_count}` : '100');
  const desc = event.description || `Participate, compete, and connect in ${title} with top college participants.`;

  const cleanDesc = desc.replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'");

  const toggleLike = (e) => {
    e.stopPropagation();
    const next = !isLiked;
    setIsLiked(next);
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
    <article
      className="modern-card"
      role="button"
      tabIndex={0}
      aria-label={`View event: ${title}`}
      data-category={(cat || '').toLowerCase()}
      data-mode={(mode || '').toLowerCase()}
      data-location={(loc || '').toLowerCase()}
      data-price={isFree ? 'free' : 'paid'}
      data-views={event.views_count || 100}
      data-title={(title || '').toLowerCase()}
      onClick={() => onCardClick && onCardClick(event)}
    >
      <div className="modern-image">
        <img
          alt={title}
          loading="lazy"
          src={imgSrc}
          onError={() => setImgSrc('/ace_files/dfa7a08a-4016-4409-aefa-a87b4000da9a-ECLearnix---Hero-Section-Banners.png')}
        />
        <span className="mode-overlay-badge">{mode}</span>
        <button
          className={`image-like-btn ${isLiked ? 'active' : ''}`}
          aria-label="Like"
          aria-pressed={isLiked}
          onClick={toggleLike}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 24 24" fill={isLiked ? '#FF3B30' : 'none'} style={{ cursor: 'pointer' }}>
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={isLiked ? '#FF3B30' : 'none'}
              stroke={isLiked ? '#FF3B30' : '#3D3D3D'}
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
              className={`save-btn ${isSaved ? 'active' : ''}`}
              aria-label="Save"
              aria-pressed={isSaved}
              onClick={toggleSave}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 24 24" fill={isSaved ? '#7F00FF' : 'transparent'} style={{ cursor: 'pointer' }}>
                <path
                  d="M6 2C4.89543 2 4 2.89543 4 4V22C4 22.3795 4.214 22.725 4.553 22.894C4.892 23.063 5.298 23.026 5.6 22.8L12 18L18.4 22.8C18.702 23.026 19.108 23.063 19.447 22.894C19.786 22.725 20 22.3795 20 22V4C20 2.89543 19.1046 2 18 2H6Z"
                  fill={isSaved ? '#7F00FF' : 'transparent'}
                  stroke={isSaved ? '#7F00FF' : '#3D3D3D'}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="modern-desc">
          <p>{cleanDesc}</p>
        </div>

        <div className="card-info-rows">
          <div className="info-row">
            <span className="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 14" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M0 5.67715C0 2.5498 2.49282 0 5.58568 0C8.67854 0 11.1714 2.5498 11.1714 5.67715C11.1714 7.18695 10.7411 8.80808 9.98046 10.2086C9.22077 11.6074 8.11081 12.8229 6.72229 13.472C6.00098 13.8091 5.17038 13.8091 4.44907 13.472C3.06055 12.8229 1.9506 11.6074 1.1909 10.2086C0.430275 8.80808 0 7.18695 0 5.67715ZM5.58568 0.957545C3.03761 0.957545 0.957545 3.06254 0.957545 5.67715C0.957545 7.01585 1.34224 8.48092 2.03236 9.75163C2.72341 11.0241 3.69997 12.0648 4.85453 12.6045C5.31888 12.8215 5.85248 12.8215 6.31683 12.6045C7.47139 12.0648 8.44795 11.0241 9.139 9.75163C9.82912 8.48092 10.2138 7.01585 10.2138 5.67715C10.2138 3.06254 8.13375 0.957545 5.58568 0.957545ZM5.58568 4.14936C4.79242 4.14936 4.14936 4.79242 4.14936 5.58568C4.14936 6.37894 4.79242 7.022 5.58568 7.022C6.37894 7.022 7.022 6.37894 7.022 5.58568C7.022 4.79242 6.37894 4.14936 5.58568 4.14936ZM3.19182 5.58568C3.19182 4.26359 4.26359 3.19182 5.58568 3.19182C6.90777 3.19182 7.97954 4.26359 7.97954 5.58568C7.97954 6.90777 6.90777 7.97954 5.58568 7.97954C4.26359 7.97954 3.19182 6.90777 3.19182 5.58568Z" fill="#1C1C1C" />
              </svg>
              <span className="meta-text">{loc}</span>
            </span>
            <span className="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 15 15" fill="none">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 8 6" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M0 2.85833C0.520217 1.20173 2.0678 0 3.89632 0C5.72483 0 7.27242 1.20173 7.79263 2.85833C7.27242 4.51494 5.72483 5.71667 3.89632 5.71667C2.0678 5.71667 0.520217 4.51494 0 2.85833ZM5.52965 2.85833C5.52965 3.29152 5.35757 3.70697 5.05126 4.01328C4.74495 4.31958 4.3295 4.49167 3.89632 4.49167C3.46313 4.49167 3.04769 4.31958 2.74138 4.01328C2.43507 3.70697 2.26298 3.29152 2.26298 2.85833C2.26298 2.42515 2.43507 2.0097 2.74138 1.70339C3.04769 1.39708 3.46313 1.225 3.89632 1.225C4.3295 1.225 4.74495 1.39708 5.05126 1.70339C5.35757 2.0097 5.52965 2.42515 5.52965 2.85833Z" fill="#3D3D3D" />
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
