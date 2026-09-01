#!/usr/bin/env python3
"""
HackGuru - Production-Grade Python HTTP Server
Unified, high-performance hybrid search, recommendation, and event catalog platform.
"""

import os
import sys
import json
import time
import argparse
import mimetypes
import urllib.parse
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from core.db import init_db, seed_db, get_db_connection, DB_PATH
from core.search import SearchEngine
from core.recommender import Recommender
from core.vector_store import InMemoryVectorStore

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Global Engine Instances
EVENTS_CACHE = []
SEARCH_ENGINE = None
RECOMMENDER = None
IN_MEM_VECTOR_STORE = None


def refresh_catalog():
    """Reloads events catalog from SQLite database and updates vector store & models."""
    global EVENTS_CACHE, SEARCH_ENGINE, RECOMMENDER, IN_MEM_VECTOR_STORE
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events ORDER BY is_featured DESC, views_count DESC")
    EVENTS_CACHE = [dict(r) for r in cursor.fetchall()]
    conn.close()

    if IN_MEM_VECTOR_STORE is None:
        IN_MEM_VECTOR_STORE = InMemoryVectorStore()
    else:
        IN_MEM_VECTOR_STORE.load_from_db()

    SEARCH_ENGINE = SearchEngine(EVENTS_CACHE, vector_store=IN_MEM_VECTOR_STORE)
    RECOMMENDER = Recommender(EVENTS_CACHE, vector_store=IN_MEM_VECTOR_STORE)


class HackGuruHandler(BaseHTTPRequestHandler):
    """Custom HTTP Request Handler for HackGuru."""

    def log_message(self, format, *args):
        sys.stderr.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {args[0]} {args[1]} -> {args[2]}\n")

    def _send_json(self, data, status=200):
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
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)

        # Route static HTML files
        if path in ["/", "/index", "/index.html"]:
            return self.serve_file(os.path.join(STATIC_DIR, "index.html"), "text/html; charset=utf-8")

        if path in ["/events", "/explore-events", "/find", "/events.html"]:
            return self.serve_file(os.path.join(STATIC_DIR, "events.html"), "text/html; charset=utf-8")

        # Serve static assets
        if path.startswith("/static/"):
            rel_path = path[len("/static/"):]
            file_path = os.path.join(STATIC_DIR, rel_path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return self.serve_file(file_path)
            return self.serve_file(os.path.join(STATIC_DIR, "404.html"), "text/html", status=404)

        # API Endpoints
        if path.startswith("/api/"):
            return self.handle_api_get(path, query_params)

        # Fallback to home page
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
        # 1. Platform Diagnostics
        if path == "/api/algorithm-info":
            return self._send_json({
                "engine_name": "Unified Hybrid Semantic Search (384-d Dense Vectors + Okapi BM25 + Intent Slot Extraction)",
                "features": {
                    "vector_similarity": True,
                    "intent_classification": True,
                    "fuzzy_typo_resilience": True,
                    "mmr_diversity": True,
                    "explainable_badges": True
                },
                "active_catalog_size": len(EVENTS_CACHE)
            })

        # 2. Search & Events Catalog
        if path == "/api/events" or path == "/api/search":
            query = params.get("q", [""])[0] or params.get("searchText", [""])[0]
            category = params.get("category", [None])[0]
            mode = params.get("mode", [None])[0]
            location = params.get("location", [None])[0]
            price = params.get("price", [None])[0]
            sort = params.get("sort", ["relevance"])[0]
            limit = int(params.get("limit", ["50"])[0])
            offset = int(params.get("offset", ["0"])[0])

            result = SEARCH_ENGINE.search(
                query=query, category=category, mode=mode,
                location=location, price=price, sort=sort,
                limit=limit, offset=offset
            )

            # Record search log
            if query:
                try:
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO search_logs (query, algorithm_mode, results_count, latency_ms)
                        VALUES (?, 'hybrid_semantic', ?, ?)
                    """, (query, result["total_count"], result["latency_ms"]))
                    conn.commit()
                    conn.close()
                except Exception:
                    pass

            return self._send_json({
                "success": True,
                **result
            })

        # 3. Smart Search Endpoint
        if path == "/api/smart-search":
            query = params.get("q", [""])[0]
            top_k = int(params.get("top_k", ["20"])[0])
            strict = params.get("strict", ["false"])[0].lower() == "true"

            res = IN_MEM_VECTOR_STORE.search(raw_query=query, top_k=top_k, strict_filters=strict)
            return self._send_json({
                "success": True,
                **res
            })

        # 4. Single Event Details & Similar Recommendations
        if path.startswith("/api/events/"):
            try:
                event_id = int(path.split("/")[-1])
            except ValueError:
                return self._send_error("Invalid Event ID", status=400)

            event = next((e for e in EVENTS_CACHE if int(e["id"]) == event_id), None)
            if not event and EVENTS_CACHE:
                event = EVENTS_CACHE[0]
                event_id = event["id"]

            # View telemetry
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("UPDATE events SET views_count = views_count + 1 WHERE id = ?", (event_id,))
                conn.commit()
                conn.close()
            except Exception:
                pass

            similar = RECOMMENDER.get_similar_events(event_id, limit=6)

            return self._send_json({
                "success": True,
                "event": event,
                "similar_events": similar
            })

        # 5. Personalized Recommendations Feed
        if path == "/api/recommendations":
            limit = int(params.get("limit", ["8"])[0])
            user_id = params.get("user_id", ["usr_kishor"])[0]
            user_city = params.get("city", [None])[0]
            user_college = params.get("college", [None])[0]
            raw_session = params.get("session_ids", [None])[0]
            session_event_ids = None
            if raw_session:
                try:
                    session_event_ids = [int(x.strip()) for x in raw_session.split(",") if x.strip()]
                except Exception:
                    session_event_ids = None

            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT event_id, interaction_type, weight FROM user_interactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20", (user_id,))
            interactions = [dict(r) for r in cursor.fetchall()]
            if not interactions:
                cursor.execute("SELECT event_id, interaction_type, weight FROM user_interactions ORDER BY timestamp DESC LIMIT 20")
                interactions = [dict(r) for r in cursor.fetchall()]

            cursor.execute("SELECT event_id FROM registrations WHERE user_id = ?", (user_id,))
            registered_ids = {int(r[0]) for r in cursor.fetchall()}
            conn.close()

            recs = RECOMMENDER.get_user_recommendations(
                user_interactions=interactions,
                session_event_ids=session_event_ids,
                user_city=user_city,
                user_college=user_college,
                registered_ids=registered_ids,
                user_id=user_id,
                limit=limit
            )
            return self._send_json({
                "success": True,
                **recs
            })

        # 6. Bookmarks List
        if path == "/api/bookmarks":
            user_id = params.get("user_id", ["usr_kishor"])[0]
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT e.* FROM events e
                JOIN bookmarks b ON e.id = b.event_id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
            """, (user_id,))
            bookmarks = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self._send_json({"success": True, "count": len(bookmarks), "bookmarks": bookmarks})

        # 7. Notifications List
        if path == "/api/notifications":
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 10")
            notifs = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self._send_json({"success": True, "count": len(notifs), "notifications": notifs})

        return self._send_error("API endpoint not found", status=404)

    def handle_api_post(self, path, payload):
        # 1. Bookmark Toggle
        if path == "/api/bookmark":
            event_id = payload.get("event_id")
            user_id = payload.get("user_id", "usr_kishor")
            action = payload.get("action", "toggle")

            if not event_id:
                return self._send_error("Missing event_id")

            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM bookmarks WHERE user_id = ? AND event_id = ?", (user_id, event_id))
            row = cursor.fetchone()

            if row and action in ["toggle", "remove"]:
                cursor.execute("DELETE FROM bookmarks WHERE user_id = ? AND event_id = ?", (user_id, event_id))
                is_saved = False
            else:
                cursor.execute("INSERT OR IGNORE INTO bookmarks (user_id, event_id) VALUES (?, ?)", (user_id, event_id))
                is_saved = True
                cursor.execute("INSERT INTO user_interactions (user_id, event_id, interaction_type, weight) VALUES (?, ?, 'bookmark', 3.0)", (user_id, event_id))

            conn.commit()
            conn.close()
            return self._send_json({"success": True, "event_id": event_id, "is_saved": is_saved})

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

        # 3. Live Benchmark Tester
        if path == "/api/benchmark":
            query = payload.get("query", "hackathon in coimbatore")
            category = payload.get("category", None)
            limit = int(payload.get("limit", 6))

            t0 = time.time()
            res = SEARCH_ENGINE.search(query=query, category=category, limit=limit)
            latency = round((time.time() - t0) * 1000, 3)

            return self._send_json({
                "success": True,
                "query": query,
                "search_engine": {
                    "latency_ms": latency,
                    "total_count": res["total_count"],
                    "top_results": res["results"][:limit],
                    "diagnostics": res["diagnostics"],
                    "strategy": "384-d Dense Semantic Vectors + Subword N-gram + BM25 Hybrid"
                }
            })

        # 4. Personalized Recommendations (POST)
        if path == "/api/recommendations":
            user_id = payload.get("user_id", "usr_kishor")
            limit = int(payload.get("limit", 8))
            user_city = payload.get("city") or payload.get("user_city")
            user_college = payload.get("college") or payload.get("user_college")
            session_event_ids = payload.get("session_event_ids") or payload.get("session_ids")
            if isinstance(session_event_ids, str):
                try:
                    session_event_ids = [int(x.strip()) for x in session_event_ids.split(",") if x.strip()]
                except Exception:
                    session_event_ids = None

            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT event_id, interaction_type, weight FROM user_interactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20", (user_id,))
            interactions = [dict(r) for r in cursor.fetchall()]
            if not interactions:
                cursor.execute("SELECT event_id, interaction_type, weight FROM user_interactions ORDER BY timestamp DESC LIMIT 20")
                interactions = [dict(r) for r in cursor.fetchall()]

            cursor.execute("SELECT event_id FROM registrations WHERE user_id = ?", (user_id,))
            registered_ids = {int(r[0]) for r in cursor.fetchall()}
            conn.close()

            recs = RECOMMENDER.get_user_recommendations(
                user_interactions=interactions,
                session_event_ids=session_event_ids,
                user_city=user_city,
                user_college=user_college,
                registered_ids=registered_ids,
                user_id=user_id,
                limit=limit
            )
            return self._send_json({
                "success": True,
                **recs
            })

        return self._send_error("Endpoint not found", status=404)


def run_server(port=8000, host="0.0.0.0"):
    """Initializes SQLite, builds vector index, and starts the HTTP server."""
    print(f"[*] Initializing HackGuru SQLite database...")
    seed_db(force=False)
    refresh_catalog()

    server_address = (host, port)
    httpd = HTTPServer(server_address, HackGuruHandler)

    print(f"============================================================")
    print(f"   HackGuru College Events Platform Server Started")
    print(f"   URL: http://localhost:{port}")
    print(f"   Search Engine: 384-d Dense Semantic Vector + BM25 Hybrid")
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
    args = parser.parse_args()

    run_server(port=args.port, host=args.host)
