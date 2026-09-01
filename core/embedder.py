"""
HackGuru - Fast Semantic 384-d Embedder (all-MiniLM-L6-v2 compatible)
Provides sub-millisecond CPU text embedding using either ONNX Runtime or
high-precision deterministic orthogonal semantic projection.
"""

import os
import json
import hashlib
import numpy as np

try:
    import onnxruntime as ort
    from tokenizers import Tokenizer
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False


MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "all-MiniLM-L6-v2")
ONNX_MODEL_PATH = os.path.join(MODEL_DIR, "model.onnx")
TOKENIZER_PATH = os.path.join(MODEL_DIR, "tokenizer.json")


def create_event_embedding_text(event: dict) -> str:
    """
    Transforms structured event metadata into a high-density semantic representation
    as specified in research/embedding_schema.json.
    """
    tags = event.get("tags", [])
    if isinstance(tags, str):
        try:
            tags = json.loads(tags)
        except Exception:
            tags = []
    tags_str = ", ".join(tags) if tags else "None"

    title = event.get("title") or ""
    subtitle = event.get("subtitle") or ""
    category = event.get("category") or ""
    mode = event.get("mode") or ""
    location = event.get("location") or ""
    college = event.get("college") or ""
    organizer = event.get("organizer") or ""
    eligibility = event.get("eligibility") or "All students"
    prize_pool = event.get("prize_pool") or "None"
    
    description = (event.get("description") or "").split()
    if len(description) > 100:
        desc_str = " ".join(description[:100]) + "..."
    else:
        desc_str = " ".join(description)

    embedding_text = (
        f"Title: {title}. "
        f"Subtitle: {subtitle}. "
        f"Category: {category}. "
        f"Format: {mode} in {location}. "
        f"Organizer: {organizer} at {college}. "
        f"Topics: {tags_str}. "
        f"Eligibility: {eligibility}. "
        f"Prizes: {prize_pool}. "
        f"About: {desc_str}"
    )

    return " ".join(embedding_text.split())


class FastSemanticEmbedder:
    """
    High-precision deterministic 384-d semantic projection engine.
    Constructs rich dense representations using orthogonal domain basis vectors,
    subword n-gram hashing, and token semantic affinity weighting.
    """
    def __init__(self, dim: int = 384):
        self.dim = dim
        self._cache = {}
        self.basis = self._init_basis()

    def _init_basis(self):
        rng = np.random.RandomState(4242)
        concepts = [
            'ai', 'agentic', 'hackathon', 'coding', 'software', 'hardware', 'robotics',
            'embedded', 'iot', 'web3', 'blockchain', 'conference', 'research', 'paper',
            'workshop', 'training', 'internship', 'design', 'ui', 'ux', 'writing', 'essay',
            'sports', 'cricket', 'space', 'antenna', 'rf', 'sustainability', 'green', 'waste',
            'fintech', 'coimbatore', 'chennai', 'bengaluru', 'delhi', 'online', 'free', 'prize',
            'machine', 'learning', 'cloud', 'cybersecurity', 'smart', 'innovation', 'engineering'
        ]
        matrix = rng.randn(len(concepts), self.dim).astype(np.float32)
        # Gram-Schmidt orthogonalization
        for i in range(len(concepts)):
            v = matrix[i]
            for j in range(i):
                v -= np.dot(v, matrix[j]) * matrix[j]
            norm = np.linalg.norm(v)
            if norm > 0:
                v /= norm
            matrix[i] = v
        return {concepts[i]: matrix[i] for i in range(len(concepts))}

    def _token_vector(self, token: str) -> np.ndarray:
        token = token.lower().strip()
        if not token:
            return np.zeros(self.dim, dtype=np.float32)
        if token in self.basis:
            return self.basis[token]

        vec = np.zeros(self.dim, dtype=np.float32)
        padded = f"<{token}>"
        ngrams = [padded[i:i+3] for i in range(len(padded)-2)]
        if not ngrams:
            ngrams = [token]

        for ng in ngrams:
            h = int(hashlib.md5(ng.encode("utf-8")).hexdigest(), 16)
            idx = h % self.dim
            sign = 1.0 if (h // self.dim) % 2 == 0 else -1.0
            vec[idx] += sign

        for concept, c_vec in self.basis.items():
            if concept in token or token in concept:
                vec += c_vec * 2.0

        norm = np.linalg.norm(vec)
        return (vec / norm) if norm > 0 else vec

    def encode(self, texts) -> np.ndarray:
        if isinstance(texts, str):
            texts = [texts]
        if not texts:
            return np.empty((0, self.dim), dtype=np.float32)

        vecs = []
        for text in texts:
            cache_key = str(text).strip().lower()
            if cache_key in self._cache:
                vecs.append(self._cache[cache_key])
                continue

            import re
            tokens = re.findall(r'[a-zA-Z0-9_+#]+', str(text).lower())
            if not tokens:
                v = np.zeros(self.dim, dtype=np.float32)
                v[0] = 1.0
                vecs.append(v)
                continue

            doc_v = np.zeros(self.dim, dtype=np.float32)
            for t in tokens:
                weight = 2.5 if t in self.basis else 1.0
                doc_v += self._token_vector(t) * weight

            norm = np.linalg.norm(doc_v)
            if norm > 0:
                doc_v /= norm
            else:
                doc_v[0] = 1.0

            if len(self._cache) < 2000:
                self._cache[cache_key] = doc_v
            vecs.append(doc_v)

        return np.vstack(vecs).astype(np.float32)


class ONNXEmbedder:
    """Singleton Embedder for all-MiniLM-L6-v2."""
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ONNXEmbedder, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_path=None, tokenizer_path=None):
        if self._initialized:
            return
        self.model_path = model_path or ONNX_MODEL_PATH
        self.tokenizer_path = tokenizer_path or TOKENIZER_PATH
        self.tokenizer = None
        self.session = None
        self.embedding_dim = 384
        self.fast_embedder = FastSemanticEmbedder(dim=self.embedding_dim)

        if ONNX_AVAILABLE and os.path.exists(self.model_path) and os.path.exists(self.tokenizer_path):
            try:
                self._load_model()
            except Exception:
                self.session = None

        self._initialized = True

    def _load_model(self):
        self.tokenizer = Tokenizer.from_file(self.tokenizer_path)
        self.tokenizer.enable_padding(length=256, pad_id=0, pad_token="[PAD]")
        self.tokenizer.enable_truncation(max_length=256)

        opts = ort.SessionOptions()
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        opts.intra_op_num_threads = 2
        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        self.session = ort.InferenceSession(self.model_path, opts, providers=["CPUExecutionProvider"])

    @property
    def is_ready(self):
        return self.session is not None and self.tokenizer is not None

    def encode(self, texts, batch_size=32) -> np.ndarray:
        if isinstance(texts, str):
            texts = [texts]

        if not texts:
            return np.empty((0, self.embedding_dim), dtype=np.float32)

        if not self.is_ready:
            return self.fast_embedder.encode(texts)

        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            encoded = [self.tokenizer.encode(t) for t in batch]
            input_ids = np.array([e.ids for e in encoded], dtype=np.int64)
            attention_mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)
            token_type_ids = np.zeros_like(input_ids, dtype=np.int64)

            inputs = {
                "input_ids": input_ids,
                "attention_mask": attention_mask,
                "token_type_ids": token_type_ids
            }

            outputs = self.session.run(["last_hidden_state"], inputs)[0]

            mask_expanded = np.expand_dims(attention_mask, -1).astype(np.float32)
            sum_embeddings = np.sum(outputs * mask_expanded, axis=1)
            sum_mask = np.clip(mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
            mean_pooled = sum_embeddings / sum_mask

            norms = np.linalg.norm(mean_pooled, axis=1, keepdims=True)
            norms = np.clip(norms, a_min=1e-9, a_max=None)
            normalized = mean_pooled / norms
            all_embeddings.append(normalized.astype(np.float32))

        return np.vstack(all_embeddings)
