"""
Tests for server.py HTTP APIs and AI flag switching.
"""

import unittest
import threading
import time
import json
import urllib.request
import urllib.parse
from server import run_server, refresh_catalog
from core.db import seed_db


class TestServerAPIs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.port = 8899
        cls.base_url = f"http://127.0.0.1:{cls.port}"
        seed_db(force=True)

        # Start server in background thread with --with-ai enabled
        cls.server_thread = threading.Thread(
            target=run_server,
            kwargs={"port": cls.port, "host": "127.0.0.1", "with_ai": True},
            daemon=True
        )
        cls.server_thread.start()
        time.sleep(0.3)

    def _get(self, path):
        req = urllib.request.Request(f"{self.base_url}{path}")
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def _post(self, path, payload):
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(f"{self.base_url}{path}", data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def test_algorithm_info_endpoint(self):
        status, body = self._get("/api/algorithm-info")
        self.assertEqual(status, 200)
        self.assertEqual(body["mode"], "ai")
        self.assertTrue(body["ai_enabled"])
        self.assertGreater(body["active_catalog_size"], 20)

    def test_search_endpoint(self):
        status, body = self._get("/api/search?q=hackathon&limit=5")
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertEqual(body["algorithm"], "ai_semantic_hybrid")
        self.assertGreater(len(body["results"]), 0)

    def test_recommendations_endpoint(self):
        status, body = self._get("/api/recommendations?limit=4")
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertEqual(len(body["recommendations"]), 4)

    def test_events_and_details_endpoint(self):
        status, body = self._get("/api/events/1")
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertEqual(body["event"]["title"], "HackGURU 2026")
        self.assertGreater(len(body["similar_events"]), 0)

    def test_locations_and_featured(self):
        status_loc, loc_body = self._get("/api/locations")
        self.assertEqual(status_loc, 200)
        self.assertGreater(len(loc_body["locations"]), 0)

        status_feat, feat_body = self._get("/api/featured")
        self.assertEqual(status_feat, 200)
        self.assertGreater(len(feat_body["events"]), 0)

    def test_bookmark_and_registration(self):
        # Bookmark toggle
        status_bm, bm_body = self._post("/api/bookmark", {"event_id": 1, "type": "bookmark", "user_id": "usr_test"})
        self.assertEqual(status_bm, 200)
        self.assertTrue(bm_body["success"])

        # Register
        status_reg, reg_body = self._post("/api/register", {"event_id": 2, "name": "Tester", "email": "test@test.com", "user_id": "usr_test_new"})
        self.assertEqual(status_reg, 200)
        self.assertTrue(reg_body["success"])

    def test_benchmark_api(self):
        status, body = self._post("/api/benchmark", {"query": "AI Hackathon", "limit": 4})
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertIn("default_engine", body)
        self.assertIn("ai_engine", body)


if __name__ == "__main__":
    unittest.main()
