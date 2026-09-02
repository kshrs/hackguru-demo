import unittest
from core.db import seed_db, get_db_connection
from core.search import SearchEngine
from core.recommender import Recommender
from core.vector_store import InMemoryVectorStore


class TestSearchAndRecommendation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_db(force=False)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events")
        cls.events = [dict(r) for r in cursor.fetchall()]
        conn.close()
        cls.vector_store = InMemoryVectorStore()
        cls.search_engine = SearchEngine(cls.events, vector_store=cls.vector_store)
        cls.recommender = Recommender(cls.events, vector_store=cls.vector_store)

    def test_hybrid_search(self):
        res = self.search_engine.search("hackathon in coimbatore", limit=5)
        self.assertGreater(res["total_count"], 0)
        self.assertEqual(res["algorithm"], "hybrid_semantic")
        top_titles = [r["event"]["title"] for r in res["results"]]
        self.assertTrue(any("hack" in t.lower() or "corexathon" in t.lower() for t in top_titles))

    def test_recommenders(self):
        target_event = self.events[0]
        similar = self.recommender.get_similar_events(target_event["id"], limit=4)
        self.assertGreater(len(similar), 0)
        self.assertNotEqual(similar[0]["event"]["id"], target_event["id"])

        user_feed = self.recommender.get_user_recommendations(user_interactions=[], limit=4)
        self.assertIn("recommendations", user_feed)
        self.assertEqual(user_feed["algorithm"], "hybrid_semantic_feed")


if __name__ == "__main__":
    unittest.main()
