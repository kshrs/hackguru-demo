import unittest
import json
import urllib.request
import urllib.parse
import threading
import time
from http.server import HTTPServer
from core.db import seed_db, get_db_connection
from core.search import SearchEngine
from core.vector_store import InMemoryVectorStore, extract_query_parameters
from server import HackGuruHandler, refresh_catalog


class TestSearchEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_db(force=True)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events")
        cls.events = [dict(r) for r in cursor.fetchall()]
        conn.close()
        cls.vector_store = InMemoryVectorStore()
        cls.search_engine = SearchEngine(cls.events, vector_store=cls.vector_store)

    def test_slot_extraction_ai_hackathon_coimbatore(self):
        """Verify slot extraction correctly parses category, location, and residual keywords."""
        parsed = extract_query_parameters("AI hackathon in coimbatore")
        slots = parsed["applied_filters"]
        self.assertEqual(slots.get("category"), "Hackathon")
        self.assertEqual(slots.get("location"), "Coimbatore")
        self.assertIn("ai", parsed["residual_keywords"].lower())

    def test_search_ai_hackathon_in_coimbatore(self):
        """Verify search for 'AI hackathon in coimbatore' returns HackGURU and Coimbatore hackathons."""
        res = self.search_engine.search("AI hackathon in coimbatore", limit=10)
        self.assertGreater(res["total_count"], 0, "Search should return matching events")
        
        top_titles = [r["event"]["title"] for r in res["results"][:5]]
        top_locations = [r["event"]["location"] for r in res["results"][:5]]
        
        # Verify Coimbatore events are present
        self.assertTrue(any("Coimbatore" in loc for loc in top_locations), "Top results should feature Coimbatore events")
        # Verify Hackathons like HackGURU, COREXATHON, or HACK THE HORIZON are in results
        has_hackathon = any("hack" in t.lower() or "corexathon" in t.lower() for t in top_titles)
        self.assertTrue(has_hackathon, f"Top results should contain hackathons: {top_titles}")

    def test_search_free_online_workshop(self):
        """Verify search for 'free online workshop' filters and ranks online workshops."""
        res = self.search_engine.search("free online workshop", limit=5)
        self.assertGreater(res["total_count"], 0)
        top_res = res["results"][0]
        self.assertTrue(
            "online" in top_res["event"]["mode"].lower() or "online" in top_res["event"]["location"].lower(),
            "Top result should be online"
        )

    def test_typo_tolerance_coimbatre_hackathn(self):
        """Verify typo tolerance matches Coimbatore hackathons for 'coimbatre hackathn'."""
        res = self.search_engine.search("coimbatre hackathn", limit=5)
        self.assertGreater(res["total_count"], 0)
        top_titles = [r["event"]["title"].lower() for r in res["results"][:3]]
        self.assertTrue(any("hack" in t for t in top_titles))

    def test_browse_all_events(self):
        """Verify empty query returns all catalog events ordered by popularity/featured."""
        res = self.search_engine.search("", limit=50)
        self.assertEqual(res["total_count"], len(self.events))


class TestServerAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_db(force=False)
        refresh_catalog()
        cls.server = HTTPServer(('127.0.0.1', 8991), HackGuruHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.3)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def test_api_events_search_query(self):
        """Test GET /api/events with search query."""
        url = "http://127.0.0.1:8991/api/events?q=" + urllib.parse.quote("AI hackathon in coimbatore")
        req = urllib.request.urlopen(url)
        self.assertEqual(req.status, 200)
        data = json.loads(req.read().decode('utf-8'))
        self.assertTrue(data.get("success"))
        self.assertGreater(data.get("total_count", 0), 0)
        results = data.get("results", [])
        self.assertGreater(len(results), 0)
        titles = [r["event"]["title"] for r in results[:3]]
        print("\n[API Test] Top results for 'AI hackathon in coimbatore':", titles)

    def test_api_smart_search(self):
        """Test GET /api/smart-search endpoint."""
        url = "http://127.0.0.1:8991/api/smart-search?q=" + urllib.parse.quote("free AI hackathon in coimbatore")
        req = urllib.request.urlopen(url)
        self.assertEqual(req.status, 200)
        data = json.loads(req.read().decode('utf-8'))
        self.assertTrue(data.get("success"))
        self.assertGreater(data.get("total_count", 0), 0)


if __name__ == "__main__":
    unittest.main()
