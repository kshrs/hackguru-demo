"""
Tests for search.py and recommender.py
Verifies DefaultSearchEngine, AISearchEngine, DefaultRecommender, and AIRecommender.
"""

import unittest
import os
import tempfile
from core.db import seed_db, get_db_connection
from core.search import DefaultSearchEngine, AISearchEngine
from core.recommender import DefaultRecommender, AIRecommender


class TestSearchAndRecommendation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.mkdtemp()
        cls.db_path = os.path.join(cls.temp_dir, "test_sr.db")
        seed_db(cls.db_path, force=True)

        conn = get_db_connection(cls.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events")
        cls.events = [dict(row) for row in cursor.fetchall()]
        conn.close()

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.db_path):
            os.remove(cls.db_path)
        if os.path.exists(cls.temp_dir):
            os.rmdir(cls.temp_dir)

    def test_default_search_engine(self):
        engine = DefaultSearchEngine(self.events)
        res = engine.search("Hackathon")
        self.assertEqual(res["algorithm"], "default")
        self.assertGreater(len(res["results"]), 0)
        self.assertTrue(any("HackGURU" in r["event"]["title"] for r in res["results"]))

        # Category filtering
        res_cat = engine.search("", category="Workshop")
        self.assertTrue(all(r["event"]["category"] == "Workshop" for r in res_cat["results"]))

        # Price filtering
        res_free = engine.search("", price="Free")
        self.assertTrue(all(r["event"]["price"] == "Free" or r["event"].get("price_numeric") == 0 for r in res_free["results"]))

    def test_ai_search_engine_semantics_and_intent(self):
        engine = AISearchEngine(self.events)

        # 1. Direct query
        res = engine.search("agentic coding ai")
        self.assertEqual(res["algorithm"], "ai_semantic_hybrid")
        self.assertGreater(len(res["results"]), 0)
        # Top result should be HackGURU or AI STTP
        top_title = res["results"][0]["event"]["title"]
        self.assertTrue("HackGURU" in top_title or "Agentic" in top_title or "AI" in top_title)

        # 2. Query with typo
        res_typo = engine.search("hackathn coimbatre")
        self.assertGreater(len(res_typo["results"]), 0)
        self.assertTrue(any(r["event"]["location"] == "Coimbatore" for r in res_typo["results"]))

        # 3. Query intent parsing
        intent = engine.parse_query_intent("free ai hackathons in chennai")
        self.assertIn("hackathon", intent["intents"])
        self.assertIn("ai_ml", intent["intents"])
        self.assertEqual(intent["location"], "Chennai")
        self.assertEqual(intent["price_intent"], "Free")

    def test_default_and_ai_recommenders(self):
        ai_search = AISearchEngine(self.events)
        def_rec = DefaultRecommender(self.events)
        ai_rec = AIRecommender(self.events, search_engine=ai_search)

        # Similar events for HackGURU (event id 1)
        def_similar = def_rec.get_similar_events(1, limit=4)
        ai_similar = ai_rec.get_similar_events(1, limit=4)

        self.assertEqual(len(def_similar), 4)
        self.assertEqual(len(ai_similar), 4)
        self.assertIn("semantic_similarity", ai_similar[0])

        # User recommendations
        interactions = [{"event_id": 1, "weight": 3.0}, {"event_id": 2, "weight": 2.0}]
        def_user_rec = def_rec.get_user_recommendations(interactions, limit=5)
        ai_user_rec = ai_rec.get_user_recommendations(interactions, limit=5)

        self.assertEqual(len(def_user_rec["recommendations"]), 5)
        self.assertEqual(len(ai_user_rec["recommendations"]), 5)
        self.assertEqual(ai_user_rec["algorithm"], "ai_mmr_hybrid")


if __name__ == "__main__":
    unittest.main()
