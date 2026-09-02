'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Navbar({ onCreateEventClick, onToast }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleNotifClick = () => {
    if (onToast) onToast('🔔 You have 18 unread event notifications');
  };

  const handleProfileClick = () => {
    if (onToast) onToast('👤 Signed in as Kishor (Student)');
  };

  return (
    <>
      <nav id="tour-navbar" className="ace-navbar navbar navbar-expand-lg navbar-light sticky-top">
        <div className="nav-wrapper container-fluid">
          <Link className="logo-pointer navbar-brand" href="/">
            <img src="/ace_files/logo.png" alt="ACE" style={{ width: 'auto', height: '55px', objectFit: 'contain' }} />
          </Link>

          {/* Mobile Right Controls */}
          <div className="d-lg-none d-flex align-items-center gap-2">
            <div className="menu-toggle-icon" style={{ position: 'relative', cursor: 'pointer' }} onClick={handleNotifClick}>
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="22" width="22">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
              <span className="notif-badge">18</span>
            </div>
            <button className="navbar-toggler" onClick={() => setMobileDrawerOpen(true)}>
              <div className="menu-toggle-icon">
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="24" width="24">
                  <line x1="4" x2="20" y1="12" y2="12"></line>
                  <line x1="4" x2="20" y1="6" y2="6"></line>
                  <line x1="4" x2="20" y1="18" y2="18"></line>
                </svg>
              </div>
            </button>
          </div>

          {/* Desktop Nav Items */}
          <div className="navbar-collapse collapse" id="ace-navbar-nav">
            <div className="nav-links align-items-lg-center navbar-nav">
              <Link className="nav-link active" href="/events">
                Events
              </Link>

              {/* Ambassador Dropdown */}
              <div className="resources-dropdown">
                <span style={{ display: 'flex', alignItems: 'center' }} className="nav-link dropdown-trigger">
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1, fontSize: '0.80rem', color: '#111' }}>
                    <span>Ambassador</span>
                  </span>
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }} height="1em" width="1em">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
                <div className="dropdown-menu-custom">
                  <a className="dropdown-item-custom" href="/events">Info</a>
                  <a className="dropdown-item-custom" href="/events">Ambassador List</a>
                  <a className="dropdown-item-custom" href="/events">Leaderboard</a>
                </div>
              </div>

              {/* Contest Dropdown */}
              <div className="resources-dropdown">
                <span className="nav-link dropdown-trigger">
                  Contest{' '}
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', marginTop: '1px' }} height="1em" width="1em">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
                <div className="dropdown-menu-custom">
                  <Link className="dropdown-item-custom" href="/events?q=Hacknima">Hacknima 2026 Result</Link>
                  <Link className="dropdown-item-custom" href="/events?q=HackGURU">Hackguru (Kct)</Link>
                  <Link className="dropdown-item-custom" href="/events?q=Hackace">Hackace 2026</Link>
                  <Link className="dropdown-item-custom" href="/events?category=Contest">Monthly Contest</Link>
                  <Link className="dropdown-item-custom" href="/events">Winners</Link>
                  <Link className="dropdown-item-custom" href="/events?category=Hackathon">Hackathons</Link>
                </div>
              </div>

              {/* Rewards Dropdown */}
              <div className="resources-dropdown">
                <span className="nav-link dropdown-trigger">
                  Rewards{' '}
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', marginTop: '1px' }} height="1em" width="1em">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
                <div className="dropdown-menu-custom">
                  <a className="dropdown-item-custom" href="#" onClick={(e) => { e.preventDefault(); onToast && onToast('🎁 Vouchers claimed!'); }}>Vouchers</a>
                  <a className="dropdown-item-custom" href="#" onClick={(e) => { e.preventDefault(); onToast && onToast('🎡 Spin & Win unlocked!'); }}>Spin & Win</a>
                  <a className="dropdown-item-custom" href="#" onClick={(e) => { e.preventDefault(); onToast && onToast('📦 Mystery Box opened!'); }}>Mystery Box</a>
                </div>
              </div>

              {/* Explore Dropdown */}
              <div className="resources-dropdown">
                <span className="nav-link dropdown-trigger">
                  Explore{' '}
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', marginTop: '1px' }} height="1em" width="1em">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
                <div className="dropdown-menu-custom">
                  <Link className="dropdown-item-custom" href="/events">Organizations</Link>
                  <Link className="dropdown-item-custom" href="/events">Blogs</Link>
                  <Link className="dropdown-item-custom" href="/events">Games</Link>
                </div>
              </div>

              {/* Refer & Earn Button */}
              <a
                style={{
                  backgroundColor: 'rgb(243, 232, 255)',
                  color: 'rgb(109, 40, 217)',
                  fontWeight: 700,
                  transition: '0.2s',
                  fontSize: '14px',
                  padding: '8px 18px',
                  marginTop: 'auto',
                  marginBottom: 'auto',
                  height: 'fit-content',
                  transform: 'scale(1)',
                  cursor: 'pointer'
                }}
                className="d-flex align-items-center justify-content-center ms-lg-3 rounded-pill shadow-sm nav-link"
                href="#"
                onClick={(e) => { e.preventDefault(); onToast && onToast('🎉 Referral code copied: ACE2026'); }}
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="me-2" style={{ strokeWidth: '2.5px' }} height="18" width="18">
                  <polyline points="20 12 20 22 4 22 4 12"></polyline>
                  <rect x="2" y="7" width="20" height="5"></rect>
                  <line x1="12" y1="22" x2="12" y2="7"></line>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                </svg>
                Refer &amp; earn
              </a>
            </div>

            {/* Right Profile & Notif */}
            <div className="d-flex align-items-center gap-2 ms-auto mt-3 mt-lg-0">
              <div className="dropdown" style={{ cursor: 'pointer' }} onClick={handleNotifClick}>
                <div className="icon-circle dropdown-toggle" id="tour-notifications" aria-expanded="false">
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                  </svg>
                  <span className="notif-badge">18</span>
                </div>
              </div>

              <div className="Tooltip-module__w6kZxW__tooltipWrapper" style={{ cursor: 'pointer' }} onClick={handleProfileClick}>
                <div style={{ display: 'block' }}>
                  <img id="tour-profile" className="profile-img" alt="profile" src="/ace_files/unnamed.png" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop & Drawer */}
      <div className={`mobile-drawer-overlay ${mobileDrawerOpen ? 'active' : ''}`} onClick={() => setMobileDrawerOpen(false)}></div>
      <div className={`mobile-drawer ${mobileDrawerOpen ? 'active' : ''}`}>
        <button className="mobile-close-btn" onClick={() => setMobileDrawerOpen(false)}>
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="24" width="24">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
        <nav className="mobile-nav-links">
          <Link href="/events" className="mobile-nav-item" onClick={() => setMobileDrawerOpen(false)}>
            <span>Events</span>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </Link>
          <div className="mobile-nav-item" onClick={() => toggleDropdown('ambassador')}>
            <span>Ambassador</span>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div className="mobile-nav-item" onClick={() => toggleDropdown('contest')}>
            <span>Contest</span>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div className="mobile-nav-item" onClick={() => toggleDropdown('rewards')}>
            <span>Rewards</span>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div className="mobile-nav-item" onClick={() => toggleDropdown('explore')}>
            <span>Explore</span>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div className="mobile-nav-item" onClick={() => { onToast && onToast('🎉 Referral code copied: ACE2026'); setMobileDrawerOpen(false); }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#7f00ff' }} height="20" width="20">
                <polyline points="20 12 20 22 4 22 4 12"></polyline>
                <rect x="2" y="7" width="20" height="5"></rect>
                <line x1="12" y1="22" x2="12" y2="7"></line>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
              </svg>
              <span>Refer &amp; Earn</span>
            </span>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </nav>
        <div className="mobile-profile-section">
          <img className="profile-img" alt="profile" src="/ace_files/unnamed.png" />
          <div className="mobile-user-info">
            <span className="user-name">Kishor</span>
            <span className="user-type">User</span>
          </div>
        </div>
        <button className="btn-primary create-event-btn mt-4 mx-4" style={{ width: 'calc(100% - 32px)' }} onClick={() => { setMobileDrawerOpen(false); onCreateEventClick && onCreateEventClick(); }}>
          Create Event
        </button>
      </div>
    </>
  );
}
