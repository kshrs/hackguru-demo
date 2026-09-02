/**
 * Redis Session Cache Module for Node.js API Gateway
 * Manages transient session clicks and dwell times with rolling window of last 3-5 clicks.
 */

class SessionCache {
  constructor(options = {}) {
    this.inMemoryOnly = options.inMemoryOnly || false;
    this.ttlSeconds = options.ttlSeconds || 3600;
    this.maxWindowSize = options.maxWindowSize || 5;
    this.memoryStore = new Map();
    this.redisClient = null;

    if (!this.inMemoryOnly) {
      try {
        const Redis = require("ioredis");
        this.redisClient = new Redis({
          host: options.host || "127.0.0.1",
          port: options.port || 6379,
          connectTimeout: 200,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          retryStrategy: () => null // Do not retry continuously on connection failure
        });

        this.redisClient.connect().catch(() => {
          this.redisClient = null;
        });

        this.redisClient.on("error", () => {
          // Graceful fallback to memory on Redis error
          this.redisClient = null;
        });
      } catch {
        this.redisClient = null;
      }
    }
  }

  async recordView(userId, eventId, dwellSeconds = 0) {
    if (!userId || !eventId) return;
    const eId = Number(eventId);
    const dwell = Math.max(0, Math.min(86400, Number(dwellSeconds) || 0));
    const key = `session:${userId}`;

    // 1. Fetch current session
    const current = await this.getSession(userId);
    let ids = current.session_event_ids || [];
    let dwells = current.dwell_times || {};

    // Append and keep last maxWindowSize
    ids = ids.filter((id) => id !== eId);
    ids.push(eId);
    if (ids.length > this.maxWindowSize) {
      ids = ids.slice(-this.maxWindowSize);
    }
    dwells[String(eId)] = dwell;

    const payload = {
      session_event_ids: ids,
      dwell_times: dwells,
      updated_at: Date.now()
    };

    // 2. Write to memory store
    this.memoryStore.set(key, payload);

    // 3. Write to Redis if available
    if (this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(payload), "EX", this.ttlSeconds);
      } catch {
        // Continue with memory store
      }
    }

    return payload;
  }

  async getSession(userId) {
    if (!userId) return { session_event_ids: [], dwell_times: {} };
    const key = `session:${userId}`;

    // Try Redis first
    if (this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            session_event_ids: parsed.session_event_ids || [],
            dwell_times: parsed.dwell_times || {}
          };
        }
      } catch {
        // Fallback to memory
      }
    }

    // Try in-memory store
    const mem = this.memoryStore.get(key);
    if (mem) {
      return {
        session_event_ids: mem.session_event_ids || [],
        dwell_times: mem.dwell_times || {}
      };
    }

    return { session_event_ids: [], dwell_times: {} };
  }

  clear() {
    this.memoryStore.clear();
  }
}

module.exports = {
  SessionCache
};
