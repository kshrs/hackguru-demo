# HackGuru — Next.js & Node.js College Events Platform Replica

This folder (`replica-version/`) is a standalone, production-grade **Next.js 14 (React)** and **Node.js** full-stack replica of the HackGuru platform.

---

## Architecture Overview

- **Frontend**: Next.js 14 (App Router) + React Server/Client Components
  - **Landing Page (`src/app/page.jsx`)**: Ditto replica of `index.html` featuring carousel sliders, category navigation, and "Why Choose" features.
  - **Find & Filter Page (`src/app/events/page.jsx`)**: Ditto replica of `events.html` featuring instant real-time live typing search (50ms debounce), multi-category filtering, format mode toggles, price filters, sort pills, and interactive registration modals.
- **Backend**: Node.js App Router API endpoints + standalone `server.js`
  - `/api/events`: Multi-faceted event discovery and search
  - `/api/search`: Hybrid search endpoint
  - `/api/events/[id]`: Event details and related suggestions
  - `/api/recommendations`: Featured & personalized recommendations
  - `/api/bookmark`: Wishlist & bookmark toggle
  - `/api/register`: Event registration
  - `/api/algorithm-info`: Engine diagnostics
- **Search Engine (`src/lib/search.js`)**:
  - In-memory 384-dimensional dense semantic vector space projection
  - Subword trigram hashing with orthogonal concept basis vectors
  - Okapi BM25 inverted index ranking
  - Normalized Levenshtein typo tolerance
  - Conversational entity slot extraction (*Category, Location, Mode, Price intent*)
- **Database (`src/lib/db.js`)**:
  - Built-in `node:sqlite` (`DatabaseSync`) reading `data/hackguru.db`

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build & Run Production Server
```bash
npm run build
npm start
# OR run via standalone Node.js server:
npm run server
```

---

## Verification Endpoints

- **Home Page**: `GET http://localhost:3000/`
- **Events Filter Page**: `GET http://localhost:3000/events`
- **Real-time Search**: `GET http://localhost:3000/api/events?q=AI+hackathon+in+coimbatore`
- **Algorithm Info**: `GET http://localhost:3000/api/algorithm-info`
