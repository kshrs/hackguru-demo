'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import EventSliderSection from '@/components/EventSliderSection';
import WhyAceSection from '@/components/WhyAceSection';
import Footer from '@/components/Footer';
import EventModal from '@/components/EventModal';
import CreateEventModal from '@/components/CreateEventModal';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/events?limit=50')
      .then(r => r.json())
      .then(d => {
        if (d && d.success && Array.isArray(d.results)) {
          setEvents(d.results.map(r => r.event));
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'ace-toast';
    toast.innerHTML = `<span>✨</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const featuredEvents = events.filter(e => e.is_featured || e.views_count > 1500);
  const trendingEvents = events.filter(e => e.is_trending || e.views_count > 300);
  const virtualEvents = events.filter(e => (e.mode || '').toUpperCase() === 'ONLINE' || (e.location || '').toLowerCase() === 'online');
  const upcomingEvents = events;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onCreateEventClick={() => setCreateModalOpen(true)} onToast={showToast} />
      
      <HeroSection onCreateEventClick={() => setCreateModalOpen(true)} />

      {/* Slider 1: Featured Events */}
      <EventSliderSection
        title="Featured Events"
        count="50 Events"
        seeAllHref="/events?filter=featured"
        events={featuredEvents.length > 0 ? featuredEvents : events}
        onCardClick={setActiveModalEvent}
        onToast={showToast}
      />

      {/* Slider 2: Trending Events */}
      <EventSliderSection
        title="Trending Events"
        count="45 Events"
        seeAllHref="/events?filter=trending"
        events={trendingEvents.length > 0 ? trendingEvents : events}
        onCardClick={setActiveModalEvent}
        onToast={showToast}
      />

      {/* Slider 3: Virtual Events */}
      <EventSliderSection
        title="Virtual Events"
        count="76 Events"
        seeAllHref="/events?mode=ONLINE"
        events={virtualEvents.length > 0 ? virtualEvents : events}
        onCardClick={setActiveModalEvent}
        onToast={showToast}
      />

      {/* Slider 4: Upcoming Events */}
      <EventSliderSection
        title="Upcoming Events"
        count="84 Events"
        seeAllHref="/events"
        events={upcomingEvents.length > 0 ? upcomingEvents : events}
        onCardClick={setActiveModalEvent}
        onToast={showToast}
      />

      <WhyAceSection />

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
