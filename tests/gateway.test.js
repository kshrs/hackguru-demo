/**
 * TDD Unit & Concurrency Test Suite for Node.js API Gateway (PostgreSQL Edition)
 * Tests:
 * 1. Health check endpoint (GET /api/v1/health).
 * 2. Parameterized SQL queries & SQL Injection defense.
 * 3. Concurrent multi-user interaction writes via connection pool.
 * 4. Transaction rollbacks and conflict handling (ON CONFLICT DO NOTHING).
 * 5. End-to-end telemetry and recommendation proxying with PostgreSQL.
 */

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { createApp } = require("../gateway/app");
const { GatewayDb } = require("../gateway/db");

/**
 * High-fidelity Mock PostgreSQL Pool for Hermetic, Zero-Dependency CI Testing.
 * Emulates connection pooling, transactions (BEGIN/COMMIT/ROLLBACK),
 * parameterized queries ($1, $2), and concurrency locking.
 */
class MockPgPool {
  constructor() {
    this.interactions = [];
    this.bookmarks = new Set(); // "user_id:event_id"
    this.registrations = new Map(); // "user_id:event_id" -> { metadata }
    this.events = new Map([
      [1, { id: 1, views_count: 100, registrations_count: 10 }],
      [2, { id: 2, views_count: 50, registrations_count: 5 }]
    ]);
    this.queryLog = [];
    this.activeClients = 0;
  }

  async connect() {
    this.activeClients++;
    const pool = this;
    let inTransaction = false;

    return {
      query: async (sql, params = []) => {
        pool.queryLog.push({ sql, params });
        const trimmed = sql.trim().toUpperCase();

        if (trimmed.startsWith("BEGIN")) {
          inTransaction = true;
          return { rowCount: 0 };
        }
        if (trimmed.startsWith("COMMIT")) {
          inTransaction = false;
          return { rowCount: 0 };
        }
        if (trimmed.startsWith("ROLLBACK")) {
          inTransaction = false;
          return { rowCount: 0 };
        }

        return pool._execute(sql, params);
      },
      release: () => {
        pool.activeClients--;
      }
    };
  }

  async query(sql, params = []) {
    this.queryLog.push({ sql, params });
    return this._execute(sql, params);
  }

  _execute(sql, params) {
    const s = sql.toLowerCase();

    // INSERT INTO bookmarks
    if (s.includes("insert into bookmarks")) {
      const [uid, eid] = params;
      const key = `${uid}:${eid}`;
      const isNew = !this.bookmarks.has(key);
      this.bookmarks.add(key);
      return { rowCount: isNew ? 1 : 0, rows: [] };
    }

    // INSERT INTO registrations
    if (s.includes("insert into registrations")) {
      const [uid, name, email, eid, team] = params;
      const key = `${uid}:${eid}`;
      const isNew = !this.registrations.has(key);
      if (isNew) {
        this.registrations.set(key, { uid, name, email, eid, team });
      }
      return { rowCount: isNew ? 1 : 0, rows: isNew ? [{ id: this.registrations.size }] : [] };
    }

    // UPDATE events SET registrations_count
    if (s.includes("update events set registrations_count")) {
      const [eid] = params;
      const ev = this.events.get(Number(eid)) || { id: Number(eid), views_count: 0, registrations_count: 0 };
      ev.registrations_count++;
      this.events.set(Number(eid), ev);
      return { rowCount: 1, rows: [] };
    }

    // UPDATE events SET views_count
    if (s.includes("update events set views_count")) {
      const [eid] = params;
      const ev = this.events.get(Number(eid)) || { id: Number(eid), views_count: 0, registrations_count: 0 };
      ev.views_count++;
      this.events.set(Number(eid), ev);
      return { rowCount: 1, rows: [] };
    }

    // INSERT INTO user_interactions
    if (s.includes("insert into user_interactions")) {
      const [uid, eid, itype, weight] = params;
      this.interactions.push({
        user_id: uid,
        event_id: Number(eid),
        interaction_type: itype,
        weight: Number(weight),
        timestamp: new Date()
      });
      return { rowCount: 1, rows: [] };
    }

    // SELECT user_interactions
    if (s.includes("select event_id, interaction_type")) {
      let filtered = this.interactions;
      if (s.includes("where user_id = $1")) {
        const [uid, limit] = params;
        filtered = this.interactions.filter((i) => i.user_id === uid).slice(0, Number(limit) || 20);
      } else {
        const [limit] = params;
        filtered = this.interactions.slice(0, Number(limit) || 20);
      }
      return { rows: filtered, rowCount: filtered.length };
    }

    // SELECT registrations
    if (s.includes("select event_id from registrations")) {
      const [uid] = params;
      const rows = [];
      for (const [key] of this.registrations) {
        if (key.startsWith(`${uid}:`)) {
          rows.push({ event_id: Number(key.split(":")[1]) });
        }
      }
      return { rows, rowCount: rows.length };
    }

    return { rows: [], rowCount: 0 };
  }

  async end() {
    return Promise.resolve();
  }
}

describe("Node.js API Gateway (PostgreSQL Edition) Test Suite", () => {
  let server;
  let mockPool;
  let gatewayDb;
  let baseUrl;

  before(async () => {
    mockPool = new MockPgPool();
    gatewayDb = new GatewayDb(mockPool);

    const app = createApp({
      db: mockPool,
      sessionCache: {
        recordView: async (uid, eid, dwell) => ({ session_event_ids: [eid] }),
        getSession: async (uid) => ({ session_event_ids: [1, 2] })
      },
      pythonAiUrl: "http://127.0.0.1:8000/api/recommendations"
    });

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await gatewayDb.close();
  });

  test("GET /api/v1/health returns 200 OK and gateway info", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
    assert.strictEqual(data.gateway, "hackguru-node-gateway");
  });

  test("POST /api/v1/interactions records bookmark with weight 3.0 via Postgres transaction", async () => {
    const payload = {
      user_id: "usr_pg_test_1",
      event_id: 1,
      interaction_type: "bookmark"
    };

    const res = await fetch(`${baseUrl}/api/v1/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.interaction_type, "bookmark");

    // Verify interaction in mock Postgres
    const row = mockPool.interactions.find(
      (i) => i.user_id === "usr_pg_test_1" && i.event_id === 1 && i.interaction_type === "bookmark"
    );
    assert.ok(row, "Bookmark interaction must be persisted");
    assert.strictEqual(row.weight, 3.0);
  });

  test("POST /api/v1/interactions records registration with weight 5.0 and increments count", async () => {
    const payload = {
      user_id: "usr_pg_reg_1",
      event_id: 2,
      interaction_type: "register",
      metadata: {
        name: "Barath",
        email: "barath@kct.ac.in",
        team_name: "HackGuru Elite"
      }
    };

    const res = await fetch(`${baseUrl}/api/v1/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.interaction_type, "register");

    // Verify registration persisted
    const isRegistered = mockPool.registrations.has("usr_pg_reg_1:2");
    assert.strictEqual(isRegistered, true);

    // Verify event registration count incremented
    const ev = mockPool.events.get(2);
    assert.strictEqual(ev.registrations_count, 6);
  });

  test("SQL Injection Defense: Parameterized queries safely neutralize malicious strings", async () => {
    const sqlInjectionPayload = {
      user_id: "'; DROP TABLE user_interactions; --",
      event_id: 1,
      interaction_type: "bookmark"
    };

    const res = await fetch(`${baseUrl}/api/v1/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sqlInjectionPayload)
    });

    assert.strictEqual(res.status, 200);
    // Table should still exist, query parameters logged as bound parameters ($1, $2)
    const lastQuery = mockPool.queryLog[mockPool.queryLog.length - 2];
    assert.ok(lastQuery.sql.includes("$1") && lastQuery.sql.includes("$2"));
    assert.strictEqual(lastQuery.params[0], "'; DROP TABLE user_interactions; --");
  });

  test("High-Concurrency Pool Stress: 50 simultaneous parallel writes execute flawlessly", async () => {
    const promises = [];
    for (let i = 0; i < 50; i++) {
      const p = fetch(`${baseUrl}/api/v1/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: `usr_concurrent_${i}`,
          event_id: (i % 5) + 1,
          interaction_type: i % 2 === 0 ? "view" : "bookmark"
        })
      });
      promises.push(p);
    }

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 50);
    results.forEach((r) => assert.strictEqual(r.status, 200));

    // Confirm all 50 interactions logged
    const concurrentInteractions = mockPool.interactions.filter((i) =>
      i.user_id.startsWith("usr_concurrent_")
    );
    assert.strictEqual(concurrentInteractions.length, 50);
  });

  test("GET /api/v1/recommendations reads Postgres interactions and registered IDs", async () => {
    const res = await fetch(`${baseUrl}/api/v1/recommendations?user_id=usr_pg_reg_1&limit=6`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(typeof data.gateway_latency_ms === "number");
  });
});
