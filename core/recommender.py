"""
HackGuru - Unified Production Recommender System (Track 2.1)
Provides:
1. Dynamic User Vector Profile (Barycenter with Dwell Time Multipliers).
2. Transient Session Vector Blending via Redis / Client Cache in RAM:
   V_active = 0.60 * V_session + 0.40 * V_u
3. Multi-Factor Linear Scoring:
   Score = (0.50 * Sim) + (0.25 * LocMatch) + (0.15 * Pop) + (0.10 * Fresh) - Penalty
4. 15% Epsilon-Greedy Exploration (Filter Bubble Burst with Rating >= 4.7).
5. Deterministic Explainability & Evidence Badge Generation.
"""

import math
import json
import time
import datetime
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Set
from core.vector_store import InMemoryVectorStore

# Safe optional Redis import
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


def compute_dwell_weight(dwell_seconds: float) -> float:
    """
    Computes behavioral weight multiplier based on interaction dwell time:
    - Base: w = 1.0 (<= 10s)
    - Medium Engagement (> 10s): w = 1.5
    - High Engagement (> 30s): w = 2.0
    - Deep Engagement (> 60s): w = 2.5 (max)
    """
    try:
        s = float(dwell_seconds)
    except (TypeError, ValueError):
        return 1.0

    if s > 60.0:
        return 2.5
    if s > 30.0:
        return 2.0
    if s > 10.0:
        return 1.5
    return 1.0


def fetch_redis_session(
    user_id: str,
    client: Any = None,
    host: str = "localhost",
    port: int = 6379,
    db: int = 0
) -> Dict[str, Any]:
    """
    Safely retrieves transient session clicks and dwell times from Redis.
    Key: session:{user_id}
    Returns fallback empty dictionary if Redis is unreachable or key is absent.
    """
    if not user_id:
        return {"session_event_ids": [], "dwell_times": {}}

    r_client = client
    if r_client is None and REDIS_AVAILABLE:
        try:
            r_client = redis.Redis(
                host=host,
                port=port,
                db=db,
                socket_timeout=0.05,
                socket_connect_timeout=0.05
            )
        except Exception:
            return {"session_event_ids": [], "dwell_times": {}}

    if r_client is None:
        return {"session_event_ids": [], "dwell_times": {}}

    try:
        raw_val = r_client.get(f"session:{user_id}")
        if not raw_val:
            return {"session_event_ids": [], "dwell_times": {}}
        if isinstance(raw_val, bytes):
            raw_val = raw_val.decode("utf-8")
        data = json.loads(raw_val)
        if isinstance(data, list):
            return {"session_event_ids": data, "dwell_times": {}}
        if isinstance(data, dict):
            return {
                "session_event_ids": data.get("session_event_ids", []),
                "dwell_times": data.get("dwell_times", {})
            }
    except Exception:
        pass

    return {"session_event_ids": [], "dwell_times": {}}


def generate_evidence_badge(
    event: Dict[str, Any],
    sim_score: float,
    loc_match: float,
    is_exploration: bool,
    is_registered: bool = False,
    user_college: Optional[str] = None
) -> str:
    """
    Deterministic decision tree for student-facing explainability badges:
    1. Exploration Slot -> "Explore Something New: Popular in {Category}"
    2. Already Registered -> "Already Registered"
    3. College Match -> "Trending at your college ({College})"
    4. Local Offline Match -> "Happening locally in {Location}"
    5. High Semantic Affinity -> "Matches your interest in {Category} & {TopTag}"
    6. Default Fallback -> "Trending on AllCollegeEvent.com"
    """
    cat = event.get("category", "Events")
    if is_exploration:
        return f"Explore Something New: Popular in {cat}"
    if is_registered:
        return "Already Registered"

    ev_college = str(event.get("college") or "").strip()
    if user_college and ev_college and (user_college.lower() in ev_college.lower() or ev_college.lower() in user_college.lower()):
        return f"Trending at your college ({ev_college})"

    if loc_match == 1.0 and str(event.get("mode", "")).upper() == "OFFLINE":
        loc = event.get("location", "your area")
        return f"Happening locally in {loc}"

    if sim_score >= 0.65:
        tags = event.get("tags") or []
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except Exception:
                tags = []
        top_tag = tags[0] if tags else cat
        return f"Matches your interest in {cat} & {top_tag}"

    return "Trending on AllCollegeEvent.com"


class Recommender:
    """
    Unified production recommender for HackGuru.
    Fuses dense vector similarity with user behavioral telemetry,
    Redis transient session blending, and 15% epsilon-greedy exploration.
    """

    def __init__(self, events: Optional[List[Dict[str, Any]]] = None, vector_store: Optional[InMemoryVectorStore] = None):
        self.events: Dict[int, Dict[str, Any]] = {int(e["id"]): dict(e) for e in (events or [])}
        self.vector_store: InMemoryVectorStore = vector_store or InMemoryVectorStore()
        self._rebuild_index_map()

    def _rebuild_index_map(self) -> None:
        if self.vector_store and len(self.vector_store.event_ids) > 0:
            self._id_to_idx: Dict[int, int] = {int(eid): i for i, eid in enumerate(self.vector_store.event_ids)}
        else:
            self._id_to_idx: Dict[int, int] = {}

    def update_events(self, events: List[Dict[str, Any]]) -> None:
        self.events = {int(e["id"]): dict(e) for e in events}
        self.vector_store.load_from_db()
        self._rebuild_index_map()

    def synthesize_user_vector(
        self,
        user_interactions: Optional[List[Dict[str, Any]]],
        dwell_times: Optional[Dict[str, float]] = None
    ) -> Optional[np.ndarray]:
        """
        Synthesizes dynamic user barycenter vector from past interactions:
        V_u = sum(w_i * V_{e_i}) / sum(w_i)
        Weights: view=1.0 * dwell_multiplier, bookmark=3.0, register=5.0
        """
        if not user_interactions:
            return None

        dwell_times = dwell_times or {}
        numerator = np.zeros(self.vector_store.embedding_dim, dtype=np.float32)
        denominator = 0.0

        for item in user_interactions:
            try:
                e_id = int(item.get("event_id"))
            except (TypeError, ValueError):
                continue

            itype = str(item.get("interaction_type", "view")).lower()
            base_w = float(item.get("weight", 1.0))

            if itype == "register":
                w = max(base_w, 5.0)
            elif itype == "bookmark":
                w = max(base_w, 3.0)
            else:
                dwell_sec = dwell_times.get(str(e_id), 0.0)
                w = base_w * compute_dwell_weight(dwell_sec)

            idx = self._id_to_idx.get(e_id)
            if idx is not None and idx < len(self.vector_store.matrix):
                numerator += self.vector_store.matrix[idx] * w
                denominator += w

        if denominator <= 0.0:
            return None

        u_vec = numerator / denominator
        norm = np.linalg.norm(u_vec)
        return (u_vec / norm).astype(np.float32) if norm > 0 else None

    def blend_session_vector(
        self,
        user_vec: Optional[np.ndarray],
        session_event_ids: Optional[List[int]],
        dwell_times: Optional[Dict[str, float]] = None
    ) -> Optional[np.ndarray]:
        """
        Blends recent in-session clicks with historical user vector in RAM:
        V_active = 0.60 * V_session + 0.40 * V_u
        """
        session_vecs = []
        dwell_times = dwell_times or {}

        if session_event_ids:
            for s_id in session_event_ids[-3:]:  # Sliding window of last 3 clicks
                try:
                    s_int = int(s_id)
                except (TypeError, ValueError):
                    continue
                idx = self._id_to_idx.get(s_int)
                if idx is not None and idx < len(self.vector_store.matrix):
                    dwell = dwell_times.get(str(s_int), 0.0)
                    w = compute_dwell_weight(dwell)
                    session_vecs.append(self.vector_store.matrix[idx] * w)

        if not session_vecs and user_vec is None:
            return None
        if not session_vecs:
            return user_vec

        v_session = np.sum(session_vecs, axis=0)
        norm_s = np.linalg.norm(v_session)
        if norm_s > 0:
            v_session /= norm_s

        if user_vec is None:
            return v_session.astype(np.float32)

        v_active = (0.60 * v_session) + (0.40 * user_vec)
        norm_a = np.linalg.norm(v_active)
        return (v_active / norm_a).astype(np.float32) if norm_a > 0 else user_vec

    def compute_multifactor_score(
        self,
        event: Dict[str, Any],
        v_active: Optional[np.ndarray],
        sim: float = 0.50,
        user_city: Optional[str] = None,
        registered_ids: Optional[Set[int]] = None,
        max_pop: float = 10000.0,
        ref_date: Optional[datetime.date] = None
    ) -> Tuple[float, float, float]:
        """
        Exact Multi-Factor Scoring Formula:
        Score = (0.50 * Sim) + (0.25 * LocMatch) + (0.15 * Pop) + (0.10 * Fresh) - Penalty
        Returns (final_score, semantic_similarity, loc_match)
        """
        e_id = int(event["id"])
        registered_ids = registered_ids or set()

        # Location Match
        mode = str(event.get("mode", "")).upper()
        ev_loc = str(event.get("location", ""))
        if mode == "ONLINE" or (user_city and user_city.lower() in ev_loc.lower()):
            loc_match = 1.0
        else:
            loc_match = 0.35

        # Popularity Prior
        views = float(event.get("views_count", 0))
        regs = float(event.get("registrations_count", 0))
        pop = math.log(1.0 + views + 3.0 * regs) / math.log(1.0 + max_pop)
        pop = max(0.0, min(1.0, pop))

        # Freshness
        fresh = 0.80
        start_date_str = event.get("start_date")
        if start_date_str:
            try:
                ev_date = datetime.datetime.strptime(str(start_date_str)[:10], "%Y-%m-%d").date()
                curr_date = ref_date or datetime.date.today()
                diff_days = abs((ev_date - curr_date).days)
                fresh = 1.0 / (1.0 + 0.05 * diff_days)
            except Exception:
                fresh = 0.80

        # Penalty
        penalty = 1.0 if e_id in registered_ids else 0.0

        final_score = (0.50 * sim) + (0.25 * loc_match) + (0.15 * pop) + (0.10 * fresh) - penalty
        return final_score, sim, loc_match

    def get_similar_events(self, event_id: int, limit: int = 6) -> List[Dict[str, Any]]:
        """Finds top-N most similar events using semantic vector + metadata affinity."""
        target = self.events.get(int(event_id))
        if not target:
            return []

        target_idx = self._id_to_idx.get(int(event_id))
        has_target_vec = target_idx is not None and target_idx < len(self.vector_store.matrix)
        target_vec = self.vector_store.matrix[target_idx] if has_target_vec else None

        if has_target_vec:
            all_sims = np.dot(self.vector_store.matrix, target_vec)
        else:
            all_sims = None

        scored = []
        for e_id, event in self.events.items():
            if e_id == int(event_id):
                continue

            semantic_sim = 0.50
            if all_sims is not None:
                doc_idx = self._id_to_idx.get(e_id)
                if doc_idx is not None and doc_idx < len(all_sims):
                    semantic_sim = float(all_sims[doc_idx])

            meta_boost = 0.0
            if event.get("category") == target.get("category"):
                meta_boost += 0.30
            if event.get("location") == target.get("location"):
                meta_boost += 0.20
            if event.get("mode") == target.get("mode"):
                meta_boost += 0.10

            score = (semantic_sim * 0.60) + meta_boost + min(float(event.get("views_count", 0)) / 20000.0, 0.05)
            match_pct = max(40, min(99, int((score / 1.15) * 100)))

            scored.append({
                "event": event,
                "score": round(score, 4),
                "semantic_similarity": round(semantic_sim, 4),
                "match_percentage": match_pct,
                "reason": f"{match_pct}% match • {event.get('category')} in {event.get('location')}",
                "algorithm": "hybrid_semantic_recommender"
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

    def get_user_recommendations(
        self,
        user_interactions: Optional[List[Dict[str, Any]]] = None,
        session_event_ids: Optional[List[int]] = None,
        user_city: Optional[str] = None,
        user_college: Optional[str] = None,
        registered_ids: Optional[Set[int]] = None,
        limit: int = 8,
        redis_client: Any = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates personalized recommendations using:
        - Redis/In-Memory Session Vector Blending (V_active = 0.60*V_session + 0.40*V_u)
        - Multi-Factor Scoring with Exact Blueprint Weights
        - 15% Epsilon-Greedy Exploration (Bursting Filter Bubbles with Rating >= 4.7)
        - Deterministic Evidence Badges
        """
        start_time = time.time()
        registered_ids = registered_ids or set()

        # Fetch Redis session if user_id is provided and session_event_ids not explicitly given
        dwell_times = {}
        if user_id and redis_client is not None:
            redis_data = fetch_redis_session(user_id, client=redis_client)
            if not session_event_ids and redis_data.get("session_event_ids"):
                session_event_ids = redis_data["session_event_ids"]
            dwell_times = redis_data.get("dwell_times", {})

        # Step 1: Synthesize Dynamic User Profile and Active Vector
        u_vec = self.synthesize_user_vector(user_interactions, dwell_times=dwell_times)
        v_active = self.blend_session_vector(u_vec, session_event_ids, dwell_times=dwell_times)

        # Precompute all vector similarities in one single BLAS matrix multiply (O(1))
        if v_active is not None and len(self.vector_store.matrix) > 0:
            all_sims = np.dot(self.vector_store.matrix, v_active)
        else:
            all_sims = None

        # User historical categories to support 15% exploration filter
        user_cats = set()
        if user_interactions:
            for item in user_interactions:
                e_id = item.get("event_id")
                if e_id in self.events:
                    user_cats.add(self.events[e_id].get("category"))
        if session_event_ids:
            for s_id in session_event_ids:
                if s_id in self.events:
                    user_cats.add(self.events[s_id].get("category"))

        # Step 2: Score all candidate events in O(N)
        scored_candidates = []
        for e_id, event in self.events.items():
            sim = 0.50
            if all_sims is not None:
                doc_idx = self._id_to_idx.get(e_id)
                if doc_idx is not None and doc_idx < len(all_sims):
                    sim = float(all_sims[doc_idx])

            final_score, sim, loc_match = self.compute_multifactor_score(
                event=event,
                v_active=v_active,
                sim=sim,
                user_city=user_city,
                registered_ids=registered_ids
            )
            scored_candidates.append({
                "id": e_id,
                "event": event,
                "score": final_score,
                "sim": sim,
                "loc_match": loc_match,
                "category": event.get("category", "")
            })

        scored_candidates.sort(key=lambda x: x["score"], reverse=True)

        # Step 3: 15% Epsilon-Greedy Exploration Partitioning
        exploit_slots = limit - 1 if limit > 1 else 1
        exploit_picks = [c for c in scored_candidates if c["id"] not in registered_ids][:exploit_slots]
        exploit_ids = {c["id"] for c in exploit_picks}

        # Select exploration candidate from unrepresented category with Rating >= 4.7
        explore_candidates = [
            c for c in scored_candidates
            if c["id"] not in registered_ids
            and c["id"] not in exploit_ids
            and c["category"] not in user_cats
            and float(c["event"].get("rating", 0.0)) >= 4.7
        ]

        # Fallback if no unrepresented category matches rating requirement
        if not explore_candidates:
            explore_candidates = [
                c for c in scored_candidates
                if c["id"] not in registered_ids and c["id"] not in exploit_ids
            ]

        final_slate = exploit_picks
        if explore_candidates and limit > 1:
            explore_pick = dict(explore_candidates[0])
            explore_pick["is_exploration"] = True
            final_slate.append(explore_pick)

        # Step 4: Construct Output Payload with Evidence Badges
        results = []
        for item in final_slate[:limit]:
            ev = item["event"]
            e_id = item["id"]
            is_exp = item.get("is_exploration", False)
            sim_score = item["sim"]
            loc_match = item["loc_match"]

            match_pct = max(45, min(99, int(max(0.0, item["score"] + 0.35) * 100)))
            badge = generate_evidence_badge(
                event=ev,
                sim_score=sim_score,
                loc_match=loc_match,
                is_exploration=is_exp,
                is_registered=e_id in registered_ids,
                user_college=user_college
            )

            results.append({
                "event": ev,
                "score": round(item["score"], 4),
                "semantic_similarity": round(sim_score, 4),
                "match_percentage": match_pct,
                "reason": badge,
                "badge": badge,
                "is_exploration": is_exp,
                "algorithm": "hybrid_semantic_feed"
            })

        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "success": True,
            "algorithm": "hybrid_semantic_feed",
            "recommendations": results,
            "latency_ms": latency_ms,
            "strategy": "Two-Stage Candidate Projection + Session Vector Blending + 15% Epsilon Exploration"
        }


# Aliases for backward compatibility
AIRecommender = Recommender
DefaultRecommender = Recommender
