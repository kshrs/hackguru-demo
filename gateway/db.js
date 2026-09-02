/**
 * Database Module for Node.js API Gateway (SQLite with ACID Transactions)
 */

const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

function initDbConnection(customPath) {
  const dbPath = customPath || path.join(__dirname, "..", "data", "hackguru.db");
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode and foreign keys for high-performance concurrent writes
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  return db;
}

class GatewayDb {
  constructor(db) {
    this.db = db || initDbConnection();
    this._prepareStatements();
  }

  _prepareStatements() {
    this.stmtGetInteractions = this.db.prepare(`
      SELECT event_id, interaction_type, weight 
      FROM user_interactions 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    this.stmtGetFallbackInteractions = this.db.prepare(`
      SELECT event_id, interaction_type, weight 
      FROM user_interactions 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    this.stmtGetRegistrations = this.db.prepare(`
      SELECT event_id FROM registrations WHERE user_id = ?
    `);

    this.stmtInsertInteraction = this.db.prepare(`
      INSERT INTO user_interactions (user_id, event_id, interaction_type, weight)
      VALUES (?, ?, ?, ?)
    `);

    this.stmtInsertBookmark = this.db.prepare(`
      INSERT OR IGNORE INTO bookmarks (user_id, event_id)
      VALUES (?, ?)
    `);

    this.stmtInsertRegistration = this.db.prepare(`
      INSERT INTO registrations (user_id, user_name, user_email, event_id, team_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    this.stmtIncrementRegCount = this.db.prepare(`
      UPDATE events SET registrations_count = registrations_count + 1 WHERE id = ?
    `);

    this.stmtIncrementViewCount = this.db.prepare(`
      UPDATE events SET views_count = views_count + 1 WHERE id = ?
    `);
  }

  recordBookmark(userId, eventId) {
    // Transaction for ACID consistency
    this.db.exec("BEGIN TRANSACTION;");
    try {
      this.stmtInsertBookmark.run(userId, Number(eventId));
      this.stmtInsertInteraction.run(userId, Number(eventId), "bookmark", 3.0);
      this.db.exec("COMMIT;");
      return { success: true, interaction_type: "bookmark", event_id: Number(eventId) };
    } catch (err) {
      this.db.exec("ROLLBACK;");
      throw err;
    }
  }

  recordRegistration(userId, eventId, metadata = {}) {
    const name = metadata.name || "Student User";
    const email = metadata.email || `${userId}@allcollegeevent.com`;
    const teamName = metadata.team_name || "";

    this.db.exec("BEGIN TRANSACTION;");
    try {
      this.stmtInsertRegistration.run(userId, name, email, Number(eventId), teamName);
      this.stmtIncrementRegCount.run(Number(eventId));
      this.stmtInsertInteraction.run(userId, Number(eventId), "register", 5.0);
      this.db.exec("COMMIT;");
      return { success: true, interaction_type: "register", event_id: Number(eventId) };
    } catch (err) {
      this.db.exec("ROLLBACK;");
      if (err.message && err.message.includes("UNIQUE constraint failed")) {
        return { success: true, interaction_type: "register", event_id: Number(eventId), already_registered: true };
      }
      throw err;
    }
  }

  recordView(userId, eventId) {
    try {
      this.stmtIncrementViewCount.run(Number(eventId));
      this.stmtInsertInteraction.run(userId, Number(eventId), "view", 1.0);
      return { success: true, interaction_type: "view", event_id: Number(eventId) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getUserInteractions(userId, limit = 20) {
    try {
      const rows = this.stmtGetInteractions.all(userId, limit);
      if (rows && rows.length > 0) return rows;
      return this.stmtGetFallbackInteractions.all(limit) || [];
    } catch {
      return [];
    }
  }

  getRegisteredIds(userId) {
    try {
      const rows = this.stmtGetRegistrations.all(userId);
      return rows.map((r) => Number(r.event_id));
    } catch {
      return [];
    }
  }
}

module.exports = {
  initDbConnection,
  GatewayDb
};
