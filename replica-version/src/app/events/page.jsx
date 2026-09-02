'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';

function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQ = searchParams.get('q') || searchParams.get('searchText') || '';
  const initialCat = searchParams.get('category') || searchParams.get('filter') || '';
  const initialMode = searchParams.get('mode') || '';
  const initialLoc = searchParams.get('location') || '';

  const [query, setQuery] = useState(initialQ);
  const [selectedCategories, setSelectedCategories] = useState(initialCat ? [initialCat] : []);
  const [selectedModes, setSelectedModes] = useState(initialMode ? [initialMode.toUpperCase()] : []);
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortOption, setSortOption] = useState('relevance');
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeModalEvent, setActiveModalEvent] = useState(null);

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

  const fetchEvents = (searchQuery, cats, modes, price, sort) => {
    setLoading(true);
    let url = `/api/events?limit=50&sort=${sort}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (cats.length > 0) url += `&category=${encodeURIComponent(cats.join(','))}`;
    if (modes.length > 0) url += `&mode=${encodeURIComponent(modes.join(','))}`;
    if (price && price !== 'all') url += `&price=${price}`;
    if (initialLoc) url += `&location=${encodeURIComponent(initialLoc)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.results)) {
          let eventList = data.results.map(r => r.event);

          if (cats.length > 0) {
            eventList = eventList.filter(e => cats.some(c => (e.category || '').toLowerCase().includes(c.toLowerCase()) || (e.title || '').toLowerCase().includes(c.toLowerCase())));
          }
          if (modes.length > 0) {
            eventList = eventList.filter(e => modes.includes((e.mode || '').toUpperCase()));
          }
          if (price === 'free') {
            eventList = eventList.filter(e => (e.price || '').toLowerCase().includes('free') || e.price === '0' || e.price === '₹0');
          } else if (price === 'paid') {
            eventList = eventList.filter(e => !(e.price || '').toLowerCase().includes('free') && e.price !== '0' && e.price !== '₹0');
          }

          setResults(eventList);
          setTotalCount(eventList.length);
        } else {
          setResults([]);
          setTotalCount(0);
        }
      })
      .catch(() => {
        setResults([]);
        setTotalCount(0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents(query, selectedCategories, selectedModes, priceFilter, sortOption);
  }, [selectedCategories, selectedModes, priceFilter, sortOption]);

  const handleQueryChange = (e) => {
    const nextQ = e.target.value;
    setQuery(nextQ);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchEvents(nextQ, selectedCategories, selectedModes, priceFilter, sortOption);
    }, 50);
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => {
      const exists = prev.includes(cat);
      if (exists) return prev.filter(c => c !== cat);
      return [...prev, cat];
    });
  };

  const toggleMode = (mode) => {
    setSelectedModes(prev => {
      const exists = prev.includes(mode);
      if (exists) return prev.filter(m => m !== mode);
      return [...prev, mode];
    });
  };

  const handleReset = () => {
    setQuery('');
    setSelectedCategories([]);
    setSelectedModes([]);
    setPriceFilter('all');
    setSortOption('relevance');
    fetchEvents('', [], [], 'all', 'relevance');
    showToast('Filters reset to default');
  };

  const categoriesList = [
    { label: 'Hackathon', count: 18 },
    { label: 'Workshop', count: 12 },
    { label: 'Conference', count: 8 },
    { label: 'Contest', count: 5 },
    { label: 'Internship', count: 2 }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
      <Navbar />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', width: '100%', flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
        
        {/* Sidebar Filters */}
        <aside style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Filters</h3>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>Find Events That Match You</span>
            </div>
            <button
              onClick={handleReset}
              style={{ background: 'none', border: 'none', color: '#7F00FF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Reset all
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <input
              type="search"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search events, colleges, cities…"
              style={{
                width: '100%',
                padding: '12px 14px 12px 38px',
                border: '1px solid #D1D5DB',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none',
                background: '#F9FAFB',
                boxSizing: 'border-box'
              }}
            />
            <svg style={{ position: 'absolute', left: '12px', top: '14px', width: '16px', height: '16px', color: '#9CA3AF' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Category
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categoriesList.map(cat => (
                <label key={cat.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#4B5563', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.label)}
                      onChange={() => toggleCategory(cat.label)}
                      style={{ accentColor: '#7F00FF', cursor: 'pointer' }}
                    />
                    <span>{cat.label}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
                    {cat.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Format / Mode
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['OFFLINE', 'ONLINE', 'HYBRID'].map(mode => (
                <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4B5563', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedModes.includes(mode)}
                    onChange={() => toggleMode(mode)}
                    style={{ accentColor: '#7F00FF', cursor: 'pointer' }}
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Pricing
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'free', label: 'Free' },
                { id: 'paid', label: 'Paid' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPriceFilter(p.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: '1px solid #D1D5DB',
                    background: priceFilter === p.id ? '#7F00FF' : '#FFF',
                    color: priceFilter === p.id ? '#FFF' : '#374151',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* Results Area */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
                Explore College Events
              </h2>
              <div className="results-count-chip" style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                Showing <strong>{totalCount}</strong> verified events
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[
                { id: 'relevance', label: 'Recent' },
                { id: 'popularity', label: 'Most viewed' },
                { id: 'a_z', label: 'A → Z' },
                { id: 'z_a', label: 'Z → A' }
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => {
                    setSortOption(pill.id);
                    showToast('Sorted by ' + pill.label);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: '1px solid #E5E7EB',
                    background: sortOption === pill.id ? '#7F00FF' : '#FFF',
                    color: sortOption === pill.id ? '#FFF' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {results.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '24px'
              }}
            >
              {results.map((e, idx) => (
                <EventCard
                  key={e.id || idx}
                  event={e}
                  onCardClick={setActiveModalEvent}
                  onToast={showToast}
                />
              ))}
            </div>
          ) : (
            <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>No matching college events found</h3>
              <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '420px', margin: '0 auto 20px' }}>
                Try adjusting your search keywords, clearing selected category filters, or switching format options.
              </p>
              <button
                onClick={handleReset}
                style={{
                  background: '#7F00FF',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}

        </section>

      </div>

      <Footer />

      {activeModalEvent && (
        <EventModal
          event={activeModalEvent}
          onClose={() => setActiveModalEvent(null)}
          onRegister={(e) => {
            showToast('🎉 Registered successfully! Confirmation email sent.');
            setActiveModalEvent(null);
          }}
          onShare={(e) => {
            navigator.clipboard.writeText(window.location.href);
            showToast('📋 Event link copied to clipboard!');
          }}
        />
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading events catalog...</div>}>
      <EventsContent />
    </Suspense>
  );
}
