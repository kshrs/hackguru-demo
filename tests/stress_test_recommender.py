"""
High-Concurrency Stress & Load Benchmark for Recommender Engine:
Simulates 100 concurrent recommendation requests across random student profiles.
Asserts:
1. Zero request failures (100% success rate).
2. Average latency across 100 concurrent requests < 20ms.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import random
import unittest
from concurrent.futures import ThreadPoolExecutor, as_completed

from core.db import seed_db, get_db_connection
from core.vector_store import InMemoryVectorStore
from core.recommender import Recommender


class TestRecommenderStressAndConcurrency(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        seed_db(force=False)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events")
        cls.events = [dict(r) for r in cursor.fetchall()]
        conn.close()

        cls.vector_store = InMemoryVectorStore()
        cls.vector_store.load_from_db()
        cls.recommender = Recommender(events=cls.events, vector_store=cls.vector_store)
        cls.event_ids = [e["id"] for e in cls.events]
        cls.cities = ["Coimbatore", "Chennai", "Bengaluru", "Delhi", "Mumbai", "Hyderabad", "Online"]
        cls.colleges = [
            "Kumaraguru College of Technology",
            "PSG College of Technology",
            "IIT Madras",
            "SRM Institute of Science and Technology",
            "Anna University"
        ]

    def _execute_random_user_request(self, req_id: int):
        num_interactions = random.randint(0, 8)
        interactions = []
        if num_interactions > 0 and self.event_ids:
            sampled_ids = random.sample(self.event_ids, min(num_interactions, len(self.event_ids)))
            for e_id in sampled_ids:
                interactions.append({
                    "event_id": e_id,
                    "interaction_type": random.choice(["view", "bookmark", "register"]),
                    "weight": random.choice([1.0, 3.0, 5.0])
                })

        num_sessions = random.randint(0, 3)
        session_ids = random.sample(self.event_ids, min(num_sessions, len(self.event_ids))) if num_sessions > 0 else None
        user_city = random.choice(self.cities) if random.random() > 0.3 else None
        user_college = random.choice(self.colleges) if random.random() > 0.3 else None

        t0 = time.perf_counter()
        res = self.recommender.get_user_recommendations(
            user_interactions=interactions,
            session_event_ids=session_ids,
            user_city=user_city,
            user_college=user_college,
            limit=8
        )
        latency_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "req_id": req_id,
            "success": res.get("success", False),
            "recs_count": len(res.get("recommendations", [])),
            "latency_ms": latency_ms
        }

    def test_100_concurrent_requests_load_and_latency(self):
        total_requests = 100
        concurrency = 8

        # Warm-up single call
        self._execute_random_user_request(0)

        print(f"\n==========================================================================")
        print(f"   Executing High-Concurrency Stress Test ({total_requests} requests, pool={concurrency})   ")
        print(f"==========================================================================")

        results = []
        t_start = time.perf_counter()

        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(self._execute_random_user_request, i) for i in range(total_requests)]
            for future in as_completed(futures):
                results.append(future.result())

        total_wall_clock_time = (time.perf_counter() - t_start) * 1000.0

        successes = [r for r in results if r["success"] and r["recs_count"] > 0]
        latencies = [r["latency_ms"] for r in results]
        avg_latency = sum(latencies) / len(latencies)
        p95_latency = sorted(latencies)[int(0.95 * len(latencies))]
        p99_latency = sorted(latencies)[int(0.99 * len(latencies))]
        min_lat = min(latencies)
        max_lat = max(latencies)

        print(f"Results Summary:")
        print(f"  • Total Requests Completed : {len(results)} / {total_requests}")
        print(f"  • Success Rate             : {(len(successes)/total_requests)*100:.1f}% (Zero Failures)")
        print(f"  • Total Wall-Clock Time    : {total_wall_clock_time:.2f} ms")
        print(f"  • Average Request Latency  : {avg_latency:.2f} ms")
        print(f"  • Min / Max Latency        : {min_lat:.2f} ms / {max_lat:.2f} ms")
        print(f"  • P95 / P99 Latency        : {p95_latency:.2f} ms / {p99_latency:.2f} ms")
        print(f"  • Throughput               : {(total_requests / (total_wall_clock_time / 1000.0)):.1f} req/sec")
        print(f"==========================================================================\n")

        # Assertions
        self.assertEqual(len(successes), total_requests, "All 100 concurrent requests must succeed.")
        self.assertLess(avg_latency, 20.0, f"Average latency ({avg_latency:.2f}ms) must remain below 20ms.")


if __name__ == "__main__":
    unittest.main()
