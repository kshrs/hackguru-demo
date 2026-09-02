"""
Tests for benchmark evaluation script.
"""

import unittest
from core.benchmark import run_benchmark


class TestBenchmark(unittest.TestCase):
    def test_benchmark_run(self):
        results = run_benchmark()
        self.assertIn("avg_default_latency_ms", results)
        self.assertIn("avg_ai_latency_ms", results)
        self.assertIn("avg_default_mrr", results)
        self.assertIn("avg_ai_mrr", results)
        self.assertGreaterEqual(results["avg_ai_mrr"], results["avg_default_mrr"])


if __name__ == "__main__":
    unittest.main()
