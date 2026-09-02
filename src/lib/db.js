const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'data', 'hackguru.db');

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
  }
  return dbInstance;
}

function normalizeEvent(r) {
  if (!r) return r;
  const event = { ...r };
  if (event.image_url) {
    if (event.image_url.startsWith('/static/')) {
      event.image_url = event.image_url.replace('/static/', '/');
    } else if (!event.image_url.startsWith('/') && !event.image_url.startsWith('http') && !event.image_url.startsWith('data:')) {
      event.image_url = `/ace_files/${event.image_url}`;
    }
  } else {
    event.image_url = '/ace_files/dfa7a08a-4016-4409-aefa-a87b4000da9a-ECLearnix---Hero-Section-Banners.png';
  }
  return event;
}

function getAllEvents() {
  const db = getDb();
  const query = db.prepare('SELECT * FROM events ORDER BY is_featured DESC, views_count DESC');
  return query.all().map(normalizeEvent);
}

function getEventById(id) {
  const db = getDb();
  const query = db.prepare('SELECT * FROM events WHERE id = ?');
  return normalizeEvent(query.get(Number(id)));
}

function getBookmarks(userId = 'usr_kishor') {
  const db = getDb();
  const query = db.prepare(`
    SELECT e.* FROM events e
    JOIN bookmarks b ON e.id = b.event_id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `);
  return query.all(userId).map(normalizeEvent);
}

function toggleBookmark(userId, eventId) {
  const db = getDb();
  const check = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND event_id = ?');
  const existing = check.get(userId, eventId);

  if (existing) {
    db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND event_id = ?').run(userId, eventId);
    return false;
  } else {
    db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, event_id) VALUES (?, ?)').run(userId, eventId);
    db.prepare("INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES (?, ?, 'bookmark', 3.0)").run(userId, eventId);
    return true;
  }
}

function registerEvent(userId, eventId, userName, userEmail, teamName) {
  const db = getDb();
  db.prepare(`
    INSERT INTO registrations (user_id, user_name, user_email, event_id, team_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, userName, userEmail, eventId, teamName);

  db.prepare("INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES (?, ?, 'register', 5.0)").run(userId, eventId);
  db.prepare('UPDATE events SET registrations_count = registrations_count + 1 WHERE id = ?').run(eventId);
  return true;
}

module.exports = {
  getDb,
  getAllEvents,
  getEventById,
  getBookmarks,
  toggleBookmark,
  registerEvent
};
