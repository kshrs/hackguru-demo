import os
import sys
import time
import json
import math

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.db import seed_db, get_db_connection
from core.search import DefaultSearchEngine, AISearchEngine
from core.recommender import DefaultRecommender, AIRecommender


BENCHMARK_TEST_SUITE = [
    {
        "query": "hackathon in coimbatore",
        "expected_categories": ["Hackathon"],
        "expected_locations": ["Coimbatore"],
        "expected_slugs": ["hackguru-2026", "corexathon-2026", "hack-the-horizon-2-0-24-hour-hackathon"]
    },
    {
        "query": "agentic ai autonomous agents llm",
        "expected_categories": ["Hackathon", "Workshop"],
        "expected_slugs": ["5-day-online-short-term-training-programme-sttp-on-building-autonomous-ai-systems-with-agentic-ai-for-research-and-innovation", "hackguru-2026"]
    },
    {
        "query": "chenai aerospace challenge", # Intentional typo in Chennai
        "expected_locations": ["Chennai"],
        "expected_slugs": ["genesis-26-lost-in-space"]
    },
    {
        "query": "free creative uiux design contest stipend",
        "expected_categories": ["Contest", "Internship"],
        "expected_slugs": ["genesis-26-silent-stroke", "ui-ux-designer-intern", "graphic-designer-branding-intern"]
    },
    {
        "query": "smart city civil construction research conference",
        "expected_categories": ["Conference", "Hackathon"],
        "expected_slugs": ["international-conference-on-ai-in-construction-amp-sustainable-built-environment", "smart-india-innovation-hackathon-2026"]
    }
]


def run_benchmark():
    seed_db(force=False)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events")
    events = [dict(r) for r in cursor.fetchall()]
    conn.close()

    default_engine = DefaultSearchEngine(events)
    ai_engine = AISearchEngine(events)

    print("==========================================================================")
    print("      HackGuru Search & Recommendation Algorithm Benchmark Results        ")
    print("==========================================================================")

    total_def_latency = 0.0
    total_ai_latency = 0.0
    def_mrr_total = 0.0
    ai_mrr_total = 0.0

    for idx, test in enumerate(BENCHMARK_TEST_SUITE, 1):
        q = test["query"]
        expected_slugs = set(test["expected_slugs"])

        # Default Engine
        t0 = time.time()
        def_res = default_engine.search(q, limit=6)
        def_lat = (time.time() - t0) * 1000
        total_def_latency += def_lat

        def_slugs = [r["event"]["slug"] for r in def_res["results"]]
        def_rank = None
        for r_idx, s in enumerate(def_slugs, 1):
            if s in expected_slugs:
                def_rank = r_idx
                break
        def_mrr = (1.0 / def_rank) if def_rank else 0.0
        def_mrr_total += def_mrr

        # AI Engine
        t1 = time.time()
        ai_res = ai_engine.search(q, limit=6)
        ai_lat = (time.time() - t1) * 1000
        total_ai_latency += ai_lat

        ai_slugs = [r["event"]["slug"] for r in ai_res["results"]]
        ai_rank = None
        for r_idx, s in enumerate(ai_slugs, 1):
            if s in expected_slugs:
                ai_rank = r_idx
                break
        ai_mrr = (1.0 / ai_rank) if ai_rank else 0.0
        ai_mrr_total += ai_mrr

        print(f"\n[Test Case {idx}] Query: '{q}'")
        print(f"  Expected Top Hits: {list(expected_slugs)}")
        print(f"  • Default Engine : Latency = {def_lat:.2f}ms | MRR = {def_mrr:.2f} | Found: {def_slugs[:2]}")
        print(f"  • AI Engine      : Latency = {ai_lat:.2f}ms | MRR = {ai_mrr:.2f} | Found: {ai_slugs[:2]}")
        if "diagnostics" in ai_res:
            intents = ai_res["diagnostics"].get("detected_intent", {}).get("intents", [])
            print(f"    AI Intent Extracted: {intents}")

    num_tests = len(BENCHMARK_TEST_SUITE)
    avg_def_lat = total_def_latency / num_tests
    avg_ai_lat = total_ai_latency / num_tests
    avg_def_mrr = def_mrr_total / num_tests
    avg_ai_mrr = ai_mrr_total / num_tests

    print("\n--------------------------------------------------------------------------")
    print(f"Summary Metrics ({num_tests} queries):")
    print(f"  • Default Engine Avg Latency: {avg_def_lat:.2f} ms | Mean Reciprocal Rank: {avg_def_mrr:.3f}")
    print(f"  • AI Engine Avg Latency     : {avg_ai_lat:.2f} ms | Mean Reciprocal Rank: {avg_ai_mrr:.3f}")
    print(f"  • AI MRR Improvement       : +{((avg_ai_mrr - avg_def_mrr)/max(0.001, avg_def_mrr))*100:.1f}%")
    print("==========================================================================")

    return {
        "avg_default_latency_ms": round(avg_def_lat, 2),
        "avg_ai_latency_ms": round(avg_ai_lat, 2),
        "avg_default_mrr": round(avg_def_mrr, 3),
        "avg_ai_mrr": round(avg_ai_mrr, 3)
    }


if __name__ == "__main__":
    run_benchmark()
