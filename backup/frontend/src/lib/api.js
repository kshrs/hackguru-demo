const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchSmartSearch(query, params = {}) {
  try {
    const url = new URL(`${API_BASE}/smart-search`);
    if (query) url.searchParams.set('q', query);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== 'All') {
        url.searchParams.set(k, v);
      }
    }
    const res = await fetch(url.toString(), { cache: 'no-store' });
    return await res.json();
  } catch (err) {
    console.error('[API fetchSmartSearch Error]', err);
    return { success: false, results: [], total_count: 0, latency_ms: 0 };
  }
}

export async function fetchEvents(params = {}) {
  try {
    const url = new URL(`${API_BASE}/events`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== 'All') {
        url.searchParams.set(k, v);
      }
    }
    const res = await fetch(url.toString(), { cache: 'no-store' });
    return await res.json();
  } catch (err) {
    console.error('[API fetchEvents Error]', err);
    return { success: false, results: [], total_count: 0 };
  }
}

export async function fetchEventById(id) {
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, { cache: 'no-store' });
    return await res.json();
  } catch (err) {
    console.error('[API fetchEventById Error]', err);
    return { success: false, event: null, similar_events: [] };
  }
}

export async function fetchUserProfile(userId = 'usr_kishor') {
  try {
    const res = await fetch(`${API_BASE}/users/profile?user_id=${userId}`, { cache: 'no-store' });
    return await res.json();
  } catch (err) {
    console.error('[API fetchUserProfile Error]', err);
    return { success: false, user: null, registered_events: [], bookmarked_events: [] };
  }
}

export async function fetchRecommendations(userId = 'usr_kishor', limit = 8) {
  try {
    const res = await fetch(`${API_BASE}/recommendations?user_id=${userId}&limit=${limit}`, { cache: 'no-store' });
    return await res.json();
  } catch (err) {
    console.error('[API fetchRecommendations Error]', err);
    return { success: false, recommendations: [] };
  }
}

export async function toggleBookmark(eventId, userId = 'usr_kishor', type = 'bookmark') {
  try {
    const res = await fetch(`${API_BASE}/users/bookmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, user_id: userId, type })
    });
    return await res.json();
  } catch (err) {
    console.error('[API toggleBookmark Error]', err);
    return { success: false };
  }
}

export async function registerForEvent(payload) {
  try {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('[API registerForEvent Error]', err);
    return { success: false };
  }
}

export async function fetchNotifications() {
  try {
    const res = await fetch(`${API_BASE}/notifications`, { cache: 'no-store' });
    return await res.json();
  } catch (err) {
    console.error('[API fetchNotifications Error]', err);
    return { success: false, notifications: [] };
  }
}

export async function fetchAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/analytics`, { cache: 'no-store' });
    return await res.json();
  } catch (err) {
    console.error('[API fetchAnalytics Error]', err);
    return { success: false };
  }
}
