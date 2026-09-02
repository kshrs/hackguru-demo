'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';

const AVAILABLE_INTERESTS = [
  { id: 'ai', label: '🤖 AI & Agentic LLMs', tag: 'AI / Machine Learning', desc: 'GenAI, LLMs, Neural Nets, Agents' },
  { id: 'hackathon', label: '💻 Hackathons & Codathons', tag: 'Hackathons', desc: '24h/36h coding sprints & prizes' },
  { id: 'web', label: '🌐 Web & Full-Stack', tag: 'Web Development', desc: 'React, Next.js, Cloud, Node.js' },
  { id: 'robotics', label: '⚙️ Robotics & IoT', tag: 'Robotics', desc: 'Embedded Systems, Arduino, Drones' },
  { id: 'cyber', label: '🔒 Cybersecurity & Web3', tag: 'Cybersecurity', desc: 'CTFs, Ethical Hacking, Blockchain' },
  { id: 'design', label: '🎨 UI/UX & Product Design', tag: 'UI/UX Design', desc: 'Figma, Design Systems, Usability' },
  { id: 'research', label: '📑 Symposia & Paper Presentation', tag: 'Research & Conference', desc: 'IEEE, National & Int. Conferences' },
  { id: 'competitive', label: '🏆 Competitive Coding', tag: 'Contests', desc: 'DSA, Algorithms, Speed Coding' },
  { id: 'workshops', label: '🚀 Hands-on Workshops', tag: 'Workshops', desc: 'Practical bootcamps & masterclasses' }
];

const PRESET_PERSONAS = [
  {
    name: '🤖 AI & Agentic Hacker',
    interests: ['AI / Machine Learning', 'Hackathons'],
    city: 'Coimbatore',
    skillLevel: 'Intermediate',
    role: 'AI & Data Science Student',
    desc: 'Focuses on building LLM agents and competitive hackathons in Tamil Nadu.'
  },
  {
    name: '⚙️ Robotics & Hardware Maker',
    interests: ['Robotics', 'Workshops'],
    city: 'Coimbatore',
    skillLevel: 'Beginner',
    role: 'Mechatronics / ECE Student',
    desc: 'Looking for hands-on hardware workshops, IoT, and embedded project expos.'
  },
  {
    name: '🎨 Web & UI/UX Designer',
    interests: ['Web Development', 'UI/UX Design'],
    city: 'Online',
    skillLevel: 'Intermediate',
    role: 'Frontend Developer & UI Designer',
    desc: 'Interested in web development competitions and virtual UI/UX design challenges.'
  },
  {
    name: '📑 Research & Symposia Scholar',
    interests: ['Research & Conference', 'Contests'],
    city: 'Chennai',
    skillLevel: 'Advanced',
    role: 'Postgraduate / Research Scholar',
    desc: 'Targeting paper presentations, national conferences, and academic symposia.'
  }
];

export default function ProfileInterestsPage() {
  const router = useRouter();
  const [name, setName] = useState('Kishor (Student)');
  const [college, setCollege] = useState('Kumaraguru College of Technology');
  const [selectedInterests, setSelectedInterests] = useState(['AI / Machine Learning', 'Hackathons']);
  const [city, setCity] = useState('Coimbatore');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [role, setRole] = useState('AI & Engineering Student');
  const [livePreview, setLivePreview] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [savedToast, setSavedToast] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hackguru_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.college) setCollege(parsed.college);
        if (parsed.interests) setSelectedInterests(parsed.interests);
        if (parsed.city) setCity(parsed.city);
        if (parsed.skillLevel) setSkillLevel(parsed.skillLevel);
        if (parsed.role) setRole(parsed.role);
      }
    } catch (e) {}
  }, []);

  // Real-time live recommendation preview as interests/city change
  useEffect(() => {
    setIsLoadingPreview(true);
    const query = new URLSearchParams({
      interests: selectedInterests.join(','),
      city,
      skillLevel,
      limit: '4'
    });

    fetch(`/api/recommendations?${query.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.success && Array.isArray(d.recommendations)) {
          setLivePreview(d.recommendations.map(r => ({
            ...r.event,
            match_percentage: r.match_percentage,
            explanation: r.explanation,
            is_explore: r.is_explore,
            score: r.score
          })));
        }
        setIsLoadingPreview(false);
      })
      .catch(() => setIsLoadingPreview(false));
  }, [selectedInterests, city, skillLevel]);

  const toggleInterest = (tag) => {
    if (selectedInterests.includes(tag)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter(i => i !== tag));
      }
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const applyPreset = (persona) => {
    setSelectedInterests(persona.interests);
    setCity(persona.city);
    setSkillLevel(persona.skillLevel);
    setRole(persona.role);
  };

  const handleSave = () => {
    const updated = {
      name,
      college,
      interests: selectedInterests,
      city,
      skillLevel,
      role,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem('hackguru_user_profile', JSON.stringify(updated));
    } catch (e) {}

    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      router.push('/');
    }, 1200);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <Navbar />

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #9333EA 100%)',
        color: '#FFFFFF',
        padding: '50px 20px 70px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <span style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '6px 14px',
            borderRadius: '999px',
            display: 'inline-block',
            marginBottom: '14px'
          }}>
            AI Preference &amp; Persona Engine
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 10px', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            User Profile &amp; Interest Discovery
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', maxWidth: '650px', margin: '0 auto' }}>
            Configure your technical domains, skill tier, and local campus preferences to calibrate our 2-stage recommendation engine.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1080px', margin: '-40px auto 60px', padding: '0 20px', width: '100%', flex: 1 }}>
        
        {/* User Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E5E7EB',
          padding: '28px 32px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src="/ace_files/unnamed.png"
                alt="Profile"
                style={{ width: '76px', height: '76px', borderRadius: '50%', border: '3px solid #7C3AED', background: '#FFFFFF' }}
              />
              <span style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#10B981',
                border: '2px solid white'
              }}></span>
            </div>
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#111827',
                  border: 'none',
                  borderBottom: '1px dashed #D1D5DB',
                  background: 'transparent',
                  padding: '2px 0',
                  outline: 'none',
                  width: '100%',
                  maxWidth: '300px'
                }}
              />
              <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                🏫 {college} • 📍 {city}
              </div>
              <div style={{ fontSize: '13px', color: '#7C3AED', fontWeight: 700, marginTop: '2px' }}>
                🎓 {role} ({skillLevel})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              style={{
                background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(109, 40, 217, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Save &amp; View Feed ✨</span>
            </button>
          </div>
        </div>

        {/* Section 1: 1-Click Demo Personas */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E5E7EB',
          padding: '28px 32px',
          marginBottom: '28px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
              ⚡ Quick Test Personas (1-Click Evaluation)
            </h3>
            <p style={{ fontSize: '13.5px', color: '#6B7280', margin: 0 }}>
              Click any profile persona below to test how our embedding vector changes and re-ranks the live recommendations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
            {PRESET_PERSONAS.map((p, idx) => (
              <div
                key={idx}
                onClick={() => applyPreset(p)}
                style={{
                  border: '1px solid #DDD6FE',
                  background: '#FAF5FF',
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#7C3AED';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#DDD6FE';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#6D28D9', marginBottom: '4px' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.4', marginBottom: '8px' }}>
                  {p.desc}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {p.interests.map((int, i) => (
                    <span key={i} style={{ background: '#EDE9FE', color: '#5B21B6', fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px' }}>
                      {int}
                    </span>
                  ))}
                  <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px' }}>
                    📍 {p.city}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Technical Domain Interests */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E5E7EB',
          padding: '28px 32px',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
                🎯 Choose Your Technical Domains ({selectedInterests.length} Selected)
              </h3>
              <p style={{ fontSize: '13.5px', color: '#6B7280', margin: 0 }}>
                These keywords are projected into our 384-dimensional vector space for semantic similarity scoring.
              </p>
            </div>
            <span style={{ background: '#F3E8FF', color: '#7C3AED', fontWeight: 800, fontSize: '12px', padding: '4px 10px', borderRadius: '999px' }}>
              Multi-Select Active
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {AVAILABLE_INTERESTS.map((item) => {
              const isSelected = selectedInterests.includes(item.tag);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleInterest(item.tag)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #7C3AED' : '1px solid #E5E7EB',
                    background: isSelected ? '#FAF5FF' : '#FFFFFF',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? '#6D28D9' : '#1F2937' }}>
                      {item.label}
                    </span>
                    {isSelected && <span style={{ color: '#7C3AED', fontWeight: 900, fontSize: '16px' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                    {item.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Location & Skill Tier Filters */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E5E7EB',
          padding: '28px 32px',
          marginBottom: '28px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>
            📍 Campus Location &amp; Experience Level
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Preferred City / Mode
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                  outline: 'none'
                }}
              >
                <option value="Coimbatore">Coimbatore (Local Campus Hub)</option>
                <option value="Chennai">Chennai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Online">Online / Virtual Remote Events</option>
                <option value="All">All Cities across India</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Academic Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                  outline: 'none'
                }}
              >
                <option value="Beginner">1st / 2nd Year (Foundations &amp; Beginner Friendly)</option>
                <option value="Intermediate">3rd / 4th Year (Hackathons &amp; Hands-on Coding)</option>
                <option value="Advanced">Postgraduate / Research &amp; Symposia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Live AI Recommendation Preview */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E5E7EB',
          padding: '28px 32px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨ Real-Time AI Recommendations Preview</span>
                {isLoadingPreview && <span style={{ fontSize: '12px', color: '#7C3AED' }}>Updating vector space...</span>}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#6B7280', margin: 0 }}>
                Top ranked events calculated instantly from your selected profile vector:
              </p>
            </div>

            <button
              onClick={handleSave}
              style={{
                background: '#6D28D9',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Apply to Homepage ➔
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            {livePreview.map((ev, idx) => (
              <EventCard
                key={ev.id || idx}
                event={ev}
                onCardClick={setActiveModalEvent}
                showMatchBadge={true}
              />
            ))}
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <button
            onClick={handleSave}
            style={{
              background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '16px 40px',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(109, 40, 217, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>Save Preferences &amp; Go to Homepage ✨</span>
          </button>
        </div>

      </div>

      <Footer />

      {/* Confirmation Toast */}
      {savedToast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10B981',
          color: '#FFFFFF',
          padding: '14px 28px',
          borderRadius: '999px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
          fontWeight: 800,
          fontSize: '15px',
          zIndex: 9999
        }}>
          🎉 Preferences saved! Redirecting to feed...
        </div>
      )}

      {/* Event Details Modal */}
      {activeModalEvent && (
        <EventModal
          event={activeModalEvent}
          onClose={() => setActiveModalEvent(null)}
          onRegister={() => {
            setActiveModalEvent(null);
          }}
          onShare={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
        />
      )}
    </div>
  );
}
