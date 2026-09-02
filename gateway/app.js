/**
 * Express Application for Node.js API Gateway (Track 2.1)
 * Acts as the Bouncer between Frontend and Python FastAPI AI engine.
 */

const express = require("express");
const { GatewayDb } = require("./db");
const { SessionCache } = require("./redis");

function createApp(options = {}) {
  const app = express();
  app.use(express.json());

  // CORS middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  const gatewayDb = options.db ? new GatewayDb(options.db) : new GatewayDb();
  const sessionCache = options.sessionCache || new SessionCache();
  const pythonAiUrl = options.pythonAiUrl || process.env.PYTHON_AI_URL || "http://127.0.0.1:8000/api/recommendations";

  // 1. Health Check
  app.get("/api/v1/health", (req, res) => {
    res.json({
      status: "ok",
      gateway: "hackguru-node-gateway",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // 2. Interaction Logging Endpoint
  app.post("/api/v1/interactions", async (req, res) => {
    try {
      const { user_id, event_id, interaction_type, dwell_time_seconds, metadata } = req.body || {};

      if (!event_id || !interaction_type) {
        return res.status(400).json({ success: false, error: "Missing required fields: event_id, interaction_type" });
      }

      const uid = user_id || "usr_kishor";
      const eid = Number(event_id);
      const itype = String(interaction_type).toLowerCase();

      if (itype === "bookmark") {
        const result = gatewayDb.recordBookmark(uid, eid);
        return res.json({ success: true, message: "Bookmark saved", ...result });
      }

      if (itype === "register") {
        const result = gatewayDb.recordRegistration(uid, eid, metadata || {});
        return res.json({ success: true, message: "Registration recorded", ...result });
      }

      if (itype === "view") {
        // Non-blocking database increment
        gatewayDb.recordView(uid, eid);
        // Write to Redis rolling window
        const session = await sessionCache.recordView(uid, eid, dwell_time_seconds || 0);
        return res.json({
          success: true,
          interaction_type: "view",
          event_id: eid,
          session_clicks_count: session?.session_event_ids?.length || 1
        });
      }

      return res.status(400).json({ success: false, error: `Unsupported interaction_type: ${itype}` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. AI Proxy Recommendations Endpoint
  app.get("/api/v1/recommendations", async (req, res) => {
    const startTime = Date.now();
    try {
      const userId = req.query.user_id || "usr_kishor";
      const limit = Number(req.query.limit) || 8;
      const city = req.query.city || null;
      const college = req.query.college || null;

      // 1. Fetch DB historical interactions & registered IDs
      const userInteractions = gatewayDb.getUserInteractions(userId, 20);
      const registeredIds = gatewayDb.getRegisteredIds(userId);

      // 2. Fetch transient session clicks from Redis
      const sessionData = await sessionCache.getSession(userId);
      const sessionEventIds = sessionData.session_event_ids || [];

      // 3. Forward to Python AI Recommender Engine via HTTP POST
      const aiPayload = {
        user_id: userId,
        limit,
        city,
        college,
        session_event_ids: sessionEventIds,
        session_ids: sessionEventIds,
        user_interactions: userInteractions,
        registered_ids: registeredIds
      };

      try {
        const aiResponse = await fetch(pythonAiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiPayload)
        });

        if (aiResponse.ok) {
          const aiJson = await aiResponse.json();
          const gatewayLatency = Date.now() - startTime;
          return res.json({
            ...aiJson,
            gateway_latency_ms: gatewayLatency
          });
        }
      } catch (aiErr) {
        // AI Server unreachable fallback
      }

      // Fallback if Python engine is temporarily unreachable
      return res.json({
        success: true,
        algorithm: "gateway_fallback_feed",
        gateway_latency_ms: Date.now() - startTime,
        warning: "AI Engine offline, serving cached catalog feed",
        recommendations: []
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return app;
}

module.exports = {
  createApp
};
