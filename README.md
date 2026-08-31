# HackGURU – College Events Discovery & Recommendation Platform

> A vibrant, rounded college events and hackathon platform built with a Python server and SQLite backend, featuring dual-mode search and recommendation algorithms (Rule-Based Heuristic vs Dense Semantic Vector Hybrid + MMR Diversity).

---

## 🎨 Design System & Visual Tokens

The user interface implements the design language extracted from the reference study without copying brand assets:

| Token Category | Values & Specifications |
|---|---|
| **Vibe** | Vibrant · Rounded · Layered Elevation |
| **Colors** | Primary: `#7F00FF`, Accent: `#0D6EFD`, Surface: `#FFFFFF`, Elevated: `#F9FAFB`, Background: `#FAFAFA`, Text: `#0F0F0F`, Muted: `#6B7280` |
| **Typography** | Headings: Plus Jakarta Sans / blMelody (50px 900 H1, 24px 700 H2, 15px 700 H3, 16px 700 H4); Body: Poppins 16px 400 (Line Height 1.7) |
| **Border Radii** | Pill Buttons: `999px`, Cards: `20px`, Chips & Selectors: `999px`, Modals: `20px` |
| **Elevation Scale** | Subtle: `rgba(0,0,0,0.04) 0px 2px 10px`, Medium: `rgba(0,0,0,0.05) 0px 4px 20px`, Strong: `rgba(0,0,0,0.18) 0px 20px 40px` |
| **Interactions** | Hover: `translateY(-2px)` / `translateY(-4px)` with purple glow shadow `rgba(127, 0, 255, 0.22) 0px 10px 25px` |
| **Breakpoints** | Responsive scaling across 350px, 480px, 768px, 860px, 991px, 992px, 1510px |

---

## 🧠 Search & Recommendation Engine Architecture

The platform supports dual-mode execution to compare baseline heuristic algorithms against AI-enhanced algorithms:

```
                               ┌────────────────────────────────────────────────────────┐
                               │                 Incoming User Query                    │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                                         ┌────────────────┴────────────────┐
                                         ▼                                 ▼
                     ┌───────────────────────────────────┐ ┌──────────────────────────────────┐
                     │          Default Mode             │ │       AI Mode (--with-ai)        │
                     │  (Rule-Based & Substring Filter)  │ │   (Semantic Dense Hybrid + MMR)  │
                     └─────────────────┬─────────────────┘ └────────────────┬─────────────────┘
                                       │                                    │
                         ┌─────────────┴────────────┐         ┌─────────────┴────────────┐
                         ▼                          ▼         ▼                          ▼
                   Exact & Prefix             Collaborative  Query Intent Classifier    User Vector Profile
                   Field Frequency            Category       Subword N-gram Cosine      Item-to-Item Cosine
                   Popularity Heuristic       Affinity       BM25 Hybrid Fusion         MMR Diversity (λ=0.7)
                                                             Typo Resilience (Lev.)     AI Explainability
```

### 1. Default Mode (Standard)
* **Search**: Substring & boolean token frequency across title, category, description, and tags with popularity weighting.
* **Recommendations**: Rule-based category affinity, location proximity, and view velocity ranking.

### 2. AI Mode (`--with-ai`)
* **Dense Semantic Vector Embeddings**: Subword n-gram character and word-level TF-IDF embedding space for multi-field representation.
* **BM25 Hybrid Fusion**: Combines dense vector cosine similarity with Okapi BM25 scoring.
* **Query Intent Extraction**: Classifies intents (e.g. *Hackathons*, *Agentic AI*, *UI/UX Internships*, *SpaceTech*, *Free vs Paid*).
* **Fuzzy Typo Correction**: Handles misspellings (e.g. `chenai` -> `Chennai`, `hackathn` -> `Hackathon`).
* **Personalized MMR Diversity Recommender**: Synthesizes a user dynamic preference vector and applies Maximal Marginal Relevance ($\lambda = 0.72$) to prevent filter bubbles.
* **AI Match Reasoning**: Attaches human-readable explanations (e.g. `96% Semantic Match · Aligned with your Agentic coding interest`).

---

## 🚀 Running the Server

### 1. Run in Default Mode:
```bash
python3 server.py --port 8000
```

### 2. Run in AI-Enhanced Mode (`--with-ai`):
```bash
python3 server.py --port 8000 --with-ai
```

Open `http://localhost:8000` in your web browser.

---

## 🧪 Running Algorithm Benchmarks & Test Suite

### Run the Benchmark Evaluation Suite:
```bash
python3 core/benchmark.py
```

### Run Unit & Integration Tests:
```bash
python3 -m unittest discover tests/
```

---

## 📂 REST API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | `GET` | Main responsive UI application |
| `/api/algorithm-info` | `GET` | Returns active engine mode and diagnostics |
| `/api/events` | `GET` | Filtered & paginated event catalog (supports `?q=&category=&mode=&location=&price=&algorithm=`) |
| `/api/events/<id>` | `GET` | Event details + similar event recommendations |
| `/api/recommendations` | `GET` | Personalized user recommendations |
| `/api/featured` | `GET` | Featured events slider feed |
| `/api/trending` | `GET` | Trending challenges and hackathons |
| `/api/virtual` | `GET` | Virtual / online events |
| `/api/locations` | `GET` | Cities and event counts |
| `/api/notifications` | `GET` | Notification feed |
| `/api/profile` | `GET` | User profile & registration data |
| `/api/bookmark` | `POST` | Toggle bookmark / wishlist state |
| `/api/register` | `POST` | Event registration |
| `/api/benchmark` | `POST` | Side-by-side Default vs AI comparison on any query |

---

## 🌿 Git Branching & Feature Workflow

All features were developed in isolated feature branches and merged into `test`:
* `features/database-and-models` -> SQLite schema, seeder with 30+ rich events, bookmarks, registrations.
* `features/search-and-recommendation-engine` -> DefaultSearchEngine, AISearchEngine, DefaultRecommender, AIRecommender.
* `features/backend-python-server` -> Python HTTP server with REST APIs and `--with-ai` argument.
* `features/frontend-design-system-and-ui` -> Complete UI matching design system tokens, carousels, modals, and responsive styling.
* `features/interactive-algorithm-benchmarking` -> Real-time algorithm playground and benchmark evaluation suite.

Final integrated code is maintained on branch `test`.
