'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import EventSliderSection from '@/components/EventSliderSection';
import WhyAceSection from '@/components/WhyAceSection';
import Footer from '@/components/Footer';
import EventModal from '@/components/EventModal';
import CreateEventModal from '@/components/CreateEventModal';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Kishor (Student)',
    interests: ['AI / Machine Learning', 'Hackathons'],
    city: 'Coimbatore',
    skillLevel: 'Beginner',
    role: 'AI Developer'
  });

  const fetchRecommendations = (profile) => {
    const prof = profile || userProfile;
    const query = new URLSearchParams({
      user_id: prof.id || 'usr_kishor',
      interests: (prof.interests || ['AI / Machine Learning', 'Hackathons']).join(','),
      city: prof.city || 'Coimbatore',
      skillLevel: prof.skillLevel || 'Beginner',
      limit: '8'
    });

    fetch(`/api/recommendations?${query.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.success && Array.isArray(d.recommendations)) {
          setRecommendedEvents(d.recommendations.map(r => ({
            ...(r.event || r),
            badge: r.badge,
            reason: r.reason,
            match_percentage: r.match_percentage || (r.score ? Math.min(99, Math.floor(r.score * 100)) : 94),
            explanation: r.badge || r.explanation || r.reason || null,
            is_exploration: Boolean(r.is_exploration),
            is_explore: Boolean(r.is_exploration || r.is_explore),
            score: r.score
          })));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // 1. Load user profile from localStorage if exists
    let activeProfile = userProfile;
    try {
      const saved = localStorage.getItem('hackguru_user_profile');
      if (saved) {
        activeProfile = JSON.parse(saved);
        setUserProfile(activeProfile);
      }
    } catch (e) {}

    // 2. Fetch all events for catalog rows
    fetch('/api/events?limit=50')
      .then(r => r.json())
      .then(d => {
        if (d && d.success && Array.isArray(d.results)) {
          setEvents(d.results.map(r => r.event));
        }
      })
      .catch(() => {});

    // 3. Fetch personalized recommendations
    fetchRecommendations(activeProfile);
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
      <Navbar
        onCreateEventClick={() => setCreateModalOpen(true)}
        onToast={showToast}
      />
      
      <HeroSection onCreateEventClick={() => setCreateModalOpen(true)} />

      {/* Profile Bar / Quick Personalize Banner */}
      <div style={{
        maxWidth: '1320px',
        margin: '0 auto',
        padding: '0 20px',
        width: '100%',
        marginTop: '-10px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)',
          border: '1px solid #DDD6FE',
          borderRadius: '16px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#7C3AED',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '4px 10px',
              borderRadius: '999px'
            }}>
              ✨ AI Personalized Feed
            </span>
            <span style={{ fontSize: '13.5px', color: '#4C1D95', fontWeight: 600 }}>
              Tailored for <strong>{userProfile.name || 'Kishor'}</strong> • {userProfile.city || 'Coimbatore'} • Interests: {(userProfile.interests || []).join(', ')}
            </span>
          </div>

          <Link
            href="/profile"
            style={{
              background: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '7px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)'
            }}
          >
            <span>⚙️ Edit / Test Interests Page</span>
          </Link>
        </div>
      </div>

      {/* Primary Spotlight: AI Recommended For You */}
      {recommendedEvents.length > 0 && (
        <EventSliderSection
          title="✨ AI Recommended For You"
          count={`${recommendedEvents.length} Top Matches`}
          seeAllHref="/events"
          events={recommendedEvents}
          onCardClick={setActiveModalEvent}
          onToast={showToast}
        />
      )}

      {/* Slider 1: Featured Events */}
      <EventSliderSection
        title="Featured Events"
        count="50 Events"
        seeAllHref="/events"
        events={featuredEvents.length > 0 ? featuredEvents : events}
        onCardClick={setActiveModalEvent}
        onToast={showToast}
      />

      {/* Slider 2: Trending Events */}
      <EventSliderSection
        title="Trending Events"
        count="45 Events"
        seeAllHref="/events"
        events={trendingEvents.length > 0 ? trendingEvents : events}
        onCardClick={setActiveModalEvent}
        onToast={showToast}
      />

      {/* Slider 3: Virtual Events */}
      <EventSliderSection
        title="Virtual Events"
        count="76 Events"
        seeAllHref="/events"
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
