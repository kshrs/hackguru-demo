'use client';

import React from 'react';

export default function HeroSection({ onCreateEventClick }) {
  return (
    <section className="ace-hero container-xl">
      <div className="row align-items-center gx-5 gy-5">
        <div className="col-lg-6">
          <h1 className="ace-title">Discover Amazing College Events</h1>
          <p className="ace-desc">
            From cultural fests to tech challenges, our events are designed to engage, empower, and elevate every participant.
          </p>
          <div className="d-flex gap-3 mt-5 flex-wrap">
            <button className="ace-create-event" onClick={onCreateEventClick}>
              Create event
            </button>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="ace-image-grid">
            <img alt="Live Concert Event" loading="lazy" src="/ace_files/concert-live-event.jpeg" />
            <img alt="Conference Seminar Hall" loading="lazy" src="/ace_files/conference-seminar-hall.jpeg" />
            <img alt="Coding Workshop Session" loading="lazy" src="/ace_files/coding-workshop-session.jpeg" />
            <img alt="Marathon Sports Event" loading="lazy" src="/ace_files/marathon-sports-event.jpeg" />
            <img alt="College Sports Ground" loading="lazy" src="/ace_files/college-sports-ground.jpeg" />
            <img alt="Professional Networking Event" loading="lazy" src="/ace_files/professional-networking-event.jpeg" />
          </div>
        </div>
      </div>
    </section>
  );
}
