"""
Edge-Case Fuzzing & Fault-Tolerance Tests for Recommender Engine:
1. Empty User History & Empty Session (Pure Cold-Start).
2. Invalid / Corrupted Event IDs (Negative, Non-existent, Strings).
3. Extreme Dwell Times (24h overflow, Negative dwell).
4. Redis Connection Outage / Timeout resilience.
5. Catalog Category Saturation (All categories present in history).
6. Zero-Division Defense on zero/empty weights.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
import numpy as np
import json
from unittest.mock import MagicMock

from core.embedder import FastSemanticEmbedder
from core.vector_store import InMemoryVectorStore
from core.recommender import (
    compute_dwell_weight,
    fetch_redis_session,
    generate_evidence_badge,
    Recommender
)
from core.db import seed_db, get_db_connection


class TestRecommendationEdgeCases(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        seed_db(force=False)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events")
        cls.events = [dict(r) for r in cursor.fetchall()]
        conn.close()

        cls.embedder = FastSemanticEmbedder(dim=384)
        cls.vector_store = InMemoryVectorStore()
        cls.vector_store.load_from_db()
        cls.recommender = Recommender(events=cls.events, vector_store=cls.vector_store)

    def test_1_pure_cold_start_empty_history_and_session(self):
        """Scenario 1: User has zero interactions and empty session array."""
        res = self.recommender.get_user_recommendations(
            user_interactions=[],
            session_event_ids=[],
            user_city=None,
            user_college=None,
            registered_ids=None,
            limit=8
        )
        self.assertTrue(res["success"])
        recs = res["recommendations"]
        self.assertEqual(len(recs), min(8, len(self.events)))
        for r in recs:
            self.assertFalse(np.isnan(r["score"]))
            self.assertFalse(np.isnan(r["semantic_similarity"]))
            self.assertIsInstance(r["badge"], str)
            self.assertGreater(len(r["badge"]), 0)

    def test_2_invalid_and_corrupted_event_ids(self):
        """Scenario 2: Corrupted, non-existent, negative, or string event IDs."""
        corrupted_sessions = [-999, 999999, "invalid_id", None, 0]
        corrupted_interactions = [
            {"event_id": -50, "weight": 2.0},
            {"event_id": 999999, "weight": 5.0},
            {"event_id": "corrupted", "weight": "not_a_number"},
            {"event_id": None, "weight": None}
        ]

        res = self.recommender.get_user_recommendations(
            user_interactions=corrupted_interactions,
            session_event_ids=corrupted_sessions,
            user_city="Coimbatore",
            limit=6
        )
        self.assertTrue(res["success"])
        self.assertEqual(len(res["recommendations"]), 6)

    def test_3_extreme_dwell_times(self):
        """Scenario 3: Dwell times with extreme values (24 hours, negative values, NaN)."""
        self.assertEqual(compute_dwell_weight(86400), 2.5)  # 24h clipped to max 2.5
        self.assertEqual(compute_dwell_weight(1000000), 2.5)
        self.assertEqual(compute_dwell_weight(-10), 1.0)     # Negative clipped to base 1.0
        self.assertEqual(compute_dwell_weight("invalid"), 1.0)
        self.assertEqual(compute_dwell_weight(None), 1.0)

        # Check blending with extreme dwell dictionary
        extreme_dwells = {"1": 86400, "2": -500, "3": 0}
        u_vec = self.recommender.synthesize_user_vector(
            [{"event_id": 1, "weight": 1.0}, {"event_id": 2, "weight": 1.0}],
            dwell_times=extreme_dwells
        )
        self.assertIsNotNone(u_vec)
        self.assertFalse(np.isnan(u_vec).any())
        self.assertFalse(np.isinf(u_vec).any())

    def test_4_redis_connection_outage_and_timeout(self):
        """Scenario 4: Redis client raises ConnectionError / TimeoutError."""
        mock_redis = MagicMock()
        mock_redis.get.side_effect = TimeoutError("Redis socket timeout simulated")

        data = fetch_redis_session("usr_fuzz_test", client=mock_redis)
        self.assertEqual(data["session_event_ids"], [])
        self.assertEqual(data["dwell_times"], {})

        # Recommender execution with failing Redis client
        res = self.recommender.get_user_recommendations(
            user_interactions=[{"event_id": 1, "weight": 1.0}],
            session_event_ids=None,
            redis_client=mock_redis,
            user_id="usr_fuzz_test",
            limit=4
        )
        self.assertTrue(res["success"])
        self.assertEqual(len(res["recommendations"]), 4)

    def test_5_catalog_category_saturation(self):
        """Scenario 5: User has interacted with EVERY single category in the catalog."""
        all_categories = list({e["category"] for e in self.events})
        saturated_interactions = []
        for cat in all_categories:
            match = next((e for e in self.events if e["category"] == cat), None)
            if match:
                saturated_interactions.append({"event_id": match["id"], "weight": 1.0})

        # Must not enter infinite loop or crash
        res = self.recommender.get_user_recommendations(
            user_interactions=saturated_interactions,
            limit=8
        )
        self.assertTrue(res["success"])
        self.assertEqual(len(res["recommendations"]), 8)

    def test_6_zero_division_defense(self):
        """Scenario 6: Pass 0.0 or negative weights to user barycenter."""
        zero_interactions = [
            {"event_id": 1, "weight": 0.0},
            {"event_id": 2, "weight": 0.0}
        ]
        u_vec = self.recommender.synthesize_user_vector(zero_interactions)
        # Should gracefully return None without raising ZeroDivisionError
        self.assertIsNone(u_vec)

        # Feed generation with zero weights should fallback cleanly
        res = self.recommender.get_user_recommendations(
            user_interactions=zero_interactions,
            limit=5
        )
        self.assertTrue(res["success"])
        self.assertEqual(len(res["recommendations"]), 5)


if __name__ == "__main__":
    unittest.main()
