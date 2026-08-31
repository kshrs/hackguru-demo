/**
 * HackGuru - Frontend Application JavaScript
 * Controls UI interactions, live search, algorithmic filtering,
 * modal dialogs, bookmarking, registration, and A/B benchmarking.
 */

// Application State
const AppState = {
  activeCategory: 'all',
  activeMode: 'all',
  activeLocation: 'all',
  activePrice: 'all',
  searchQuery: '',
  algoMode: 'default',
  aiEnabled: false,
  bookmarkedEventIds: new Set(),
  currentEventDetail: null,
};

// DOM Utility
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAlgorithmInfo();
  await fetchUserProfile();
  await loadFeaturedEvents();
  await loadTrendingEvents();
  await loadVirtualEvents();
  await loadUpcomingEvents();
  await loadLocations();
  await loadNotifications();
  setupEventListeners();
});

/* --------------------------------------------------------------------------
   API Fetchers
   -------------------------------------------------------------------------- */

async function fetchAlgorithmInfo() {
  try {
    const res = await fetch('/api/algorithm-info');
    const data = await res.json();
    AppState.algoMode = data.mode;
    AppState.aiEnabled = data.ai_enabled;

    const bannerBadge = $('#algoBadge');
    const bannerText = $('#algoBannerText');
    if (data.ai_enabled) {
      bannerBadge.className = 'algo-badge-pill algo-badge-ai';
      bannerBadge.textContent = '⚡ AI Search & Rec ACTIVE';
      bannerText.textContent = 'Dense Semantic Vectors · Subword BM25 Hybrid · MMR Diversity Re-ranking';
    } else {
      bannerBadge.className = 'algo-badge-pill algo-badge-default';
      bannerBadge.textContent = '⚙️ Default Algorithm';
      bannerText.textContent = 'Standard Rule-Based & Multi-field Substring Search (Start with --with-ai for AI engine)';
    }
  } catch (err) {
    console.error('Failed to fetch algorithm info:', err);
  }
}

async function fetchUserProfile() {
  try {
    const res = await fetch('/api/profile');
    const data = await res.json();
    if (data.success) {
      if (data.bookmarks) {
        data.bookmarks.forEach(b => AppState.bookmarkedEventIds.add(b.event_id));
      }
      $('#profileName').textContent = data.profile.name;
      $('#profileEmail').textContent = data.profile.email;
      $('#profileSavedCount').textContent = data.profile.saved_count;
      $('#profileRegCount').textContent = data.profile.registered_count;
    }
  } catch (err) {
    console.error('Failed to fetch profile:', err);
  }
}

async function loadFeaturedEvents() {
  try {
    const res = await fetch('/api/featured');
    const data = await res.json();
    if (data.success) {
      $('#featuredCountChip').textContent = `${data.count} Events`;
      renderEventTrack($('#featuredTrack'), data.events);
    }
  } catch (err) {
    console.error('Error loading featured events:', err);
  }
}

async function loadTrendingEvents() {
  try {
    const res = await fetch('/api/trending');
    const data = await res.json();
    if (data.success) {
      $('#trendingCountChip').textContent = `${data.count} Events`;
      renderEventTrack($('#trendingTrack'), data.events);
    }
  } catch (err) {
    console.error('Error loading trending events:', err);
  }
}

async function loadVirtualEvents() {
  try {
    const res = await fetch('/api/virtual');
    const data = await res.json();
    if (data.success) {
      $('#virtualCountChip').textContent = `${data.count} Events`;
      renderEventTrack($('#virtualTrack'), data.events);
    }
  } catch (err) {
    console.error('Error loading virtual events:', err);
  }
}

async function loadUpcomingEvents() {
  try {
    const params = new URLSearchParams({
      q: AppState.searchQuery,
      category: AppState.activeCategory,
      mode: AppState.activeMode,
      location: AppState.activeLocation,
      price: AppState.activePrice,
      limit: '24'
    });

    const res = await fetch(`/api/events?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      $('#upcomingCountChip').textContent = `${data.total_count} Events`;
      const grid = $('#upcomingGrid');
      grid.innerHTML = '';

      if (data.results.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: #fff; border-radius: 20px; border: 1px dashed #d1d5db;">
            <h3>No matching college events found</h3>
            <p style="margin-top: 8px;">Try searching for "Hackathon", "AI", "Internship", or clear your filter criteria.</p>
            <button class="btn-primary" style="margin-top: 16px;" onclick="resetAllFilters()">Reset Filters</button>
          </div>
        `;
        return;
      }

      data.results.forEach(item => {
        const card = createEventCard(item.event, item.explanation || item.reason);
        grid.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Error loading upcoming events:', err);
  }
}

async function loadLocations() {
  try {
    const res = await fetch('/api/locations');
    const data = await res.json();
    if (data.success) {
      const container = $('#citiesGrid');
      container.innerHTML = '';
      data.locations.forEach(loc => {
        const cityDiv = document.createElement('div');
        cityDiv.className = 'city-card';
        cityDiv.innerHTML = `
          <h4>${loc.city}</h4>
          <span>${loc.count} Events</span>
        `;
        cityDiv.addEventListener('click', () => {
          AppState.activeLocation = loc.city;
          $('#locationSelect').value = loc.city;
          loadUpcomingEvents();
          document.getElementById('upcomingSection').scrollIntoView({ behavior: 'smooth' });
        });
        container.appendChild(cityDiv);
      });
    }
  } catch (err) {
    console.error('Error loading locations:', err);
  }
}

async function loadNotifications() {
  try {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    if (data.success) {
      const list = $('#notifList');
      list.innerHTML = '';
      data.notifications.forEach(n => {
        const div = document.createElement('div');
        div.className = 'notif-item';
        div.innerHTML = `
          <div class="notif-title">${n.title}</div>
          <div class="notif-msg">${n.message}</div>
          <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">${new Date(n.timestamp).toLocaleDateString()}</div>
        `;
        list.appendChild(div);
      });
    }
  } catch (err) {
    console.error('Error loading notifications:', err);
  }
}

/* --------------------------------------------------------------------------
   UI Renderers & Card Component
   -------------------------------------------------------------------------- */

function renderEventTrack(container, events) {
  container.innerHTML = '';
  events.forEach(event => {
    const card = createEventCard(event);
    container.appendChild(card);
  });
}

function createEventCard(event, aiReason = null) {
  const card = document.createElement('div');
  card.className = 'event-card';

  const isBookmarked = AppState.bookmarkedEventIds.has(event.id);
  const isFree = event.price.toLowerCase() === 'free' || event.price_numeric === 0;

  const fallbackImg = '/static/images/dfa7a08a-4016-4409-aefa-a87b4000da9a-ECLearnix---Hero-Section-Banners.png';
  const imgUrl = event.image_url || fallbackImg;

  card.innerHTML = `
    <div class="event-img-wrapper">
      <img class="event-img" src="${imgUrl}" alt="${event.title}" loading="lazy" onerror="this.src='${fallbackImg}'" />
      <span class="ec-mode-badge ${event.mode.toLowerCase()}">${event.mode}</span>
      <div class="ec-wishlist-btn ${isBookmarked ? 'active' : ''}" data-id="${event.id}" title="Bookmark event">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isBookmarked ? '#ef4444' : 'none'}" stroke="${isBookmarked ? '#ef4444' : 'currentColor'}" stroke-width="2">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
    </div>
    <div class="card-body">
      <div class="ec-title-row">
        <h3 class="card-title" title="${event.title}">${event.title}</h3>
      </div>
      <div class="ec-meta-grid">
        <div class="ec-info-left">
          <span class="ec-icon" style="color: #ef4444;">📍</span>
          <span class="ec-text" title="${event.location}">${event.location}</span>
        </div>
        <div class="ec-info-right">
          <span class="ec-icon" style="color: #6b7280;">👁️</span>
          <span class="ec-text">${event.views_display || event.views_count}</span>
        </div>
        <div class="ec-info-left">
          <span class="ec-icon" style="color: #10b981;">📅</span>
          <span class="ec-text">${event.date}</span>
        </div>
        <div class="ec-info-right">
          <span class="ec-price-label ${isFree ? 'free' : 'paid'}">${event.price}</span>
        </div>
      </div>
      ${aiReason ? `
        <div class="ec-ai-reason-badge" title="${aiReason}">
          <span>🤖</span>
          <span>${aiReason}</span>
        </div>
      ` : ''}
    </div>
  `;

  // Bookmark Click
  const bmBtn = card.querySelector('.ec-wishlist-btn');
  bmBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await toggleBookmark(event.id, bmBtn);
  });

  // Card Open Details Click
  card.addEventListener('click', () => {
    openEventDetailModal(event.id);
  });

  return card;
}

/* --------------------------------------------------------------------------
   Interactive Event Details Modal
   -------------------------------------------------------------------------- */

async function openEventDetailModal(eventId) {
  try {
    const res = await fetch(`/api/events/${eventId}`);
    const data = await res.json();
    if (!data.success) return;

    const event = data.event;
    AppState.currentEventDetail = event;

    $('#modalEventTitle').textContent = event.title;
    $('#modalEventSubtitle').textContent = event.subtitle || `${event.category} in ${event.location}`;
    $('#modalEventImage').src = event.image_url || '/static/images/dfa7a08a-4016-4409-aefa-a87b4000da9a-ECLearnix---Hero-Section-Banners.png';
    $('#modalEventMode').textContent = event.mode;
    $('#modalEventDate').textContent = event.date;
    $('#modalEventVenue').textContent = event.venue || event.location;
    $('#modalEventPrice').textContent = event.price;
    $('#modalEventOrganizer').textContent = event.organizer || 'College Organizers';
    $('#modalEventCollege').textContent = event.college || 'Tamil Nadu University';
    $('#modalEventPrize').textContent = event.prize_pool || 'Prizes & Certificates';
    $('#modalEventEligibility').textContent = event.eligibility || 'Open to all students';
    $('#modalEventDesc').textContent = event.description;

    // Render Tags
    const tagsContainer = $('#modalEventTags');
    tagsContainer.innerHTML = '';
    const tags = JSON.parse(event.tags || '[]');
    tags.forEach(t => {
      const span = document.createElement('span');
      span.className = 'btn-pill-tag active';
      span.textContent = `#${t}`;
      tagsContainer.appendChild(span);
    });

    // Render Similar Events
    const similarTrack = $('#modalSimilarTrack');
    similarTrack.innerHTML = '';
    if (data.similar_events && data.similar_events.length > 0) {
      data.similar_events.forEach(item => {
        const smallCard = createEventCard(item.event, item.reason);
        similarTrack.appendChild(smallCard);
      });
      $('#modalSimilarSection').style.display = 'block';
    } else {
      $('#modalSimilarSection').style.display = 'none';
    }

    // Open Modal
    $('#eventDetailModal').classList.add('show');
  } catch (err) {
    console.error('Error opening event details:', err);
  }
}

async function toggleBookmark(eventId, buttonElement) {
  try {
    const res = await fetch('/api/bookmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, type: 'bookmark' })
    });
    const data = await res.json();
    if (data.success) {
      if (data.is_bookmarked) {
        AppState.bookmarkedEventIds.add(eventId);
        buttonElement.classList.add('active');
        buttonElement.querySelector('svg').setAttribute('fill', '#ef4444');
        buttonElement.querySelector('svg').setAttribute('stroke', '#ef4444');
      } else {
        AppState.bookmarkedEventIds.delete(eventId);
        buttonElement.classList.remove('active');
        buttonElement.querySelector('svg').setAttribute('fill', 'none');
        buttonElement.querySelector('svg').setAttribute('stroke', 'currentColor');
      }
      fetchUserProfile();
    }
  } catch (err) {
    console.error('Failed to toggle bookmark:', err);
  }
}

/* --------------------------------------------------------------------------
   Event Listeners & Interaction Handlers
   -------------------------------------------------------------------------- */

function setupEventListeners() {
  // Live Search with Debounce
  let searchDebounce;
  const searchInput = $('#globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        AppState.searchQuery = e.target.value.trim();
        loadUpcomingEvents();
      }, 250);
    });
  }

  // Category Pill Filters
  $$('.filter-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeCategory = btn.dataset.category;
      loadUpcomingEvents();
    });
  });

  // Dropdown Filters (Mode, Location, Price)
  const modeSelect = $('#modeSelect');
  if (modeSelect) {
    modeSelect.addEventListener('change', (e) => {
      AppState.activeMode = e.target.value;
      loadUpcomingEvents();
    });
  }

  const locationSelect = $('#locationSelect');
  if (locationSelect) {
    locationSelect.addEventListener('change', (e) => {
      AppState.activeLocation = e.target.value;
      loadUpcomingEvents();
    });
  }

  const priceSelect = $('#priceSelect');
  if (priceSelect) {
    priceSelect.addEventListener('change', (e) => {
      AppState.activePrice = e.target.value;
      loadUpcomingEvents();
    });
  }

  // Slider Navigation Buttons
  setupSliderNav('featuredTrack', 'featuredPrevBtn', 'featuredNextBtn');
  setupSliderNav('trendingTrack', 'trendingPrevBtn', 'trendingNextBtn');
  setupSliderNav('virtualTrack', 'virtualPrevBtn', 'virtualNextBtn');

  // Notifications Toggle
  const notifBtn = $('#notifBtn');
  const notifPanel = $('#notifPanel');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle('show');
    });
    document.addEventListener('click', () => notifPanel.classList.remove('show'));
  }

  // Profile Modal Toggle
  const profileBtn = $('#profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      $('#profileModal').classList.add('show');
    });
  }

  // Benchmark Drawer Toggle
  const benchmarkTrigger = $('#algoBenchmarkTrigger');
  if (benchmarkTrigger) {
    benchmarkTrigger.addEventListener('click', () => {
      $('#benchmarkDrawer').classList.add('show');
      runLiveBenchmark();
    });
  }

  // Registration Form in Detail Modal
  const regForm = $('#eventRegForm');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!AppState.currentEventDetail) return;

      const name = $('#regName').value;
      const email = $('#regEmail').value;
      const team = $('#regTeam').value;

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: AppState.currentEventDetail.id,
            name, email, team_name: team
          })
        });
        const data = await res.json();
        if (data.success) {
          alert('🎉 Registration Confirmed! Check your inbox for pass details.');
          $('#eventDetailModal').classList.remove('show');
          fetchUserProfile();
        } else {
          alert(`Notice: ${data.error || 'Could not register'}`);
        }
      } catch (err) {
        alert('Failed to complete registration.');
      }
    });
  }

  // Modal Close Buttons
  $$('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.modal-backdrop').forEach(m => m.classList.remove('show'));
    });
  });

  // Close modals when clicking backdrop
  $$('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('show');
      }
    });
  });
}

function setupSliderNav(trackId, prevBtnId, nextBtnId) {
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);

  if (track && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -320, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: 320, behavior: 'smooth' });
    });
  }
}

function resetAllFilters() {
  AppState.activeCategory = 'all';
  AppState.activeMode = 'all';
  AppState.activeLocation = 'all';
  AppState.activePrice = 'all';
  AppState.searchQuery = '';

  const searchInput = $('#globalSearchInput');
  if (searchInput) searchInput.value = '';

  $$('.filter-pill-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.category === 'all');
  });

  if ($('#modeSelect')) $('#modeSelect').value = 'all';
  if ($('#locationSelect')) $('#locationSelect').value = 'all';
  if ($('#priceSelect')) $('#priceSelect').value = 'all';

  loadUpcomingEvents();
}

/* --------------------------------------------------------------------------
   Live A/B Algorithm Benchmarking Runner
   -------------------------------------------------------------------------- */

async function runLiveBenchmark() {
  const query = $('#benchmarkQueryInput') ? $('#benchmarkQueryInput').value : 'ai hackathon coimbatore';
  const statusContainer = $('#benchmarkResultsArea');
  statusContainer.innerHTML = '<div style="padding: 20px; text-align: center;">Running benchmark simulation across Default vs AI models...</div>';

  try {
    const res = await fetch('/api/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 4 })
    });
    const data = await res.json();
    if (data.success) {
      const def = data.default_engine;
      const ai = data.ai_engine;

      statusContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px;">
          <!-- Default Engine Card -->
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <h4 style="color: #0d6efd;">⚙️ Default Search Engine</h4>
              <span class="btn-pill-tag">${def.latency_ms} ms</span>
            </div>
            <p style="font-size: 13px; margin-bottom: 12px;"><strong>Strategy:</strong> ${def.strategy}</p>
            <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">Top Results (${def.total_count} total):</div>
            <ul style="padding-left: 18px; font-size: 13px; line-height: 1.6;">
              ${def.top_results.map(r => `<li><strong>${r.event.title}</strong> (Score: ${r.score})</li>`).join('')}
            </ul>
          </div>

          <!-- AI Semantic Hybrid Engine Card -->
          <div style="background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 16px; padding: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <h4 style="color: #7f00ff;">⚡ AI Semantic Hybrid</h4>
              <span class="btn-pill-tag" style="background: #ede9fe; color: #7f00ff;">${ai.latency_ms} ms</span>
            </div>
            <p style="font-size: 13px; margin-bottom: 8px;"><strong>Strategy:</strong> ${ai.strategy}</p>
            <p style="font-size: 12px; color: #6d28d9; margin-bottom: 12px;">
              <strong>Detected Intent:</strong> ${ai.diagnostics?.detected_intent?.intents?.join(', ') || 'General'} | 
              <strong>Location:</strong> ${ai.diagnostics?.detected_intent?.location || 'Any'}
            </p>
            <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">Top Results (${ai.total_count} total):</div>
            <ul style="padding-left: 18px; font-size: 13px; line-height: 1.6;">
              ${ai.top_results.map(r => `<li><strong>${r.event.title}</strong> (${r.explanation || 'Semantic Match'})</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }
  } catch (err) {
    statusContainer.innerHTML = '<div style="color: #ef4444; padding: 20px;">Failed to execute benchmark query.</div>';
  }
}
