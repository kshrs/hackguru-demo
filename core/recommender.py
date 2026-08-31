"""
HackGuru - Recommendation System Architecture
Implements both:
1. DefaultRecommender: Rule-based category affinity, geographic proximity, and popularity heuristic.
2. AIRecommender: Multi-interest Dynamic Vector Profile, Item-to-Item Cosine Similarity,
   Maximal Marginal Relevance (MMR) for Diversity, Contextual Decay, and AI Explainability.
"""

import math
import json
import time
from collections import defaultdict, Counter
from core.search import tokenize, get_ngrams


class DefaultRecommender:
    """Standard rule-based recommendation system."""

    def __init__(self, events):
        self.events = {e["id"]: dict(e) for e in events}

    def update_events(self, events):
        self.events = {e["id"]: dict(e) for e in events}

    def get_similar_events(self, event_id, limit=6):
        """Recommends similar events using category and location matching."""
        target = self.events.get(event_id)
        if not target:
            return []

        scored = []
        for e_id, event in self.events.items():
            if e_id == event_id:
                continue

            score = 0.0
            if event["category"] == target["category"]:
                score += 5.0
            if event["location"] == target["location"]:
                score += 3.0
            if event["mode"] == target["mode"]:
                score += 2.0

            # Popularity boost
            score += min(event.get("views_count", 0) / 1000.0, 3.0)

            scored.append({
                "event": event,
                "score": round(score, 2),
                "reason": f"Similar category ({target['category']}) in {target['location']}",
                "algorithm": "default_rule_based"
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

    def get_user_recommendations(self, user_interactions=None, limit=8):
        """Generates recommendations based on user's past interaction categories."""
        start_time = time.time()
        category_counts = Counter()
        location_counts = Counter()

        if user_interactions:
            for item in user_interactions:
                e_id = item.get("event_id")
                weight = item.get("weight", 1.0)
                if e_id in self.events:
                    ev = self.events[e_id]
                    category_counts[ev["category"]] += weight
                    location_counts[ev["location"]] += weight

        top_cat = category_counts.most_common(1)[0][0] if category_counts else None
        top_loc = location_counts.most_common(1)[0][0] if location_counts else None

        scored = []
        for e_id, event in self.events.items():
            score = (event.get("views_count", 0) / 500.0) + (event.get("rating", 4.5) * 2.0)
            reason = "Trending on HackGURU"

            if top_cat and event["category"] == top_cat:
                score += 8.0
                reason = f"Based on your interest in {top_cat}"
            if top_loc and event["location"] == top_loc:
                score += 4.0

            scored.append({
                "event": event,
                "score": round(score, 2),
                "reason": reason,
                "algorithm": "default_collaborative_heuristic"
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        latency_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "algorithm": "default",
            "recommendations": scored[:limit],
            "latency_ms": latency_ms,
            "strategy": "Category Popularity Heuristic"
        }


class AIRecommender:
    """Advanced AI Recommender powered by:
    - User Multi-Interest Vector Profile Synthesis
    - Dense Item-to-Item Cosine Vector Matching
    - Maximal Marginal Relevance (MMR) for Diversity
    - Actionable AI "Why Recommended" Generation
    """

    def __init__(self, events, search_engine=None):
        self.events = {e["id"]: dict(e) for e in events}
        self.search_engine = search_engine
        self.item_vectors = {}
        self.build_item_vectors()

    def build_item_vectors(self):
        """Extracts dense feature vectors for each event from search engine index."""
        if not self.search_engine:
            return

        for e_id, event in self.events.items():
            self.item_vectors[e_id] = self.search_engine.doc_vectors.get(e_id, {})

    def update_events(self, events, search_engine=None):
        self.events = {e["id"]: dict(e) for e in events}
        if search_engine:
            self.search_engine = search_engine
        self.build_item_vectors()

    def compute_cosine_similarity(self, vec_a, vec_b):
        """Computes cosine similarity between two sparse/dense normalized vectors."""
        if not vec_a or not vec_b:
            return 0.0
        return sum(vec_a[k] * vec_b.get(k, 0.0) for k in vec_a)

    def get_similar_events(self, event_id, limit=6):
        """AI Item-to-Item semantic recommendation with deep feature matching."""
        target = self.events.get(event_id)
        if not target:
            return []

        target_vec = self.item_vectors.get(event_id, {})
        target_tags = set(json.loads(target.get("tags") or "[]"))

        candidates = []
        for e_id, event in self.events.items():
            if e_id == event_id:
                continue

            vec = self.item_vectors.get(e_id, {})
            cos_sim = self.compute_cosine_similarity(target_vec, vec)

            # Tag overlap bonus
            cand_tags = set(json.loads(event.get("tags") or "[]"))
            overlap = len(target_tags.intersection(cand_tags))
            tag_boost = min(overlap * 0.15, 0.45)

            # Category & mode synergy
            cat_bonus = 0.2 if event["category"] == target["category"] else 0.0
            loc_bonus = 0.15 if event["location"] == target["location"] else 0.0

            total_ai_score = (0.50 * cos_sim) + tag_boost + cat_bonus + loc_bonus
            match_pct = min(99, max(70, int(total_ai_score * 100 + 45)))

            # Construct human-readable reasoning
            reasons = []
            if overlap > 0:
                reasons.append(f"Shared tags: {', '.join(list(target_tags.intersection(cand_tags))[:2])}")
            if event["category"] == target["category"]:
                reasons.append(f"Matching {event['category']} format")
            if not reasons:
                reasons.append("High semantic affinity in tech stacks")

            candidates.append({
                "event": event,
                "score": round(total_ai_score * 100, 2),
                "semantic_similarity": round(cos_sim, 4),
                "match_percentage": match_pct,
                "reason": f"{match_pct}% Match · {' & '.join(reasons)}",
                "algorithm": "ai_vector_similarity"
            })

        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates[:limit]

    def get_user_recommendations(self, user_interactions=None, limit=8, diversity_lambda=0.72):
        """Generates personalized recommendations using User Preference Vector Synthesis
        and Maximal Marginal Relevance (MMR) for high diversity and novelty.
        """
        start_time = time.time()

        # Step 1: Synthesize User Dynamic Taste Vector
        user_vector = defaultdict(float)
        viewed_event_ids = set()
        interaction_reasons = []

        if user_interactions:
            for idx, item in enumerate(user_interactions):
                e_id = item.get("event_id")
                weight = item.get("weight", 1.0)
                # Recency decay: newer interactions have higher weight
                decay = math.exp(-0.15 * idx)
                effective_weight = weight * decay

                if e_id in self.item_vectors:
                    viewed_event_ids.add(e_id)
                    ev_title = self.events[e_id]["title"]
                    interaction_reasons.append(ev_title)
                    for term, val in self.item_vectors[e_id].items():
                        user_vector[term] += val * effective_weight

        # Normalize user profile vector
        u_norm = math.sqrt(sum(v * v for v in user_vector.values()))
        if u_norm > 0:
            for k in user_vector:
                user_vector[k] /= u_norm

        # Step 2: Score all candidate events
        candidate_pool = []
        for e_id, event in self.events.items():
            vec = self.item_vectors.get(e_id, {})
            relevance = self.compute_cosine_similarity(user_vector, vec) if u_norm > 0 else (event.get("rating", 4.5) / 5.0)

            # Prioritize trending velocity and quality rating
            quality_prior = (event.get("rating", 4.8) / 10.0) + min(event.get("views_count", 0) / 4000.0, 0.3)
            combined_relevance = (0.75 * relevance) + (0.25 * quality_prior)

            candidate_pool.append({
                "id": e_id,
                "event": event,
                "relevance": combined_relevance,
                "vector": vec,
                "is_interacted": e_id in viewed_event_ids
            })

        # Step 3: Maximal Marginal Relevance (MMR) Diversity Selection
        selected = []
        while len(selected) < min(limit, len(candidate_pool)):
            best_cand = None
            best_mmr = -float("inf")

            for cand in candidate_pool:
                if cand in selected:
                    continue

                rel = cand["relevance"]
                # Penalize slightly if already bookmarked/interacted so user discovers new events
                if cand["is_interacted"]:
                    rel *= 0.85

                # Compute maximum similarity to already selected items
                if not selected:
                    sim_to_selected = 0.0
                else:
                    sim_to_selected = max(
                        self.compute_cosine_similarity(cand["vector"], s["vector"])
                        for s in selected
                    )

                # MMR Equation: λ * Rel - (1 - λ) * MaxSim
                mmr_score = (diversity_lambda * rel) - ((1.0 - diversity_lambda) * sim_to_selected)

                if mmr_score > best_mmr:
                    best_mmr = mmr_score
                    best_cand = cand

            if not best_cand:
                break
            selected.append(best_cand)

        # Step 4: Construct AI Reasoning & Badges for each item
        results = []
        for s in selected:
            ev = s["event"]
            match_pct = min(99, max(75, int(s["relevance"] * 100 + 40)))
            tags = json.loads(ev.get("tags") or "[]")
            tag_str = tags[0] if tags else ev["category"]

            if interaction_reasons:
                reason = f"{match_pct}% Match · Aligned with your interest in {interaction_reasons[0]}"
            else:
                reason = f"{match_pct}% AI Affinity · Top {tag_str} in {ev['location']}"

            results.append({
                "event": ev,
                "score": round(s["relevance"] * 100, 2),
                "semantic_similarity": round(s["relevance"], 4),
                "match_percentage": match_pct,
                "reason": reason,
                "algorithm": "ai_mmr_diversity_vector"
            })

        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "algorithm": "ai_mmr_hybrid",
            "recommendations": results,
            "latency_ms": latency_ms,
            "strategy": f"Dynamic User Vector Profile + MMR Diversity (λ={diversity_lambda})"
        }
