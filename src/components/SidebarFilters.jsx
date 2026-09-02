'use client';

import React, { useState, useEffect, useRef } from 'react';
import SearchSuggestions from './SearchSuggestions';

export default function SidebarFilters({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  isFeaturedSelected,
  onFeaturedChange,
  isTrendingSelected,
  onTrendingChange,
  selectedModes,
  onModeToggle,
  onReset
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [openAccordions, setOpenAccordions] = useState({
    sort: true,
    location: true,
    status: true,
    date: true,
    mode: true,
    eventType: false,
    department: false,
    priceRange: false,
    perks: false,
    certificateType: false,
    accommodation: false
  });

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="filters-sidebar-premium" aria-label="Event filters">
      <div className="sidebar-top-group">
        <div>
          <h4 className="sidebar-title">Filters</h4>
          <div className="sidebar-subtitle">Find Events That Match You</div>
        </div>
        <button className="reset-ghost-btn" type="button" onClick={onReset}>
          Reset all
        </button>
      </div>

      {/* Search Input Box */}
      <div className="sidebar-search-container" style={{ position: 'relative' }} ref={searchContainerRef}>
        <div className="sidebar-search-box">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"></circle>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
          </svg>
          <input
            placeholder="Search events, colleges, cities…"
            aria-label="Search events"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
          />
        </div>
        <SearchSuggestions
          isOpen={isSearchFocused && (!searchQuery || searchQuery.trim() === '')}
          onSelect={(suggestion) => {
            onSearchChange(suggestion);
            setIsSearchFocused(false);
          }}
          onClose={() => setIsSearchFocused(false)}
        />
      </div>

      {/* Sort Section */}
      <div className="filter-section-wrap">
        <button
          className="filter-section-header"
          aria-expanded={openAccordions.sort}
          type="button"
          onClick={() => toggleAccordion('sort')}
        >
          <span className="fsh-title">Sort by</span>
          <div className="fsh-right">
            <span className={`fsh-arrow ${openAccordions.sort ? 'open' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </span>
          </div>
        </button>
        {openAccordions.sort && (
          <div className="filter-section-body">
            <div className="sidebar-sort-pills">
              {[
                { id: 'relevance', label: 'Recent' },
                { id: 'popularity', label: 'Most viewed' },
                { id: 'a_z', label: 'A → Z' },
                { id: 'z_a', label: 'Z → A' }
              ].map(pill => (
                <button
                  key={pill.id}
                  type="button"
                  className={`sort-pill ${sortOption === pill.id ? 'active' : ''}`}
                  onClick={() => onSortChange(pill.id)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Location Section */}
      <div className="filter-section-wrap">
        <button
          className="filter-section-header"
          aria-expanded={openAccordions.location}
          type="button"
          onClick={() => toggleAccordion('location')}
        >
          <span className="fsh-title">Location</span>
          <div className="fsh-right">
            <span className={`fsh-arrow ${openAccordions.location ? 'open' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </span>
          </div>
        </button>
        {openAccordions.location && (
          <div className="filter-section-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="css-b62m3t-container">
                <div className="css-1it9lsn-control">
                  <div className="css-107a3x2">
                    <div className="css-1v417dt-placeholder">Select country</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Status Section */}
      <div className="filter-section-wrap">
        <button
          className="filter-section-header"
          aria-expanded={openAccordions.status}
          type="button"
          onClick={() => toggleAccordion('status')}
        >
          <span className="fsh-title">Event status</span>
          <div className="fsh-right">
            {(isFeaturedSelected || isTrendingSelected) && (
              <span className="fsh-count">
                {(isFeaturedSelected ? 1 : 0) + (isTrendingSelected ? 1 : 0)} selected
              </span>
            )}
            <span className={`fsh-arrow ${openAccordions.status ? 'open' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </span>
          </div>
        </button>
        {openAccordions.status && (
          <div className="filter-section-body">
            <label className="filter-check">
              <div className="filter-check-left">
                <input
                  type="checkbox"
                  checked={isFeaturedSelected}
                  onChange={(e) => onFeaturedChange(e.target.checked)}
                />
                <span>Featured</span>
              </div>
            </label>
            <label className="filter-check">
              <div className="filter-check-left">
                <input
                  type="checkbox"
                  checked={isTrendingSelected}
                  onChange={(e) => onTrendingChange(e.target.checked)}
                />
                <span>Trending</span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Event Date Section */}
      <div className="filter-section-wrap">
        <button
          className="filter-section-header"
          aria-expanded={openAccordions.date}
          type="button"
          onClick={() => toggleAccordion('date')}
        >
          <span className="fsh-title">Event date</span>
          <div className="fsh-right">
            <span className={`fsh-arrow ${openAccordions.date ? 'open' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </span>
          </div>
        </button>
        {openAccordions.date && (
          <div className="filter-section-body">
            <input className="filter-input" min="2026-09-01" type="date" defaultValue="" />
          </div>
        )}
      </div>

      {/* Mode Section */}
      <div className="filter-section-wrap">
        <button
          className="filter-section-header"
          aria-expanded={openAccordions.mode}
          type="button"
          onClick={() => toggleAccordion('mode')}
        >
          <span className="fsh-title">Mode</span>
          <div className="fsh-right">
            <span className={`fsh-arrow ${openAccordions.mode ? 'open' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </span>
          </div>
        </button>
        {openAccordions.mode && (
          <div className="filter-section-body">
            {[
              { id: 'ONLINE', label: 'Online', count: 76 },
              { id: 'OFFLINE', label: 'Offline', count: 84 },
              { id: 'HYBRID', label: 'Hybrid', count: 11 }
            ].map(m => (
              <label key={m.id} className="filter-check">
                <div className="filter-check-left">
                  <input
                    type="checkbox"
                    checked={selectedModes.includes(m.id)}
                    onChange={() => onModeToggle(m.id)}
                  />
                  <span>{m.label}</span>
                </div>
                <span className="filter-count-pill">{m.count}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Additional Collapsible Sections (Ditto replica of template) */}
      {[
        { id: 'eventType', title: 'Event type' },
        { id: 'department', title: 'Department' },
        { id: 'priceRange', title: 'Price range' },
        { id: 'perks', title: 'Perks' },
        { id: 'certificateType', title: 'Certificate type' },
        { id: 'accommodation', title: 'Accommodation' }
      ].map(sec => (
        <div key={sec.id} className="filter-section-wrap">
          <button
            className="filter-section-header"
            aria-expanded={openAccordions[sec.id]}
            type="button"
            onClick={() => toggleAccordion(sec.id)}
          >
            <span className="fsh-title">{sec.title}</span>
            <div className="fsh-right">
              <span className={`fsh-arrow ${openAccordions[sec.id] ? 'open' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </span>
            </div>
          </button>
          {openAccordions[sec.id] && (
            <div className="filter-section-body" style={{ padding: '8px 0', fontSize: '13px', color: '#6B7280' }}>
              All categories available. Select to filter.
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
