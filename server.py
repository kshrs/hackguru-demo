#!/usr/bin/env python3
"""
HackGuru - Production-Grade Python HTTP Server
Supports:
  - Standard vs AI-enhanced Search & Recommendation via `--with-ai` flag
  - RESTful JSON APIs for events, search, recommendations, bookmarks, registration, analytics
  - Static asset serving (HTML, CSS, JS, Images, SVGs)
  - Interactive algorithm benchmarking API
"""

import os
import sys
import json
import time
import argparse
import mimetypes
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from core.db import init_db, seed_db, get_db_connection, DB_PATH
from core.search import DefaultSearchEngine, AISearchEngine
from core.recommender import DefaultRecommender, AIRecommender

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Global Engine Instances
DB_CONN = None
EVENTS_CACHE = []
DEFAULT_SEARCH_ENGINE = None
AI_SEARCH_ENGINE = None
DEFAULT_RECOMMENDER = None
AI_RECOMMENDER = None
IS_AI_ENABLED = False


def refresh_catalog():
    """Reloads events catalog from SQLite database and updates search & recommender models."""
    global EVENTS_CACHE, DEFAULT_SEARCH_ENGINE, AI_SEARCH_ENGINE, DEFAULT_RECOMMENDER, AI_RECOMMENDER
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events ORDER BY is_featured DESC, views_count DESC")
    EVENTS_CACHE = [dict(r) for r in cursor.fetchall()]
    conn.close()

    DEFAULT_SEARCH_ENGINE = DefaultSearchEngine(EVENTS_CACHE)
    AI_SEARCH_ENGINE = AISearchEngine(EVENTS_CACHE)
    DEFAULT_RECOMMENDER = DefaultRecommender(EVENTS_CACHE)
    AI_RECOMMENDER = AIRecommender(EVENTS_CACHE, search_engine=AI_SEARCH_ENGINE)


class HackGuruHandler(BaseHTTPRequestHandler):
    """Custom HTTP Request Handler for HackGuru."""

    def log_message(self, format, *args):
        """Custom concise logging."""
        sys.stderr.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {args[0]} {args[1]} -> {args[2]}\n")

    def _send_json(self, data, status=200):
        """Helper to send JSON responses with standard headers."""
        body = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, message, status=400):
        self._send_json({"success": False, "error": message}, status=status)

    def do_OPTIONS(self):
        """CORS preflight handling."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)

        # Route static files
        if path in ["/", "/index", "/index.html"]:
            return self.serve_file(os.path.join(STATIC_DIR, "index.html"), "text/html; charset=utf-8")

        if path in ["/events", "/explore-events", "/find", "/events.html"]:
            return self.serve_file(os.path.join(STATIC_DIR, "events.html"), "text/html; charset=utf-8")

        if path.startswith("/static/"):
            rel_path = path[len("/static/"):]
            file_path = os.path.join(STATIC_DIR, rel_path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return self.serve_file(file_path)
            return self.serve_file(os.path.join(STATIC_DIR, "404.html"), "text/html", status=404)

        # API Endpoints
        if path.startswith("/api/"):
            return self.handle_api_get(path, query_params)

        # Fallback to static or 404
        return self.serve_file(os.path.join(STATIC_DIR, "index.html"), "text/html; charset=utf-8")

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        content_len = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_len) if content_len > 0 else b"{}"

        try:
            payload = json.loads(post_body.decode("utf-8")) if post_body else {}
        except Exception:
            payload = {}

        if path.startswith("/api/"):
            return self.handle_api_post(path, payload)

        return self._send_error("Endpoint not found", status=404)

    def serve_file(self, file_path, content_type=None, status=200):
        """Serves a static file safely from the filesystem."""
        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return

        mime_type = content_type or mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        if mime_type.startswith("text/") or mime_type in ["application/javascript", "application/json"]:
            if "charset" not in mime_type:
                mime_type += "; charset=utf-8"

        file_size = os.path.getsize(file_path)
        self.send_response(status)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(file_size))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()

        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                self.wfile.write(chunk)

    def handle_api_get(self, path, params):
        """Dispatches GET API requests."""
        # 1. Platform & Algorithm Diagnostics
        if path == "/api/algorithm-info":
            return self._send_json({
                "mode": "ai" if IS_AI_ENABLED else "default",
                "ai_enabled": IS_AI_ENABLED,
                "engine_name": "AI Semantic Hybrid (Dense Vectors + BM25 + MMR)" if IS_AI_ENABLED else "Default Rule-Based Heuristic",
                "features": {
                    "vector_similarity": IS_AI_ENABLED,
                    "intent_classification": IS_AI_ENABLED,
                    "fuzzy_typo_resilience": IS_AI_ENABLED,
                    "mmr_diversity": IS_AI_ENABLED,
                    "explainable_badges": IS_AI_ENABLED
                },
                "active_catalog_size": len(EVENTS_CACHE)
            })

        # 2. Search & Events Catalog
        if path == "/api/events" or path == "/api/search":
            query = params.get("q", [""])[0]
            category = params.get("category", [None])[0]
            mode = params.get("mode", [None])[0]
            location = params.get("location", [None])[0]
            price = params.get("price", [None])[0]
            sort = params.get("sort", ["relevance"])[0]
            limit = int(params.get("limit", ["20"])[0])
            offset = int(params.get("offset", ["0"])[0])

            # Allow runtime algorithm override for A/B testing
            algo_override = params.get("algorithm", [None])[0]
            use_ai = (algo_override == "ai") if algo_override else IS_AI_ENABLED

            engine = AI_SEARCH_ENGINE if use_ai else DEFAULT_SEARCH_ENGINE
            result = engine.search(
                query=query, category=category, mode=mode,
                location=location, price=price, sort=sort,
                limit=limit, offset=offset
            )

            # Record search log if query was non-empty
            if query:
                try:
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO search_logs (query, algorithm_mode, results_count, latency_ms)
                        VALUES (?, ?, ?, ?)
                    """, (query, result["algorithm"], result["total_count"], result["latency_ms"]))
                    conn.commit()
                    conn.close()
                except Exception:
                    pass

            return self._send_json({
                "success": True,
                **result
            })

        # 3. Single Event Details & Similar Recommendations
        if path.startswith("/api/events/"):
            try:
                event_id = int(path.split("/")[-1])
            except ValueError:
                return self._send_error("Invalid Event ID", status=400)

            event = next((e for e in EVENTS_CACHE if int(e["id"]) == event_id), None)
            if not event and EVENTS_CACHE:
                # If ID shifted, fallback to first event in cache
                event = EVENTS_CACHE[0]
                event_id = event["id"]

            # Record view interaction
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO user_interactions (user_id, event_id, interaction_type, weight)
                    VALUES ('usr_kishor', ?, 'view', 1.0)
                """, (event_id,))
                cursor.execute("UPDATE events SET views_count = views_count + 1 WHERE id = ?", (event_id,))
                conn.commit()
                conn.close()
            except Exception:
                pass

            algo_override = params.get("algorithm", [None])[0]
            use_ai = (algo_override == "ai") if algo_override else IS_AI_ENABLED
            recommender = AI_RECOMMENDER if use_ai else DEFAULT_RECOMMENDER
            similar = recommender.get_similar_events(event_id, limit=6)

            return self._send_json({
                "success": True,
                "event": event,
                "similar_events": similar,
                "algorithm_used": "ai_vector_similarity" if use_ai else "default_rule_based"
            })

        # 4. Personalized Recommendations Feed
        if path == "/api/recommendations":
            limit = int(params.get("limit", ["8"])[0])
            algo_override = params.get("algorithm", [None])[0]
            use_ai = (algo_override == "ai") if algo_override else IS_AI_ENABLED

            # Fetch recent user interactions
            interactions = []
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT event_id, weight FROM user_interactions
                    WHERE user_id = 'usr_kishor'
                    ORDER BY timestamp DESC LIMIT 20
                """)
                interactions = [dict(r) for r in cursor.fetchall()]
                conn.close()
            except Exception:
                pass

            recommender = AI_RECOMMENDER if use_ai else DEFAULT_RECOMMENDER
            result = recommender.get_user_recommendations(interactions, limit=limit)

            return self._send_json({
                "success": True,
                **result
            })

        # 5. Section Specific Feeds (Featured, Trending, Virtual, Upcoming)
        if path == "/api/featured":
            featured = [e for e in EVENTS_CACHE if e.get("is_featured") == 1]
            return self._send_json({"success": True, "count": len(featured), "events": featured})

        if path == "/api/trending":
            trending = sorted(EVENTS_CACHE, key=lambda x: (x.get("is_trending", 0), x.get("views_count", 0)), reverse=True)[:10]
            return self._send_json({"success": True, "count": len(trending), "events": trending})

        if path == "/api/virtual":
            virtual = [e for e in EVENTS_CACHE if e.get("mode") == "ONLINE"]
            return self._send_json({"success": True, "count": len(virtual), "events": virtual})

        if path == "/api/locations":
            loc_counts = {}
            for e in EVENTS_CACHE:
                loc = e["location"]
                loc_counts[loc] = loc_counts.get(loc, 0) + 1

            locations_data = [
                {"city": "Coimbatore", "state": "Tamil Nadu", "count": loc_counts.get("Coimbatore", 0), "image": "/static/images/74f82205-f2d5-466c-a56d-b9f60ff309e4-Screenshot-2026-08-24-at-5.08.24-PM.webp"},
                {"city": "Chennai", "state": "Tamil Nadu", "count": loc_counts.get("Chennai", 0), "image": "/static/images/ba3ede2d-0c8a-48df-94f6-d2cc5e9408c4-4-2026082607.webp"},
                {"city": "Bengaluru", "state": "Karnataka", "count": loc_counts.get("Bengaluru", 0), "image": "/static/images/4cdc9205-648a-4b29-98df-015da1279671-Screenshot-2026-08-24-at-11.12.43-AM.webp"},
                {"city": "Hyderabad", "state": "Telangana", "count": loc_counts.get("Hyderabad", 0), "image": "/static/images/4a77da91-ec27-4e6d-9587-3c6ccb35db0b-Screenshot-2026-05-05-at-5.10.46-PM.png"},
                {"city": "Delhi", "state": "NCR", "count": loc_counts.get("Delhi", 0), "image": "/static/images/4a6cbb24-257c-4d2b-b6e6-c7890ce3bf7b-image-(5).png"},
                {"city": "Mumbai", "state": "Maharashtra", "count": loc_counts.get("Mumbai", 0), "image": "/static/images/6a3c09c1-98dc-4543-8895-2dbe08487459-ChatGPT-Image-May-22,-2026,-12_44_06-PM.png"},
                {"city": "Online", "state": "Virtual / Global", "count": loc_counts.get("Online", 0), "image": "/static/images/d24159ee-2868-45c0-b9b1-a4efd49c5730-Hero-Section-Banners.webp"}
            ]
            return self._send_json({"success": True, "locations": locations_data})

        # 6. Notifications
        if path == "/api/notifications":
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM notifications ORDER BY id DESC")
            notifs = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self._send_json({"success": True, "notifications": notifs})

        # 7. User Profile & Bookmarks
        if path == "/api/profile":
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT event_id, type FROM bookmarks WHERE user_id = 'usr_kishor'")
            bookmarks = [dict(r) for r in cursor.fetchall()]
            cursor.execute("SELECT e.* FROM registrations r JOIN events e ON r.event_id = e.id WHERE r.user_id = 'usr_kishor'")
            registered_events = [dict(r) for r in cursor.fetchall()]
            conn.close()

            return self._send_json({
                "success": True,
                "profile": {
                    "name": "Kishor",
                    "email": "kishorjsk2006@gmail.com",
                    "role": "USER",
                    "status": "Active",
                    "verified": True,
                    "following": 0,
                    "points": 1450,
                    "joining_date": "25 August 2026",
                    "saved_count": len(bookmarks),
                    "registered_count": len(registered_events)
                },
                "bookmarks": bookmarks,
                "registered_events": registered_events
            })

        # 8. Platform Stats
        if path == "/api/stats":
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM events")
            total_events = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM registrations")
            total_regs = cursor.fetchone()[0]
            cursor.execute("SELECT AVG(latency_ms) FROM search_logs")
            avg_latency = cursor.fetchone()[0] or 1.2
            conn.close()

            return self._send_json({
                "success": True,
                "total_events": total_events,
                "total_registrations": total_regs,
                "average_search_latency_ms": round(avg_latency, 2),
                "ai_enabled": IS_AI_ENABLED
            })

        return self._send_error(f"Cannot GET {path}", status=404)

    def handle_api_post(self, path, payload):
        """Dispatches POST API requests."""
        # 1. Bookmark / Wishlist Toggle
        if path == "/api/bookmark":
            event_id = payload.get("event_id")
            bm_type = payload.get("type", "bookmark")
            user_id = payload.get("user_id", "usr_kishor")

            if not event_id:
                return self._send_error("Missing event_id")

            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM bookmarks WHERE user_id = ? AND event_id = ? AND type = ?", (user_id, event_id, bm_type))
            existing = cursor.fetchone()

            if existing:
                cursor.execute("DELETE FROM bookmarks WHERE id = ?", (existing[0],))
                is_bookmarked = False
            else:
                cursor.execute("INSERT INTO bookmarks (user_id, event_id, type) VALUES (?, ?, ?)", (user_id, event_id, bm_type))
                cursor.execute("INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES (?, ?, ?, 2.5)", (user_id, event_id, bm_type))
                is_bookmarked = True

            conn.commit()
            conn.close()

            return self._send_json({
                "success": True,
                "event_id": event_id,
                "type": bm_type,
                "is_bookmarked": is_bookmarked
            })

        # 2. Event Registration
        if path == "/api/register":
            event_id = payload.get("event_id")
            user_name = payload.get("name", "Kishor")
            user_email = payload.get("email", "kishorjsk2006@gmail.com")
            team_name = payload.get("team_name", "")
            user_id = payload.get("user_id", "usr_kishor")

            if not event_id:
                return self._send_error("Missing event_id")

            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT INTO registrations (user_id, user_name, user_email, event_id, team_name)
                    VALUES (?, ?, ?, ?, ?)
                """, (user_id, user_name, user_email, event_id, team_name))
                cursor.execute("UPDATE events SET registrations_count = registrations_count + 1 WHERE id = ?", (event_id,))
                cursor.execute("INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES (?, ?, 'register', 5.0)", (user_id, event_id))
                conn.commit()
            except sqlite3.IntegrityError:
                conn.close()
                return self._send_error("Already registered for this event", status=409)
            conn.close()

            refresh_catalog()
            return self._send_json({
                "success": True,
                "message": "Successfully registered for event!",
                "event_id": event_id
            })

        # 3. Live Benchmark / A/B Algorithm Tester
        if path == "/api/benchmark":
            query = payload.get("query", "hackathon in coimbatore")
            category = payload.get("category", None)
            limit = int(payload.get("limit", 6))

            # Run Default Search
            t0 = time.time()
            def_res = DEFAULT_SEARCH_ENGINE.search(query=query, category=category, limit=limit)
            def_latency = round((time.time() - t0) * 1000, 3)

            # Run AI Search
            t1 = time.time()
            ai_res = AI_SEARCH_ENGINE.search(query=query, category=category, limit=limit)
            ai_latency = round((time.time() - t1) * 1000, 3)

            return self._send_json({
                "success": True,
                "query": query,
                "default_engine": {
                    "latency_ms": def_latency,
                    "total_count": def_res["total_count"],
                    "top_results": def_res["results"][:limit],
                    "strategy": "Substring + Multi-field Keyword Frequency"
                },
                "ai_engine": {
                    "latency_ms": ai_latency,
                    "total_count": ai_res["total_count"],
                    "top_results": ai_res["results"][:limit],
                    "diagnostics": ai_res["diagnostics"],
                    "strategy": "Dense Semantic Vectors + Subword N-gram + BM25 Hybrid"
                }
            })

        return self._send_error("Endpoint not found", status=404)


def run_server(port=8000, host="0.0.0.0", with_ai=False):
    """Initializes SQLite, builds models, and starts the HTTP server."""
    global IS_AI_ENABLED
    IS_AI_ENABLED = with_ai

    print(f"[*] Initializing HackGuru SQLite database...")
    seed_db(force=False)
    refresh_catalog()

    server_address = (host, port)
    httpd = HTTPServer(server_address, HackGuruHandler)

    mode_label = "\033[92mAI-Enhanced (Dense Semantic Vectors + BM25 + MMR)\033[0m" if IS_AI_ENABLED else "\033[94mDefault (Rule-Based & Keyword Heuristic)\033[0m"
    print(f"============================================================")
    print(f"   HackGuru College Events Platform Server Started")
    print(f"   URL: http://localhost:{port}")
    print(f"   Mode: {mode_label}")
    print(f"   Flag --with-ai: {IS_AI_ENABLED}")
    print(f"   Events Indexed: {len(EVENTS_CACHE)}")
    print(f"============================================================")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Shutting down HackGuru server gracefully...")
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HackGuru Events Platform Server")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind server (default: 8000)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface (default: 0.0.0.0)")
    parser.add_argument("--with-ai", action="store_true", help="Enable AI search & recommendation algorithms")
    args = parser.parse_args()

    run_server(port=args.port, host=args.host, with_ai=args.with_ai)
