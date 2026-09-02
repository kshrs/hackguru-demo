'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SidebarFilters from '@/components/SidebarFilters';
import ModernCard from '@/components/ModernCard';
import EventModal from '@/components/EventModal';
import CreateEventModal from '@/components/CreateEventModal';

function EventsContent() {
  const searchParams = useSearchParams();

  const initialQ = searchParams.get('q') || searchParams.get('searchText') || '';
  const initialFilter = searchParams.get('filter') || '';
  const initialMode = searchParams.get('mode') || '';

  const [query, setQuery] = useState(initialQ);
  const [sortOption, setSortOption] = useState('relevance');
  const [isFeaturedSelected, setIsFeaturedSelected] = useState(initialFilter.toLowerCase().includes('featured'));
  const [isTrendingSelected, setIsTrendingSelected] = useState(initialFilter.toLowerCase().includes('trending'));
  const [selectedModes, setSelectedModes] = useState(initialMode ? [initialMode.toUpperCase()] : []);
  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const debounceTimer = useRef(null);

  const showToast = (msg) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'ace-toast';
    toast.innerHTML = `<span>✨</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const fetchFilteredEvents = (searchQuery, sort, featured, trending, modes) => {
    let url = `/api/events?limit=50&sort=${sort}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

    fetch(url, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.results)) {
          let list = data.results.map(r => r.event);

          if (featured) {
            list = list.filter(e => e.is_featured);
          }
          if (trending) {
            list = list.filter(e => e.is_trending);
          }
          if (modes.length > 0) {
            list = list.filter(e => modes.includes((e.mode || '').toUpperCase()));
          }

          if (sort === 'popularity') {
            list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
          } else if (sort === 'a_z') {
            list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
          } else if (sort === 'z_a') {
            list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
          }

          setEvents(list);
          setTotalCount(list.length);
        } else {
          setEvents([]);
          setTotalCount(0);
        }
      })
      .catch(() => {
        setEvents([]);
        setTotalCount(0);
      });
  };

  useEffect(() => {
    fetchFilteredEvents(query, sortOption, isFeaturedSelected, isTrendingSelected, selectedModes);
  }, [sortOption, isFeaturedSelected, isTrendingSelected, selectedModes]);

  const handleSearchChange = (val) => {
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchFilteredEvents(val, sortOption, isFeaturedSelected, isTrendingSelected, selectedModes);
    }, 50); // 50ms instant real-time live typing
  };

  const handleModeToggle = (mode) => {
    setSelectedModes(prev => {
      const exists = prev.includes(mode);
      return exists ? prev.filter(m => m !== mode) : [...prev, mode];
    });
  };

  const handleReset = () => {
    setQuery('');
    setSortOption('relevance');
    setIsFeaturedSelected(false);
    setIsTrendingSelected(false);
    setSelectedModes([]);
    fetchFilteredEvents('', 'relevance', false, false, []);
    showToast('Filters reset to default');
  };

  const activeFiltersCount = (isFeaturedSelected ? 1 : 0) + (isTrendingSelected ? 1 : 0) + selectedModes.length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onCreateEventClick={() => setCreateModalOpen(true)} onToast={showToast} />

      <div className="events-page container-fluid">
        <div className="row g-0">
          
          {/* Sidebar Column */}
          <div className="col-lg-3 sidebar-col">
            <SidebarFilters
              searchQuery={query}
              onSearchChange={handleSearchChange}
              sortOption={sortOption}
              onSortChange={(s) => {
                setSortOption(s);
                showToast(`Sorted by ${s}`);
              }}
              isFeaturedSelected={isFeaturedSelected}
              onFeaturedChange={setIsFeaturedSelected}
              isTrendingSelected={isTrendingSelected}
              onTrendingChange={setIsTrendingSelected}
              selectedModes={selectedModes}
              onModeToggle={handleModeToggle}
              onReset={handleReset}
            />
          </div>

          {/* Events List Column */}
          <div className="col-lg-9 events-list-col" style={{ paddingLeft: '20px' }}>
            
            {/* Sort Bar */}
            <div className="sort-bar">
              <div className="results-count-chip">
                <strong>{totalCount}</strong> events found
              </div>

              <button type="button" className="sort-filter-btn" aria-label="Open filters" onClick={handleReset}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1.5 3.5a.5.5 0 0 1 .5-.5h12a.5.5 0 0 1 0 1h-12a.5.5 0 0 1-.5-.5zm2 4a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5zm3 4a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"></path>
                </svg>
                <span>Filters</span>
              </button>

              <div className="view-toggle" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`vt-btn ${viewMode === 'list' ? 'active' : ''}`}
                  aria-pressed={viewMode === 'list'}
                  title="List view"
                  onClick={() => setViewMode('list')}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1.5" width="14" height="3" rx="1"></rect>
                    <rect x="1" y="6.5" width="14" height="3" rx="1"></rect>
                    <rect x="1" y="11.5" width="14" height="3" rx="1"></rect>
                  </svg>
                </button>
                <button
                  type="button"
                  className={`vt-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  aria-pressed={viewMode === 'grid'}
                  title="Grid view"
                  onClick={() => setViewMode('grid')}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6" rx="1"></rect>
                    <rect x="9" y="1" width="6" height="6" rx="1"></rect>
                    <rect x="1" y="9" width="6" height="6" rx="1"></rect>
                    <rect x="9" y="9" width="6" height="6" rx="1"></rect>
                  </svg>
                </button>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className="active-filters" role="group" aria-label="Active filters">
                <div className="filter-count-badge">Filters ({activeFiltersCount})</div>
                {isFeaturedSelected && (
                  <button className="filter-chip" type="button" onClick={() => setIsFeaturedSelected(false)}>
                    Featured
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="2" y1="2" x2="10" y2="10"></line>
                      <line x1="10" y1="2" x2="2" y2="10"></line>
                    </svg>
                  </button>
                )}
                {isTrendingSelected && (
                  <button className="filter-chip" type="button" onClick={() => setIsTrendingSelected(false)}>
                    Trending
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="2" y1="2" x2="10" y2="10"></line>
                      <line x1="10" y1="2" x2="2" y2="10"></line>
                    </svg>
                  </button>
                )}
                {selectedModes.map(m => (
                  <button key={m} className="filter-chip" type="button" onClick={() => handleModeToggle(m)}>
                    {m}
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="2" y1="2" x2="10" y2="10"></line>
                      <line x1="10" y1="2" x2="2" y2="10"></line>
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Events Card Container */}
            <div className="events-list">
              {events.length > 0 ? (
                events.map((e, idx) => (
                  <ModernCard
                    key={e.id || idx}
                    event={e}
                    onCardClick={setActiveModalEvent}
                    onToast={showToast}
                  />
                ))
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280', fontSize: '15px', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                  No events match your criteria. Try adjusting your keywords or filters.
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      <Footer />

      {/* Event Details Modal */}
      {activeModalEvent && (
        <EventModal
          event={activeModalEvent}
          onClose={() => setActiveModalEvent(null)}
          onRegister={() => {
            showToast('🎉 Registered successfully! Confirmation sent.');
            setActiveModalEvent(null);
          }}
          onShare={() => {
            navigator.clipboard.writeText(window.location.href);
            showToast('📋 Event link copied to clipboard!');
          }}
        />
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onToast={showToast}
      />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading events...</div>}>
      <EventsContent />
    </Suspense>
  );
}
