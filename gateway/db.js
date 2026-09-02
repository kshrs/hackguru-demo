/**
 * Database Module for Node.js API Gateway (PostgreSQL with Connection Pooling)
 * Fully replaces SQLite to comply with HackGURU 2026 rubric.
 * Uses `pg.Pool` with parameterized queries and ACID transactions.
 */

const { Pool } = require("pg");

function createPgPool(options = {}) {
  const connectionString = options.connectionString || process.env.DATABASE_URL;

  const poolConfig = connectionString
    ? { connectionString }
    : {
        user: options.user || process.env.PGUSER || "postgres",
        host: options.host || process.env.PGHOST || "127.0.0.1",
        database: options.database || process.env.PGDATABASE || "hackguru",
        password: options.password || process.env.PGPASSWORD || "postgres",
        port: Number(options.port || process.env.PGPORT || 5432),
        max: Number(options.max || process.env.PGMAX || 20), // pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000
      };

  const pool = new Pool(poolConfig);

  // Catch idle client errors
  pool.on("error", (err) => {
    console.error("[PostgreSQL Pool Error]", err.message);
  });

  return pool;
}

class GatewayDb {
  constructor(poolOrConfig) {
    if (poolOrConfig && typeof poolOrConfig.query === "function") {
      this.pool = poolOrConfig;
    } else {
      this.pool = createPgPool(poolOrConfig);
    }
  }

  /**
   * Initializes required schema tables if they do not exist
   */
  async initSchema() {
    const ddl = `
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT,
        mode TEXT,
        location TEXT,
        date TEXT,
        price TEXT,
        views_count INTEGER DEFAULT 0,
        registrations_count INTEGER DEFAULT 0,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS user_interactions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_id INTEGER NOT NULL,
        interaction_type TEXT NOT NULL,
        weight NUMERIC NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        user_id TEXT NOT NULL,
        event_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, event_id)
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT,
        user_email TEXT,
        event_id INTEGER NOT NULL,
        team_name TEXT,
        registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, event_id)
      );

      CREATE INDEX IF NOT EXISTS idx_interactions_user_time ON user_interactions(user_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
    `;
    return this.pool.query(ddl);
  }

  /**
   * Records bookmark with ACID transaction (weight = 3.0)
   */
  async recordBookmark(userId, eventId) {
    const client = await this.pool.connect();
    const eid = Number(eventId);
    try {
      await client.query("BEGIN;");
      await client.query(
        "INSERT INTO bookmarks (user_id, event_id) VALUES ($1, $2) ON CONFLICT (user_id, event_id) DO NOTHING;",
        [userId, eid]
      );
      await client.query(
        "INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES ($1, $2, $3, $4);",
        [userId, eid, "bookmark", 3.0]
      );
      await client.query("COMMIT;");
      return { success: true, interaction_type: "bookmark", event_id: eid };
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Records registration with ACID transaction (weight = 5.0)
   */
  async recordRegistration(userId, eventId, metadata = {}) {
    const client = await this.pool.connect();
    const eid = Number(eventId);
    const name = metadata.name || "Student User";
    const email = metadata.email || `${userId}@allcollegeevent.com`;
    const teamName = metadata.team_name || "";

    try {
      await client.query("BEGIN;");
      
      const insertReg = await client.query(
        "INSERT INTO registrations (user_id, user_name, user_email, event_id, team_name) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, event_id) DO NOTHING RETURNING id;",
        [userId, name, email, eid, teamName]
      );

      // Only increment and log if it was a new registration
      const isNew = insertReg.rowCount > 0;
      if (isNew) {
        await client.query(
          "UPDATE events SET registrations_count = registrations_count + 1 WHERE id = $1;",
          [eid]
        );
      }

      await client.query(
        "INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES ($1, $2, $3, $4);",
        [userId, eid, "register", 5.0]
      );

      await client.query("COMMIT;");
      return {
        success: true,
        interaction_type: "register",
        event_id: eid,
        already_registered: !isNew
      };
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Records view and increments event counter (weight = 1.0)
   */
  async recordView(userId, eventId) {
    const eid = Number(eventId);
    try {
      await this.pool.query(
        "UPDATE events SET views_count = views_count + 1 WHERE id = $1;",
        [eid]
      );
      await this.pool.query(
        "INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES ($1, $2, $3, $4);",
        [userId, eid, "view", 1.0]
      );
      return { success: true, interaction_type: "view", event_id: eid };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches user's interaction history
   */
  async getUserInteractions(userId, limit = 20) {
    try {
      const res = await this.pool.query(
        `SELECT event_id, interaction_type, CAST(weight AS FLOAT) as weight 
         FROM user_interactions 
         WHERE user_id = $1 
         ORDER BY timestamp DESC 
         LIMIT $2;`,
        [userId, limit]
      );
      if (res.rows && res.rows.length > 0) return res.rows;

      // Fallback to recent system interactions
      const fallback = await this.pool.query(
        `SELECT event_id, interaction_type, CAST(weight AS FLOAT) as weight 
         FROM user_interactions 
         ORDER BY timestamp DESC 
         LIMIT $1;`,
        [limit]
      );
      return fallback.rows || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetches list of registered event IDs for a user
   */
  async getRegisteredIds(userId) {
    try {
      const res = await this.pool.query(
        "SELECT event_id FROM registrations WHERE user_id = $1;",
        [userId]
      );
      return (res.rows || []).map((r) => Number(r.event_id));
    } catch {
      return [];
    }
  }

  /**
   * Closes the PostgreSQL pool
   */
  async close() {
    return this.pool.end();
  }
}

module.exports = {
  createPgPool,
  GatewayDb
};
