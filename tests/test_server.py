import unittest
import json
import urllib.request
import urllib.parse
import threading
import time
from http.server import HTTPServer
from server import HackGuruHandler, refresh_catalog
from core.db import seed_db


class TestServerAPIs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_db(force=False)
        refresh_catalog()
        cls.port = 8993
        cls.server = HTTPServer(('127.0.0.1', cls.port), HackGuruHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.3)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def _get(self, path):
        url = f"http://127.0.0.1:{self.port}{path}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read().decode('utf-8')
            return resp.status, json.loads(data) if "application/json" in resp.headers.get("Content-Type", "") else data

    def _post(self, path, payload):
        url = f"http://127.0.0.1:{self.port}{path}"
        data_bytes = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read().decode('utf-8')
            return resp.status, json.loads(data)

    def test_events_endpoint(self):
        status, body = self._get("/api/events?limit=5")
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertGreater(body["total_count"], 0)

    def test_search_endpoint(self):
        status, body = self._get("/api/search?q=" + urllib.parse.quote("AI hackathon in coimbatore") + "&limit=5")
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertGreater(body["total_count"], 0)

    def test_recommendations_endpoint(self):
        status, body = self._get("/api/recommendations?limit=4")
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertIn("recommendations", body)

    def test_benchmark_endpoint(self):
        status, body = self._post("/api/benchmark", {"query": "AI hackathon in coimbatore", "limit": 4})
        self.assertEqual(status, 200)
        self.assertTrue(body["success"])
        self.assertIn("search_engine", body)


if __name__ == "__main__":
    unittest.main()
