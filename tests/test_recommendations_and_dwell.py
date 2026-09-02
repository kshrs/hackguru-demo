"""
Unit tests for HackGURU Track 2.1:
1. Dwell time multipliers
2. Dynamic User Vector Barycenter & Session Blending
3. Redis Session Fetching & Fallbacks
4. Multi-Factor Linear Scoring & Deterministic Evidence Badges
5. 15% Epsilon-Greedy Exploration (Filter Bubble Burst)
6. Zero-Cost KeyBERT Local Micro-Genre Ingestion
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
import numpy as np
import json
from unittest.mock import MagicMock

from core.embedder import FastSemanticEmbedder, extract_micro_genres
from core.vector_store import InMemoryVectorStore
from core.recommender import (
    compute_dwell_weight,
    fetch_redis_session,
    generate_evidence_badge,
    Recommender
)


class TestRecommendationEngine(unittest.TestCase):

    def setUp(self):
        self.embedder = FastSemanticEmbedder(dim=384)
        self.sample_events = [
            {
                "id": 1,
                "title": "AI & Agentic Hackathon 2026",
                "slug": "ai-agentic-hackathon-2026",
                "category": "Hackathon",
                "mode": "OFFLINE",
                "location": "Coimbatore",
                "college": "Kumaraguru College of Technology",
                "views_count": 2500,
                "registrations_count": 800,
                "rating": 4.9,
                "tags": json.dumps(["AI", "Agentic AI", "Python"]),
                "description": "Build autonomous agents, multi-agent workflows, and LLM systems in a 36-hour hackathon."
            },
            {
                "id": 2,
                "title": "Advanced Web3 & Blockchain Workshop",
                "slug": "web3-blockchain-workshop",
                "category": "Workshop",
                "mode": "ONLINE",
                "location": "Online",
                "college": "NIT Trichy",
                "views_count": 900,
                "registrations_count": 300,
                "rating": 4.8,
                "tags": json.dumps(["Web3", "Solidity", "Blockchain"]),
                "description": "Learn smart contract development, zero-knowledge proofs, and decentralized applications."
            },
            {
                "id": 3,
                "title": "Aerospace Rover Challenge",
                "slug": "aerospace-rover-challenge",
                "category": "Contest",
                "mode": "OFFLINE",
                "location": "Chennai",
                "college": "SRM University",
                "views_count": 400,
                "registrations_count": 150,
                "rating": 4.9,
                "tags": json.dumps(["SpaceTech", "Robotics", "ROS"]),
                "description": "Design and pilot autonomous Martian rovers across challenging obstacle terrains."
            },
            {
                "id": 4,
                "title": "GreenTech & Biofuel Conference",
                "slug": "greentech-biofuel-conference",
                "category": "Conference",
                "mode": "ONLINE",
                "location": "Online",
                "college": "IIT Madras",
                "views_count": 300,
                "registrations_count": 90,
                "rating": 4.7,
                "tags": json.dumps(["GreenTech", "Sustainability", "Biofuels"]),
                "description": "International conference on circular bio-economy and waste valorization technologies."
            }
        ]
        
        # Build mock vector store
        self.vector_store = InMemoryVectorStore()
        texts = [f"{e['title']} {e['category']} {e['description']}" for e in self.sample_events]
        self.vector_store.matrix = self.embedder.encode(texts)
        self.vector_store.event_ids = np.array([e["id"] for e in self.sample_events])
        self.vector_store.is_ready = True
        
        self.recommender = Recommender(events=self.sample_events, vector_store=self.vector_store)

    def test_dwell_time_multiplier(self):
        """Test dwell time multipliers: 0-10s -> 1.0, 11-30s -> 1.5, 31-60s -> 2.0, >60s -> 2.5"""
        self.assertEqual(compute_dwell_weight(5), 1.0)
        self.assertEqual(compute_dwell_weight(10), 1.0)
        self.assertEqual(compute_dwell_weight(15), 1.5)
        self.assertEqual(compute_dwell_weight(30), 1.5)
        self.assertEqual(compute_dwell_weight(45), 2.0)
        self.assertEqual(compute_dwell_weight(60), 2.0)
        self.assertEqual(compute_dwell_weight(90), 2.5)

    def test_redis_session_fetch_and_fallback(self):
        """Test Redis session retrieval with mock and fallback behavior when Redis is unavailable."""
        # 1. Successful mock
        mock_redis = MagicMock()
        mock_redis.get.return_value = json.dumps({
            "session_event_ids": [1, 2],
            "dwell_times": {"1": 45, "2": 70}
        })
        session_data = fetch_redis_session("usr_test", client=mock_redis)
        self.assertEqual(session_data["session_event_ids"], [1, 2])
        self.assertEqual(session_data["dwell_times"]["1"], 45)

        # 2. Redis failure / connection error fallback
        failing_redis = MagicMock()
        failing_redis.get.side_effect = Exception("Connection Refused")
        fallback_data = fetch_redis_session("usr_test", client=failing_redis)
        self.assertEqual(fallback_data["session_event_ids"], [])
        self.assertEqual(fallback_data["dwell_times"], {})

    def test_user_vector_barycenter_and_session_blending(self):
        """Verify dynamic user vector barycenter and 60/40 session vector blending."""
        # Barycenter calculation
        interactions = [
            {"event_id": 1, "weight": 5.0}, # Register
            {"event_id": 2, "weight": 1.0}  # View
        ]
        u_vec = self.recommender.synthesize_user_vector(interactions)
        self.assertIsNotNone(u_vec)
        self.assertEqual(len(u_vec), 384)
        self.assertAlmostEqual(np.linalg.norm(u_vec), 1.0, places=4)

        # Session blending: V_active = 0.60 * V_session + 0.40 * V_u
        session_ids = [3] # Rover challenge
        active_vec = self.recommender.blend_session_vector(u_vec, session_ids)
        self.assertIsNotNone(active_vec)
        self.assertAlmostEqual(np.linalg.norm(active_vec), 1.0, places=4)

        # Active vector should be closer to session event (id: 3) than user vector alone
        sim_u_rover = float(np.dot(self.vector_store.matrix[2], u_vec))
        sim_active_rover = float(np.dot(self.vector_store.matrix[2], active_vec))
        self.assertGreater(sim_active_rover, sim_u_rover)

    def test_multifactor_scoring_and_evidence_badges(self):
        """Verify deterministic evidence badges and multi-factor scoring formula."""
        # 1. Exploration badge
        badge_exp = generate_evidence_badge(
            event=self.sample_events[3], # Conference
            sim_score=0.4,
            loc_match=0.35,
            is_exploration=True,
            is_registered=False,
            user_college="KCT"
        )
        self.assertEqual(badge_exp, "Explore Something New: Popular in Conference")

        # 2. College match badge
        badge_college = generate_evidence_badge(
            event=self.sample_events[0],
            sim_score=0.8,
            loc_match=1.0,
            is_exploration=False,
            is_registered=False,
            user_college="Kumaraguru College of Technology"
        )
        self.assertIn("Trending at your college", badge_college)

        # 3. High semantic match badge
        badge_interest = generate_evidence_badge(
            event=self.sample_events[0],
            sim_score=0.75,
            loc_match=0.35,
            is_exploration=False,
            is_registered=False,
            user_college="IIT Bombay"
        )
        self.assertIn("Matches your interest in", badge_interest)

    def test_epsilon_greedy_exploration_policy(self):
        """Verify 15% exploration slot is injected from an unrepresented category with Rating >= 4.7."""
        # User only interacted with Hackathon (id: 1) and Workshop (id: 2)
        interactions = [{"event_id": 1, "weight": 5.0}, {"event_id": 2, "weight": 3.0}]
        
        res = self.recommender.get_user_recommendations(
            user_interactions=interactions,
            session_event_ids=None,
            user_city="Coimbatore",
            limit=4
        )
        
        recs = res["recommendations"]
        self.assertEqual(len(recs), 4)
        
        # Check if an exploration slot exists with is_exploration = True
        has_exploration = any(r.get("is_exploration") is True for r in recs)
        self.assertTrue(has_exploration)
        
        # Verify the explored category is NOT Hackathon or Workshop
        exp_item = next(r for r in recs if r.get("is_exploration") is True)
        self.assertNotIn(exp_item["event"]["category"], ["Hackathon", "Workshop"])
        self.assertGreaterEqual(exp_item["event"]["rating"], 4.7)

    def test_keybert_micro_genre_extraction(self):
        """Verify local zero-cost KeyBERT micro-genre extraction using CountVectorizer and MMR."""
        sample_doc = (
            "Flagship 36-Hour Hackathon on Autonomous Agentic AI Systems, LangGraph workflows, "
            "and ROS robotics edge computing prototypes."
        )
        micro_genres = extract_micro_genres(sample_doc, self.embedder, top_n=3, diversity=0.7)
        self.assertIsInstance(micro_genres, list)
        self.assertGreater(len(micro_genres), 0)
        self.assertLessEqual(len(micro_genres), 3)


if __name__ == "__main__":
    unittest.main()
