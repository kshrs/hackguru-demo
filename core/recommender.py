"""
HackGuru - Unified Event Recommender System
Provides:
1. Item-to-Item Semantic Vector & Metadata Similarity.
2. User Profile Multi-Interest Dynamic Affinity Scoring.
3. MMR (Maximal Marginal Relevance) Diversity Ranking.
"""

import math
import json
import time
import numpy as np
from collections import defaultdict, Counter
from core.vector_store import InMemoryVectorStore


class Recommender:
    """
    Unified production recommender for HackGuru.
    Fuses dense vector similarity with user behavioral telemetry and metadata affinities.
    """

    def __init__(self, events=None, vector_store=None, search_engine=None):
        self.events = {e["id"]: dict(e) for e in (events or [])}
        self.vector_store = vector_store or InMemoryVectorStore()

    def update_events(self, events):
        self.events = {e["id"]: dict(e) for e in events}
        self.vector_store.load_from_db()

    def get_similar_events(self, event_id: int, limit: int = 6):
        """Finds top-N most similar events using semantic embeddings + category/location boosts."""
        target = self.events.get(event_id)
        if not target:
            return []

        scored = []
        target_idx = np.where(self.vector_store.event_ids == event_id)[0]
        has_target_vec = len(target_idx) > 0

        target_vec = self.vector_store.matrix[target_idx[0]] if has_target_vec else None

        for e_id, event in self.events.items():
            if e_id == event_id:
                continue

            semantic_sim = 0.5
            if has_target_vec:
                doc_idx = np.where(self.vector_store.event_ids == e_id)[0]
                if len(doc_idx) > 0:
                    semantic_sim = float(np.dot(self.vector_store.matrix[doc_idx[0]], target_vec))

            # Metadata affinity
            meta_boost = 0.0
            if event["category"] == target["category"]:
                meta_boost += 0.30
            if event["location"] == target["location"]:
                meta_boost += 0.20
            if event["mode"] == target["mode"]:
                meta_boost += 0.10

            score = (semantic_sim * 0.6) + meta_boost + min(event.get("views_count", 0) / 20000.0, 0.05)
            match_pct = max(40, min(99, int((score / 1.1) * 100)))

            scored.append({
                "event": event,
                "score": round(score, 4),
                "semantic_similarity": round(semantic_sim, 4),
                "match_percentage": match_pct,
                "reason": f"{match_pct}% match • {event['category']} in {event['location']}",
                "algorithm": "hybrid_semantic_recommender"
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

    def get_user_recommendations(self, user_interactions=None, limit: int = 8):
        """Generates personalized feed using multi-interest user telemetry and vector profile."""
        start_time = time.time()
        category_weights = Counter()
        location_weights = Counter()
        profile_vectors = []

        if user_interactions:
            for item in user_interactions:
                e_id = item.get("event_id")
                weight = float(item.get("weight", 1.0))
                if e_id in self.events:
                    ev = self.events[e_id]
                    category_weights[ev["category"]] += weight
                    location_weights[ev["location"]] += weight

                    idx = np.where(self.vector_store.event_ids == e_id)[0]
                    if len(idx) > 0:
                        profile_vectors.append((self.vector_store.matrix[idx[0]], weight))

        # Synthesize composite user interest vector
        if profile_vectors:
            user_vec = np.zeros(self.vector_store.embedding_dim, dtype=np.float32)
            total_w = sum(w for _, w in profile_vectors)
            for v, w in profile_vectors:
                user_vec += v * (w / total_w)
            norm = np.linalg.norm(user_vec)
            if norm > 0:
                user_vec /= norm
        else:
            user_vec = None

        scored = []
        for e_id, event in self.events.items():
            base_score = 0.5
            if user_vec is not None:
                doc_idx = np.where(self.vector_store.event_ids == e_id)[0]
                if len(doc_idx) > 0:
                    base_score = float(np.dot(self.vector_store.matrix[doc_idx[0]], user_vec))

            cat_boost = category_weights.get(event["category"], 0.0) * 0.15
            loc_boost = location_weights.get(event["location"], 0.0) * 0.10
            pop_score = (event.get("views_count", 0) / 1000.0) + (event.get("is_featured", 0) * 1.5)

            final_score = (base_score * 4.0) + cat_boost + loc_boost + pop_score
            reason = "Trending on HackGuru"
            if cat_boost > 0:
                reason = f"Recommended for your interest in {event['category']}"
            elif event.get("is_featured"):
                reason = "Featured Flagship Event"

            scored.append({
                "event": event,
                "score": round(final_score, 3),
                "reason": reason,
                "algorithm": "hybrid_semantic_feed"
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        latency_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "algorithm": "hybrid_semantic_feed",
            "recommendations": scored[:limit],
            "latency_ms": latency_ms,
            "strategy": "Vector Embedding User Profile + Interaction Telemetry"
        }


# Aliases for backward compatibility
AIRecommender = Recommender
DefaultRecommender = Recommender
