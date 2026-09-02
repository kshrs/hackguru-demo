'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="Footer-module__pru1la__root">
      <div className="Footer-module__pru1la__skyline">
        <img alt="Skyline" src="/ace_files/footer.png" />
      </div>

      <div className="Footer-module__pru1la__main">
        <div className="Footer-module__pru1la__container">
          
          {/* Brand & Socials */}
          <div className="Footer-module__pru1la__brand">
            <img alt="ACE Logo" className="Footer-module__pru1la__logo" src="/ace_files/logo.png" />
            <p className="Footer-module__pru1la__brandText">
              Life is full of events. Don&apos;t let them pass unnoticed.{' '}
              <span>Explore, experience, and excel</span> with ACE – your ultimate college event companion.
            </p>

            <div className="Footer-module__pru1la__socials">
              <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="Footer-module__pru1la__socialIcon Footer-module__pru1la__facebook" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 39 39" fill="none">
                  <path d="M19.0633 3.17383C10.2908 3.17383 3.17969 10.2849 3.17969 19.0574C3.17969 27.0198 9.04549 33.5956 16.6887 34.744V23.2665H12.7591V19.0908H16.6887V16.3127C16.6887 11.7128 18.9298 9.69403 22.753 9.69403C24.5844 9.69403 25.5517 9.82904 26.0107 9.89099V13.5347H23.4026C21.7793 13.5347 21.2123 15.0738 21.2123 16.8083V19.0908H25.9694L25.3246 23.2665H21.2139V34.7774C28.9667 33.7275 34.9468 27.0977 34.9468 19.0574C34.9468 10.2849 27.8358 3.17383 19.0633 3.17383Z" fill="#FEF9FF" />
                </svg>
              </a>

              <a href="https://www.instagram.com/allcollegeevent/" target="_blank" rel="noreferrer" className="Footer-module__pru1la__socialIcon Footer-module__pru1la__instagram" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 39 39" fill="none">
                  <path d="M18.9265 3.42773C4.5615 3.42773 3.4375 4.55252 3.4375 18.9167V19.1976C3.4375 33.5618 4.5615 34.6866 18.9265 34.6866H19.2074C33.5724 34.6866 34.6964 33.5618 34.6964 19.1976V19.0572C34.6964 4.56243 33.5617 3.42773 19.0669 3.42773H18.9265ZM28.44 8.11656C29.3035 8.11422 30.0052 8.8114 30.0075 9.67493C30.0099 10.5385 29.3127 11.2401 28.4492 11.2425C27.5856 11.2448 26.884 10.5476 26.8817 9.68409C26.8793 8.82056 27.5765 8.11891 28.44 8.11656ZM19.0486 11.2425C23.3639 11.2323 26.8715 14.7236 26.8817 19.0389C26.8918 23.3541 23.4005 26.8617 19.0852 26.8719C14.77 26.882 11.2624 23.3908 11.2522 19.0755C11.2421 14.7602 14.7333 11.2526 19.0486 11.2425ZM19.0562 14.3683C16.4665 14.3746 14.3719 16.4796 14.3781 19.0694C14.3844 21.6584 16.4886 23.7522 19.0776 23.746C21.6674 23.7397 23.762 21.6355 23.7558 19.0465C23.7495 16.4567 21.6453 14.3621 19.0562 14.3683Z" fill="#FEF9FF" />
                </svg>
              </a>

              <a href="https://www.youtube.com/@ECLearnix" target="_blank" rel="noreferrer" className="Footer-module__pru1la__socialIcon Footer-module__pru1la__youtube" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 39 39" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M34.3136 10.985C34.1956 9.61719 33.1116 8.5332 31.7437 8.4152C29.2458 8.19971 19.2073 8.19971 19.2073 8.19971C19.2073 8.19971 9.16875 8.19971 6.67087 8.4152C5.30297 8.5332 4.21898 9.61719 4.10098 10.985C3.88549 13.4829 3.88549 18.6662 3.88549 18.6662C3.88549 18.6662 3.88549 23.8495 4.10098 26.3474C4.21898 27.7153 5.30297 28.7993 6.67087 28.9173C9.16875 29.1328 19.2073 29.1328 19.2073 29.1328C19.2073 29.1328 29.2458 29.1328 31.7437 28.9173C33.1116 28.7993 34.1956 27.7153 34.3136 26.3474C34.5291 23.8495 34.5291 18.6662 34.5291 18.6662C34.5291 18.6662 34.5291 13.4829 34.3136 10.985Z M16.1406 22.8456V14.4868L23.4146 18.6662L16.1406 22.8456Z" fill="#FEF9FF" />
                </svg>
              </a>

              <a href="https://x.com/eclearnix_888" target="_blank" rel="noreferrer" className="Footer-module__pru1la__socialIcon Footer-module__pru1la__twitter" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 39 39" fill="none">
                  <path d="M8.2645 3.04883C5.38719 3.04883 3.05469 5.38134 3.05469 8.25864V29.0979C3.05469 31.9752 5.38719 34.3077 8.2645 34.3077H29.1037C31.981 34.3077 34.3136 31.9752 34.3136 29.0979V8.25864C34.3136 5.38134 31.981 3.04883 29.1037 3.04883H8.2645ZM9.81698 9.74716H15.7245L19.9197 15.7085L25.0103 9.74716H26.871L20.7599 16.9019L28.2955 27.6094H22.3894L17.5212 20.693L11.6137 27.6094H9.75302L16.681 19.4996L9.81698 9.74716ZM12.6661 11.2357L23.1657 26.1208H25.4464L14.9468 11.2357H12.6661Z" fill="#FEF9FF" />
                </svg>
              </a>

              <a href="https://www.linkedin.com/company/eclearnix-edtech-private-limited/" target="_blank" rel="noreferrer" className="Footer-module__pru1la__socialIcon Footer-module__pru1la__linkedin" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 39 39" fill="none">
                  <path d="M30.9751 3.42773H7.15879C5.10464 3.42773 3.4375 5.09487 3.4375 7.14903V30.9653C3.4375 33.0195 5.10464 34.6866 7.15879 34.6866H30.9751C33.0292 34.6866 34.6964 33.0195 34.6964 30.9653V7.14903C34.6964 5.09487 33.0292 3.42773 30.9751 3.42773ZM13.1129 15.3359V29.4768H8.64731V15.3359H13.1129ZM8.64731 11.2201C8.64731 10.1782 9.54042 9.3818 10.8801 9.3818C12.2198 9.3818 13.0608 10.1782 13.1129 11.2201C13.1129 12.2621 12.2793 13.1031 10.8801 13.1031C9.54042 13.1031 8.64731 12.2621 8.64731 11.2201ZM29.4866 29.4768H25.021C25.021 29.4768 25.021 22.585 25.021 22.0342C25.021 20.5457 24.2767 19.0572 22.4161 19.0274H22.3566C20.5555 19.0274 19.8112 20.5606 19.8112 22.0342C19.8112 22.7115 19.8112 29.4768 19.8112 29.4768H15.3456V15.3359H19.8112V17.2412C19.8112 17.2412 21.2476 15.3359 24.1353 15.3359C27.09 15.3359 29.4866 17.3677 29.4866 21.4835V29.4768Z" fill="#FEF9FF" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="Footer-module__pru1la__rightContent">
            <div className="Footer-module__pru1la__linksGrid">
              <div className="Footer-module__pru1la__col">
                <h4>Quick Links</h4>
                <ul>
                  <li><Link href="/events?filter=trending">Trending Events</Link></li>
                  <li><Link href="/events?filter=featured">Upcoming Fests</Link></li>
                  <li><Link href="/events">Event Types</Link></li>
                  <li><Link href="/events">Leaderboard</Link></li>
                </ul>
              </div>

              <div className="Footer-module__pru1la__col">
                <h4>Support</h4>
                <ul>
                  <li><Link href="/events">About us</Link></li>
                  <li><Link href="/events">FAQ</Link></li>
                  <li><Link href="/events">Contact</Link></li>
                  <li><Link href="/events">Feedback</Link></li>
                </ul>
              </div>

              <div className="Footer-module__pru1la__col">
                <h4>Legal</h4>
                <ul>
                  <li><Link href="/events">Privacy Policy</Link></li>
                  <li><Link href="/events">Terms &amp; Conditions</Link></li>
                  <li><Link href="/events">Cookie Policy</Link></li>
                  <li><Link href="/events">Disclaimer</Link></li>
                </ul>
              </div>
            </div>

            <div className="Footer-module__pru1la__contactInfo">
              <a href="mailto:support@allcollegeevent.com" className="Footer-module__pru1la__contactLink">
                <div className="Footer-module__pru1la__contactItem">
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                  <span>support@allcollegeevent.com</span>
                </div>
              </a>
            </div>
          </div>

        </div>
      </div>

      <div className="Footer-module__pru1la__bottomBar">
        <div className="Footer-module__pru1la__bottomContainer">
          <p>© 2026 ACE – All College Event. Powered by ECLearnix Technology Solution Private Limited.</p>
        </div>
      </div>
    </footer>
  );
}
