"""
HackGuru - ONNX Runtime Fast Embedder (all-MiniLM-L6-v2)
Provides sub-5ms CPU text embedding using ONNX Runtime and Fast Tokenizers.
"""

import os
import json
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
    
    # Truncate description to prevent token overflow
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


class ONNXEmbedder:
    """Singleton ONNX Runtime Inference Session for all-MiniLM-L6-v2."""
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

        if ONNX_AVAILABLE and os.path.exists(self.model_path) and os.path.exists(self.tokenizer_path):
            self._load_model()
        else:
            print(f"[ONNXEmbedder] Warning: Model files not found at {self.model_path}. Running in fallback mode.")

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
        # Warmup forward pass
        _ = self.encode(["warmup search embedding"])
        print(f"[ONNXEmbedder] all-MiniLM-L6-v2 ONNX session initialized and warmed up (dim={self.embedding_dim}).")

    @property
    def is_ready(self):
        return self.session is not None and self.tokenizer is not None

    def encode(self, texts, batch_size=32) -> np.ndarray:
        """
        Generates L2-normalized 384-dimensional dense embeddings for string or list of strings.
        Returns NumPy array of shape (N, 384) with dtype float32.
        """
        if isinstance(texts, str):
            texts = [texts]

        if not texts:
            return np.empty((0, self.embedding_dim), dtype=np.float32)

        if not self.is_ready:
            # Fallback if model not loaded
            rng = np.random.RandomState(42)
            arr = rng.randn(len(texts), self.embedding_dim).astype(np.float32)
            return arr / np.linalg.norm(arr, axis=1, keepdims=True)

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

            # Mean Pooling with attention mask
            mask_expanded = np.expand_dims(attention_mask, -1).astype(np.float32)
            sum_embeddings = np.sum(outputs * mask_expanded, axis=1)
            sum_mask = np.clip(mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
            mean_pooled = sum_embeddings / sum_mask

            # L2 normalization
            norms = np.linalg.norm(mean_pooled, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            normalized = (mean_pooled / norms).astype(np.float32)
            all_embeddings.append(normalized)

        return np.vstack(all_embeddings)
