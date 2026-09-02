'use client';

import React from 'react';

export default function WhyAceSection() {
  return (
    <section className="why-ace container-xl" style={{ marginTop: '50px', marginBottom: '60px' }}>
      <div className="text-center mb-5">
        <h1 className="why-title">
          <span className="text-purple">Why Choose</span> AllCollegeEvent ?
        </h1>
        <p className="why-sub">
          Enjoy a seamless and delightful ticketing experience with these powerful benefits
        </p>
      </div>

      <div className="why-grid">
        <div className="why-card horizontal card-accessible">
          <div className="why-img-left">
            <img alt="Accessible Anywhere" src="/ace_files/businesswomanImage.svg" />
          </div>
          <div className="why-text">
            <h5>Accessible Anywhere</h5>
            <p>
              Access the platform from any device. All College Event makes discovering and joining events quick and convenient whenever and wherever you are.
            </p>
          </div>
        </div>

        <div className="why-card vertical">
          <h5>All-in-One Event Hub</h5>
          <p>
            From technical conferences to cultural celebrations, Allcollegeevent centralizes college events from multiple campuses into a single, easy-to-use platform for effortless discovery.
          </p>
          <div className="why-img-bottom">
            <img alt="All-in-One Event Hub" src="/ace_files/recruitmentSalesImage.svg" />
          </div>
        </div>

        <div className="why-card horizontal card-students">
          <div className="why-img-left">
            <img alt="Built for Students &amp; Organizers" src="/ace_files/parent-volunteersImage.svg" />
          </div>
          <div className="why-text">
            <h5>Built for Students &amp; Organizers</h5>
            <p>
              Students can explore and track events, while organizers can publish, manage their events to the right audience efficiently.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
