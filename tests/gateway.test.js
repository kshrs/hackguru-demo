/**
 * TDD Test Suite for Node.js API Gateway (Track 2.1)
 * Tests:
 * 1. Health endpoint
 * 2. POST /api/v1/interactions (view, bookmark, register)
 * 3. Redis session cache rolling window (last 3-5 clicks)
 * 4. GET /api/v1/recommendations (DB + Redis aggregation & AI proxy)
 */

const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const http = require("node:http");

// Import gateway app & modules
const { createApp } = require("../gateway/app");
const { SessionCache } = require("../gateway/redis");
const { initDbConnection } = require("../gateway/db");

test.describe("Node.js API Gateway Test Suite", () => {
  let server;
  let baseUrl;
  let db;
  let sessionCache;
  let mockPythonServer;
  let pythonPort;

  test.before(async () => {
    // 1. Setup mock Python AI server on random port
    mockPythonServer = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            algorithm: "hybrid_semantic_feed",
            latency_ms: 3.2,
            strategy: "Two-Stage Candidate Projection + Session Vector Blending + 15% Epsilon Exploration",
            recommendations: [
              {
                event: { id: 1, title: "AI Hackathon", category: "Hackathon" },
                score: 0.92,
                badge: "Matches your interest in Hackathon",
                is_exploration: false
              },
              {
                event: { id: 4, title: "GreenTech Conference", category: "Conference" },
                score: 0.75,
                badge: "Explore Something New: Popular in Conference",
                is_exploration: true
              }
            ]
          })
        );
      });
    });

    await new Promise((resolve) => {
      mockPythonServer.listen(0, () => {
        pythonPort = mockPythonServer.address().port;
        resolve();
      });
    });

    // 2. Initialize DB & Session Cache
    const dbPath = path.join(__dirname, "..", "data", "hackguru.db");
    db = initDbConnection(dbPath);
    sessionCache = new SessionCache({ inMemoryOnly: true });

    // 3. Create Gateway App
    const app = createApp({
      db,
      sessionCache,
      pythonAiUrl: `http://127.0.0.1:${pythonPort}/api/recommendations`
    });

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  test.after(async () => {
    if (server) server.close();
    if (mockPythonServer) mockPythonServer.close();
  });

  test("GET /api/v1/health returns 200 OK", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
    assert.strictEqual(data.gateway, "hackguru-node-gateway");
  });

  test("POST /api/v1/interactions records bookmark with weight 3.0", async () => {
    const payload = {
      user_id: "usr_test_node",
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

    // Verify in DB
    const row = db.prepare(
      "SELECT * FROM user_interactions WHERE user_id = ? AND event_id = ? AND interaction_type = 'bookmark'"
    ).get("usr_test_node", 1);
    assert.ok(row);
    assert.strictEqual(row.weight, 3.0);
  });

  test("POST /api/v1/interactions records registration with weight 5.0", async () => {
    const payload = {
      user_id: "usr_test_node_reg",
      event_id: 2,
      interaction_type: "register",
      metadata: {
        name: "Test User",
        email: "test@hackguru.com",
        team_name: "ByteWarriors"
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

    // Verify in DB
    const row = db.prepare(
      "SELECT * FROM registrations WHERE user_id = ? AND event_id = ?"
    ).get("usr_test_node_reg", 2);
    assert.ok(row);
  });

  test("POST /api/v1/interactions records view and updates rolling session cache", async () => {
    const userId = "usr_test_session";

    // First view
    await fetch(`${baseUrl}/api/v1/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        event_id: 10,
        interaction_type: "view",
        dwell_time_seconds: 15
      })
    });

    // Second view
    await fetch(`${baseUrl}/api/v1/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        event_id: 12,
        interaction_type: "view",
        dwell_time_seconds: 45
      })
    });

    // Check session cache
    const session = await sessionCache.getSession(userId);
    assert.deepStrictEqual(session.session_event_ids, [10, 12]);
    assert.strictEqual(session.dwell_times["10"], 15);
    assert.strictEqual(session.dwell_times["12"], 45);
  });

  test("GET /api/v1/recommendations aggregates DB + Session and proxies to Python AI", async () => {
    const userId = "usr_test_proxy";

    // Setup session click
    await sessionCache.recordView(userId, 3, 50);

    const res = await fetch(`${baseUrl}/api/v1/recommendations?user_id=${userId}&limit=4&city=Coimbatore`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.algorithm, "hybrid_semantic_feed");
    assert.strictEqual(data.recommendations.length, 2);
  });
});
