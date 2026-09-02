'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#111827', color: '#9CA3AF', padding: '60px 24px 30px', marginTop: '60px', position: 'relative' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '40px' }}>
        
        {/* Col 1 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800 }}>
              H
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
              Hack<span style={{ color: '#A855F7' }}>GURU</span>
            </span>
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#9CA3AF' }}>
            India’s leading verified discovery platform for college hackathons, technical symposiums, research conferences, and internships.
          </p>
        </div>

        {/* Col 2 */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Categories</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <li><Link href="/events?category=Hackathon" style={{ color: '#9CA3AF', textDecoration: 'none' }}>National Hackathons</Link></li>
            <li><Link href="/events?category=Workshop" style={{ color: '#9CA3AF', textDecoration: 'none' }}>AI & ML Workshops</Link></li>
            <li><Link href="/events?category=Conference" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Research Conferences</Link></li>
            <li><Link href="/events?category=Contest" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Coding Contests</Link></li>
            <li><Link href="/events?category=Internship" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Student Internships</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Hubs</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <li><Link href="/events?location=Coimbatore" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Coimbatore</Link></li>
            <li><Link href="/events?location=Chennai" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Chennai</Link></li>
            <li><Link href="/events?location=Bengaluru" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Bengaluru</Link></li>
            <li><Link href="/events?location=New+Delhi" style={{ color: '#9CA3AF', textDecoration: 'none' }}>New Delhi</Link></li>
            <li><Link href="/events?mode=ONLINE" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Online / Virtual</Link></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <li><Link href="/events" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Explore All Events</Link></li>
            <li><a href="/api/algorithm-info" target="_blank" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Algorithm Architecture</a></li>
            <li><span style={{ color: '#10B981', fontWeight: 700, fontSize: '12px' }}>● 100% In-Memory Node.js Hybrid Engine</span></li>
          </ul>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: '24px', borderTop: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', flexWrap: 'wrap', gap: '12px' }}>
        <div>© 2026 HackGURU India. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Contact Us</span>
        </div>
      </div>
    </footer>
  );
}
