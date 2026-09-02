"""
HackGuru - In-Memory Vector Store & Conversational Query Parser
Handles:
1. Slot-filling & parameter extraction (category, location, mode, fee, date window, residual keywords).
2. RAM-based Vector Store using contiguous float32 NumPy matrix loaded from SQLite BLOBs.
3. Fast SIMD Cosine Similarity calculation (< 0.3ms).
4. Candidate shortlisting, scoring, and structured highlights extraction.
"""

import re
import json
import time
import datetime
import numpy as np
import sqlite3
from core.embedder import ONNXEmbedder, create_event_embedding_text
from core.db import get_db_connection


KNOWN_CATEGORIES = {
    "hackathon": "Hackathon",
    "hackathons": "Hackathon",
    "hack": "Hackathon",
    "codathon": "Hackathon",
    "workshop": "Workshop",
    "workshops": "Workshop",
    "bootcamp": "Workshop",
    "training": "Workshop",
    "sttp": "Workshop",
    "conference": "Conference",
    "conferences": "Conference",
    "symposium": "Conference",
    "contest": "Contest",
    "contests": "Contest",
    "competition": "Contest",
    "challenge": "Contest",
    "internship": "Internship",
    "internships": "Internship",
    "intern": "Internship",
    "sports": "Sports",
    "cultural": "Cultural",
    "academic": "Academic & Professional"
}

KNOWN_LOCATIONS = {
    "chennai": "Chennai",
    "coimbatore": "Coimbatore",
    "bengaluru": "Bengaluru",
    "bangalore": "Bengaluru",
    "delhi": "New Delhi",
    "new delhi": "New Delhi",
    "mumbai": "Mumbai",
    "hyderabad": "Hyderabad",
    "pune": "Pune",
    "madurai": "Madurai",
    "erode": "Erode",
    "perundurai": "Perundurai",
    "online": "Online",
    "remote": "Online",
    "virtual": "Online"
}

KNOWN_MODES = {
    "online": "ONLINE",
    "virtual": "ONLINE",
    "remote": "ONLINE",
    "offline": "OFFLINE",
    "in-person": "OFFLINE",
    "physical": "OFFLINE",
    "on-campus": "OFFLINE",
    "hybrid": "HYBRID"
}


def extract_query_parameters(raw_query: str, ref_date: datetime.date = None):
    """
    Deconstructs conversational natural language query into structured parameters
    and extracts stripped residual keywords for semantic vector embedding.
    """
    ref_date = ref_date or datetime.date.today()
    q = (raw_query or "").strip()
    q_lower = q.lower()

    applied_filters = {}
    tokens_to_strip = []

    # 1. Extract Category
    detected_category = None
    for kw, cat_name in KNOWN_CATEGORIES.items():
        pattern = r'\b' + re.escape(kw) + r'\b'
        match = re.search(pattern, q_lower)
        if match:
            detected_category = cat_name
            tokens_to_strip.append(match.group(0))
            break
    if detected_category:
        applied_filters["category"] = detected_category

    # 2. Extract Location
    detected_loc = None
    for kw, loc_name in KNOWN_LOCATIONS.items():
        pattern = r'\b' + re.escape(kw) + r'\b'
        match = re.search(pattern, q_lower)
        if match:
            detected_loc = loc_name
            tokens_to_strip.append(match.group(0))
            break
    if detected_loc:
        applied_filters["location"] = detected_loc

    # 3. Extract Mode
    detected_mode = None
    for kw, mode_name in KNOWN_MODES.items():
        pattern = r'\b' + re.escape(kw) + r'\b'
        match = re.search(pattern, q_lower)
        if match:
            detected_mode = mode_name
            tokens_to_strip.append(match.group(0))
            break
    if detected_mode:
        applied_filters["mode"] = detected_mode

    # 4. Extract Price / Fee Filter
    if re.search(r'\b(free|zero fee|no fee|no cost|free of cost)\b', q_lower):
        applied_filters["is_free"] = True
        for m in re.finditer(r'\b(free|zero fee|no fee|no cost|free of cost)\b', q_lower):
            tokens_to_strip.append(m.group(0))
    elif re.search(r'\b(paid|stipend|cash prize)\b', q_lower):
        for m in re.finditer(r'\b(paid|stipend)\b', q_lower):
            tokens_to_strip.append(m.group(0))

    # 5. Extract Date Window
    date_min = None
    date_max = None
    if "this month" in q_lower:
        date_min = ref_date.replace(day=1).isoformat()
        next_month = (ref_date.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
        date_max = (next_month - datetime.timedelta(days=1)).isoformat()
        tokens_to_strip.append("this month")
    elif "next month" in q_lower:
        next_month = (ref_date.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
        date_min = next_month.isoformat()
        following_month = (next_month.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
        date_max = (following_month - datetime.timedelta(days=1)).isoformat()
        tokens_to_strip.append("next month")

    if date_min and date_max:
        applied_filters["date_range"] = {
            "start": date_min,
            "end": date_max,
            "label": "this month" if "this month" in q_lower else "specified_window"
        }

    # 6. Audience
    for audience in ["engineering students", "computer science", "college students", "freshers", "school students", "beginners"]:
        if audience in q_lower:
            applied_filters["eligibility"] = audience
            tokens_to_strip.append(audience)
            break

    # 7. Strip out stopwords and extracted tokens to isolate residual semantic keywords
    filler_words = [
        "find", "search", "show me", "show", "give me", "list", "get", "explore",
        "looking for", "events", "event", "competitions", "competition", "hackathons",
        "hackathon", "workshops", "workshop", "contests", "contest", "for", "in", "at",
        "under", "with", "near", "best", "top", "all", "any", "please", "can you",
        "this month", "next month", "today", "tomorrow", "this week"
    ]

    cleaned_q = re.sub(r'[^a-zA-Z0-9\s\-_+#]', ' ', q_lower)
    residual = f" {cleaned_q} "

    for phrase in sorted(tokens_to_strip + filler_words, key=len, reverse=True):
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(phrase) + r'(?![a-zA-Z0-9])'
        residual = re.sub(pattern, ' ', residual)

    residual_keywords = " ".join(residual.split()).strip()

    return {
        "raw_query": q,
        "residual_keywords": residual_keywords or q,
        "applied_filters": applied_filters
    }


class InMemoryVectorStore:
    """
    RAM-based Vector Store for ultra-low latency semantic search.
    Loads L2-normalized float32 embeddings directly from SQLite BLOBs into memory.
    """

    def __init__(self, embedding_dim=384):
        self.embedding_dim = embedding_dim
        self.embedder = ONNXEmbedder()
        self.event_ids = np.array([], dtype=np.int64)
        self.matrix = np.empty((0, embedding_dim), dtype=np.float32)
        self.events_dict = {}
        self._query_vector_cache = {}
        self.load_from_db()

    def _get_query_vector(self, text: str) -> np.ndarray:
        norm_text = text.lower().strip()
        if norm_text in self._query_vector_cache:
            return self._query_vector_cache[norm_text]
        vec = self.embedder.encode(norm_text)[0]
        if len(self._query_vector_cache) > 2000:
            self._query_vector_cache.clear()
        self._query_vector_cache[norm_text] = vec
        return vec

    def load_from_db(self, db_path=None):
        """Loads all events and embeddings from SQLite into contiguous RAM memory."""
        start_time = time.time()
        conn = get_db_connection(db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM events")
        events_rows = [dict(r) for r in cursor.fetchall()]
        self.events_dict = {e["id"]: e for e in events_rows}

        # Check existing embeddings
        cursor.execute("SELECT event_id, embedding FROM event_embeddings")
        existing = {r["event_id"]: np.frombuffer(r["embedding"], dtype=np.float32) for r in cursor.fetchall()}

        # Generate missing embeddings if any
        missing_events = [e for e in events_rows if e["id"] not in existing or len(existing[e["id"]]) != self.embedding_dim]
        if missing_events:
            texts = [create_event_embedding_text(e) for e in missing_events]
            vectors = self.embedder.encode(texts)
            for e, v in zip(missing_events, vectors):
                blob = v.astype(np.float32).tobytes()
                cursor.execute("INSERT OR REPLACE INTO event_embeddings (event_id, embedding) VALUES (?, ?)", (e["id"], blob))
                existing[e["id"]] = v
            conn.commit()

        ids = []
        vecs = []
        for e_id in sorted(self.events_dict.keys()):
            if e_id in existing:
                ids.append(e_id)
                vecs.append(existing[e_id])

        self.event_ids = np.array(ids, dtype=np.int64)
        if vecs:
            self.matrix = np.vstack(vecs).astype(np.float32)
            norms = np.linalg.norm(self.matrix, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            self.matrix = self.matrix / norms
        else:
            self.matrix = np.empty((0, self.embedding_dim), dtype=np.float32)

        conn.close()
        load_ms = round((time.time() - start_time) * 1000, 2)
        print(f"[InMemoryVectorStore] Loaded {len(self.event_ids)} vectors into RAM in {load_ms}ms.")

    def search(self, raw_query: str, top_k: int = 20, strict_filters: bool = False):
        start_time = time.time()
        parsed = extract_query_parameters(raw_query)
        applied_filters = parsed["applied_filters"]
        residual_text = parsed["residual_keywords"]

        if len(self.event_ids) == 0:
            return {
                "query": raw_query,
                "parsed": parsed,
                "total_count": 0,
                "results": [],
                "latency_ms": 0.0
            }

        query_vec = self._get_query_vector(residual_text)
        sim_scores = np.dot(self.matrix, query_vec)

        scored_candidates = []
        for idx, (event_id, base_sim) in enumerate(zip(self.event_ids, sim_scores)):
            event = self.events_dict.get(int(event_id))
            if not event:
                continue

            score = float(base_sim)
            filter_match_reasons = []

            # Category filter boost
            if "category" in applied_filters:
                req_cat = applied_filters["category"].lower()
                event_cat = event["category"].lower()
                event_title = event["title"].lower()
                if req_cat in event_cat or req_cat in event_title:
                    score += 0.30
                    filter_match_reasons.append(f"Category: {event['category']}")
                elif strict_filters:
                    continue

            # Location filter boost
            if "location" in applied_filters:
                req_loc = applied_filters["location"].lower()
                event_loc = event["location"].lower()
                if req_loc in event_loc or (req_loc == "online" and event["mode"].upper() == "ONLINE"):
                    score += 0.25
                    filter_match_reasons.append(f"Location: {event['location']}")
                elif strict_filters:
                    continue

            # Mode filter boost
            if "mode" in applied_filters:
                if event["mode"].upper() == applied_filters["mode"]:
                    score += 0.20
                    filter_match_reasons.append(f"Mode: {event['mode']}")
                elif strict_filters:
                    continue

            # Free filter
            if applied_filters.get("is_free"):
                if event["price"].lower() == "free" or event.get("price_numeric", 0) == 0:
                    score += 0.20
                    filter_match_reasons.append("Free Registration")
                elif strict_filters:
                    continue

            # Date window
            if "date_range" in applied_filters:
                dr = applied_filters["date_range"]
                e_start = event.get("start_date") or "9999-99-99"
                if dr["start"] <= e_start <= dr["end"]:
                    score += 0.20
                    filter_match_reasons.append(f"Date: {dr['label']}")

            # Exact title phrase boost
            if raw_query.lower().strip() in event["title"].lower():
                score += 0.50
                filter_match_reasons.append("Exact Title Match")

            # Quality prior
            score += min(event.get("views_count", 0) / 10000.0, 0.05)

            structured_highlights = {
                "eligibility": event.get("eligibility", "Open to all college students"),
                "prizes": event.get("prize_pool", "Certificates"),
                "date": event.get("date", "2026"),
                "location": event.get("location", "India"),
                "mode": event.get("mode", "OFFLINE"),
                "price": event.get("price", "Free")
            }

            match_pct = max(10, min(99, int((score + 0.5) / 1.5 * 100)))

            scored_candidates.append({
                "event": event,
                "score": round(score, 4),
                "semantic_similarity": round(float(base_sim), 4),
                "match_percentage": match_pct,
                "structured_highlights": structured_highlights,
                "match_reasons": filter_match_reasons or [f"Semantic Relevance: {match_pct}%"]
            })

        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        latency_ms = round((time.time() - start_time) * 1000, 3)

        return {
            "query": raw_query,
            "parsed": parsed,
            "total_count": len(scored_candidates),
            "results": scored_candidates[:top_k],
            "latency_ms": latency_ms
        }
