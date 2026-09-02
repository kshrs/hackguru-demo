const crypto = require('crypto');
const { getAllEvents } = require('./db');
const {
  decodeHtmlEntities,
  EXPANDED_CATEGORIES,
  EXPANDED_LOCATIONS,
  EXPANDED_MODES,
  normalizeQuery,
  isEventFree,
  validateStructuredConstraints
} = require('./searchEnhancements');

const KNOWN_CATEGORIES = EXPANDED_CATEGORIES;
const KNOWN_LOCATIONS = EXPANDED_LOCATIONS;
const KNOWN_MODES = EXPANDED_MODES;

function tokenize(text) {
  if (!text) return [];
  return String(decodeHtmlEntities(text)).toLowerCase().match(/[a-z0-9_+#]+/g) || [];
}

function levenshteinDistance(s1, s2) {
  if (s1.length < s2.length) return levenshteinDistance(s2, s1);
  if (s2.length === 0) return s1.length;

  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    const currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      const insertions = previousRow[j + 1] + 1;
      const deletions = currentRow[j] + 1;
      const substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[previousRow.length - 1];
}

function extractQueryParameters(rawQuery) {
  const q = (rawQuery || '').trim();
  const qNormalized = normalizeQuery(q);
  const qLower = qNormalized.toLowerCase();
  const appliedFilters = {};
  const tokensToStrip = [];

  // 1. Category
  for (const [kw, catName] of Object.entries(KNOWN_CATEGORIES)) {
    const pattern = new RegExp(`\\b${kw}\\b`, 'i');
    const match = qLower.match(pattern);
    if (match) {
      appliedFilters.category = catName;
      tokensToStrip.push(match[0]);
      break;
    }
  }

  // 2. Location
  for (const [kw, locName] of Object.entries(KNOWN_LOCATIONS)) {
    const pattern = new RegExp(`\\b${kw}\\b`, 'i');
    const match = qLower.match(pattern);
    if (match) {
      appliedFilters.location = locName;
      tokensToStrip.push(match[0]);
      break;
    }
  }

  // 3. Mode
  for (const [kw, modeName] of Object.entries(KNOWN_MODES)) {
    const pattern = new RegExp(`\\b${kw}\\b`, 'i');
    const match = qLower.match(pattern);
    if (match) {
      appliedFilters.mode = modeName;
      tokensToStrip.push(match[0]);
      break;
    }
  }

  // 4. Price
  if (/\b(free|zero fee|no fee|no cost|free of cost|free events?)\b/i.test(qLower)) {
    appliedFilters.is_free = true;
    tokensToStrip.push('free', 'zero fee', 'no fee', 'no cost', 'free of cost');
  } else if (/\b(paid|stipend|cash prize|paid events?)\b/i.test(qLower)) {
    appliedFilters.is_paid = true;
    tokensToStrip.push('paid', 'stipend', 'cash prize');
  }

  const fillerWords = [
    'find', 'search', 'show me', 'show', 'give me', 'list', 'get', 'explore',
    'looking for', 'events', 'event', 'competitions', 'competition', 'hackathons',
    'hackathon', 'workshops', 'workshop', 'contests', 'contest', 'for', 'in', 'at',
    'under', 'with', 'near', 'best', 'top', 'all', 'any', 'please', 'can you'
  ];

  let residual = ` ${qLower.replace(/[^a-z0-9\s\-_+#]/g, ' ')} `;
  for (const phrase of [...tokensToStrip, ...fillerWords].sort((a, b) => b.length - a.length)) {
    residual = residual.replace(new RegExp(`(?<![a-z0-9])${phrase}(?![a-z0-9])`, 'gi'), ' ');
  }

  const residualKeywords = residual.replace(/\s+/g, ' ').trim();

  return {
    raw_query: q,
    residual_keywords: residualKeywords || q,
    applied_filters: appliedFilters
  };
}

class FastSemanticEmbedder {
  constructor(dim = 384) {
    this.dim = dim;
    this.cache = new Map();
    this.basis = this.initBasis();
  }

  initBasis() {
    const concepts = [
      'ai', 'agentic', 'hackathon', 'coding', 'software', 'hardware', 'robotics',
      'embedded', 'iot', 'web3', 'blockchain', 'conference', 'research', 'paper',
      'workshop', 'training', 'internship', 'design', 'ui', 'ux', 'writing', 'essay',
      'sports', 'cricket', 'space', 'antenna', 'rf', 'sustainability', 'green', 'waste',
      'fintech', 'coimbatore', 'chennai', 'bengaluru', 'delhi', 'online', 'free', 'prize'
    ];

    const basis = {};
    for (let i = 0; i < concepts.length; i++) {
      const vec = new Float32Array(this.dim);
      for (let d = 0; d < this.dim; d++) {
        vec[d] = Math.sin((i + 1) * 31.7 + d * 13.9);
      }
      let norm = 0;
      for (let d = 0; d < this.dim; d++) norm += vec[d] * vec[d];
      norm = Math.sqrt(norm);
      for (let d = 0; d < this.dim; d++) vec[d] /= norm;
      basis[concepts[i]] = vec;
    }
    return basis;
  }

  encode(text) {
    const cacheKey = String(text).toLowerCase().trim();
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const tokens = tokenize(text);
    const vec = new Float32Array(this.dim);

    if (tokens.length === 0) {
      vec[0] = 1.0;
      return vec;
    }

    for (const t of tokens) {
      let weight = 1.0;
      if (this.basis[t]) {
        weight = 2.5;
        const b = this.basis[t];
        for (let d = 0; d < this.dim; d++) vec[d] += b[d] * weight;
      } else {
        const padded = `<${t}>`;
        for (let i = 0; i < padded.length - 2; i++) {
          const ng = padded.slice(i, i + 3);
          const hash = crypto.createHash('md5').update(ng).digest();
          const idx = hash.readUInt16BE(0) % this.dim;
          const sign = hash.readUInt8(2) % 2 === 0 ? 1.0 : -1.0;
          vec[idx] += sign;
        }
      }
    }

    let norm = 0;
    for (let d = 0; d < this.dim; d++) norm += vec[d] * vec[d];
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let d = 0; d < this.dim; d++) vec[d] /= norm;
    } else {
      vec[0] = 1.0;
    }

    if (this.cache.size < 2000) {
      this.cache.set(cacheKey, vec);
    }
    return vec;
  }
}

class SearchEngine {
  constructor() {
    this.embedder = new FastSemanticEmbedder(384);
    this.events = getAllEvents();
    this.docVectors = new Map();
    this.docTokens = new Map();
    this.idf = new Map();
    this.docLengths = new Map();
    this.avgDocLength = 0;
    this.buildIndex();
  }

  buildIndex() {
    const docCount = this.events.length;
    if (docCount === 0) return;

    const docFreq = new Map();
    let totalLen = 0;

    for (const event of this.events) {
      const eId = event.id;
      const rawText = `${event.title} ${event.subtitle || ''} ${event.category} ${event.mode} ${event.location} ${event.college || ''} ${event.description || ''} ${event.tags || ''}`;
      const tokens = tokenize(rawText);

      this.docTokens.set(eId, tokens);
      this.docLengths.set(eId, tokens.length);
      totalLen += tokens.length;

      const uniqueTokens = new Set(tokens);
      for (const t of uniqueTokens) {
        docFreq.set(t, (docFreq.get(t) || 0) + 1);
      }

      // Precompute dense vector embedding
      const vec = this.embedder.encode(rawText);
      this.docVectors.set(eId, vec);
    }

    this.avgDocLength = totalLen / Math.max(1, docCount);

    for (const [token, df] of docFreq.entries()) {
      const val = Math.log((docCount - df + 0.5) / (df + 0.5) + 1.0);
      this.idf.set(token, val);
    }
  }

  computeBm25(queryTokens, eventId, k1 = 1.5, b = 0.75) {
    let score = 0;
    const tokens = this.docTokens.get(eventId) || [];
    const docLen = this.docLengths.get(eventId) || 1;

    const tfMap = {};
    for (const t of tokens) tfMap[t] = (tfMap[t] || 0) + 1;

    for (const t of queryTokens) {
      if (tfMap[t]) {
        const idf = this.idf.get(t) || 0.5;
        const tf = tfMap[t];
        const num = tf * (k1 + 1.0);
        const denom = tf + k1 * (1.0 - b + b * (docLen / Math.max(1.0, this.avgDocLength)));
        score += idf * (num / Math.max(0.001, denom));
      }
    }
    return score;
  }

  computeCosine(vecA, vecB) {
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }

  search(options = {}) {
    const startTime = Date.now();
    const query = (options.query || options.q || '').trim();
    const category = options.category;
    const mode = options.mode;
    const location = options.location;
    const price = options.price;
    const sort = options.sort || 'relevance';
    const limit = parseInt(options.limit || '50', 10);
    const offset = parseInt(options.offset || '0', 10);

    const parsedSlots = extractQueryParameters(query);
    const appliedSlots = { ...parsedSlots.applied_filters };

    if (category && category.toLowerCase() !== 'all') appliedSlots.category = category;
    if (mode && mode.toLowerCase() !== 'all') appliedSlots.mode = mode.toUpperCase();
    if (location && location.toLowerCase() !== 'all') appliedSlots.location = location;
    if (price && price.toLowerCase() !== 'all') {
      if (price.toLowerCase() === 'free') appliedSlots.is_free = true;
      else if (price.toLowerCase() === 'paid') appliedSlots.is_paid = true;
    }

    const qTokens = tokenize(query);
    const qLower = query.toLowerCase();
    const queryVec = this.embedder.encode(parsedSlots.residual_keywords || query);

    const scoredResults = [];

    for (const event of this.events) {
      const eId = event.id;
      const titleLower = event.title.toLowerCase();
      const descLower = (event.description || '').toLowerCase();
      const locLower = event.location.toLowerCase();
      const catLower = event.category.toLowerCase();
      const eventMode = (event.mode || 'OFFLINE').toUpperCase();

      // Hard filters
      if (category && category.toLowerCase() !== 'all') {
        if (!catLower.includes(category.toLowerCase()) && !titleLower.includes(category.toLowerCase())) {
          continue;
        }
      }
      if (mode && mode.toLowerCase() !== 'all') {
        if (eventMode !== mode.toUpperCase() && mode.toUpperCase() !== 'ALL') {
          continue;
        }
      }
      if (location && location.toLowerCase() !== 'all') {
        if (!locLower.includes(location.toLowerCase())) {
          continue;
        }
      }
      if (price && price.toLowerCase() !== 'all') {
        const isFree = event.price.toLowerCase().includes('free') || event.price_numeric === 0;
        if (price.toLowerCase() === 'free' && !isFree) continue;
        if (price.toLowerCase() === 'paid' && isFree) continue;
      }

      // Structured constraint validation (Strictly validates real event fields: price, mode, location)
      if (!validateStructuredConstraints(event, appliedSlots)) {
        continue;
      }

      if (!query) {
        const score = (event.is_featured ? 10.0 : 0.0) + (event.views_count / 500.0) + (event.rating || 4.8);
        scoredResults.push({
          event,
          score: Math.round(score * 100) / 100,
          semantic_similarity: 1.0,
          match_percentage: event.is_featured ? 98 : 85,
          match_reasons: event.is_featured ? ['Featured Catalog Item'] : ['Popular College Event'],
          match_type: 'browse',
          algorithm: 'hybrid_semantic'
        });
        continue;
      }

      const titleClean = decodeHtmlEntities(event.title).toLowerCase();

      // 1. Lexical BM25
      const bm25Score = this.computeBm25(qTokens, eId);

      // 2. Dense Semantic Vector Cosine Sim
      const docVec = this.docVectors.get(eId);
      const semanticSim = docVec ? this.computeCosine(docVec, queryVec) : 0.0;

      // 3. Exact Phrase & Token Boosts
      let exactBoost = 0;
      const reasons = [];

      if (qLower === titleLower || qLower === titleClean) {
        exactBoost += 50.0;
        reasons.push('Exact Title Match');
      } else if (titleLower.includes(qLower) || titleClean.includes(qLower)) {
        exactBoost += 30.0;
        reasons.push('Title Phrase Match');
      }

      // Fuzzy matching
      const dist = Math.min(
        levenshteinDistance(qLower, titleLower.slice(0, qLower.length)),
        levenshteinDistance(qLower, titleClean.slice(0, qLower.length))
      );
      const fuzzySim = Math.max(0, 1.0 - (dist / Math.max(qLower.length, 1)));
      if (fuzzySim > 0.75) {
        exactBoost += fuzzySim * 10.0;
        if (fuzzySim > 0.85 && !reasons.includes('Exact Title Match')) {
          reasons.push('Fuzzy Match');
        }
      }

      // Slot Boosts
      if (appliedSlots.category) {
        const reqCat = appliedSlots.category.toLowerCase();
        const isCatMatch = catLower.includes(reqCat) || titleLower.includes(reqCat) || titleClean.includes(reqCat) ||
          (reqCat === 'hackathon' && (titleClean.includes('hack') || titleClean.includes('code') || titleClean.includes('athon') || descLower.includes('hackathon'))) ||
          (reqCat === 'workshop' && (titleClean.includes('workshop') || titleClean.includes('training') || titleClean.includes('sttp') || titleClean.includes('bootcamp') || descLower.includes('workshop'))) ||
          (reqCat === 'contest' && (titleClean.includes('contest') || titleClean.includes('competition') || titleClean.includes('olympiad') || titleClean.includes('challenge') || descLower.includes('contest')));
        
        if (isCatMatch) {
          exactBoost += 15.0;
          reasons.push(`Category: ${event.category}`);
        }
      }

      if (appliedSlots.mode) {
        const reqMode = appliedSlots.mode.toUpperCase();
        if (eventMode === reqMode || (reqMode === 'ONLINE' && (event.is_virtual || locLower === 'online'))) {
          exactBoost += 15.0;
          reasons.push(`Mode: ${event.mode}`);
        }
      }

      if (appliedSlots.location) {
        const reqLoc = appliedSlots.location.toLowerCase();
        if (locLower.includes(reqLoc) || (reqLoc === 'online' && eventMode === 'ONLINE')) {
          exactBoost += 15.0;
          reasons.push(`Location: ${event.location}`);
        }
      }

      if (appliedSlots.is_free) {
        if (event.price.toLowerCase().includes('free') || event.price_numeric === 0) {
          exactBoost += 15.0;
          reasons.push('Free Registration');
        }
      }

      // Popularity Prior
      const popScore = Math.min((event.views_count || 0) / 1000.0, 3.0);

      const totalScore = (semanticSim * 25.0) + (bm25Score * 4.0) + exactBoost + popScore;

      if (totalScore > 1.0 || semanticSim > 0.25) {
        const matchPct = Math.max(25, Math.min(99, Math.floor((totalScore / (totalScore + 15.0)) * 100)));
        if (reasons.length === 0) {
          reasons.push(`Semantic Relevance: ${matchPct}%`);
        }

        scoredResults.push({
          event,
          score: Math.round(totalScore * 100) / 100,
          semantic_similarity: Math.round(semanticSim * 10000) / 10000,
          match_percentage: matchPct,
          match_reasons: reasons,
          match_type: 'hybrid_semantic',
          algorithm: 'hybrid_semantic'
        });
      }
    }

    // Sort
    if (sort === 'popularity' || sort === 'views') {
      scoredResults.sort((a, b) => (b.event.views_count || 0) - (a.event.views_count || 0));
    } else if (sort === 'price_asc') {
      scoredResults.sort((a, b) => (a.event.price_numeric || 0) - (b.event.price_numeric || 0));
    } else if (sort === 'price_desc') {
      scoredResults.sort((a, b) => (b.event.price_numeric || 0) - (a.event.price_numeric || 0));
    } else if (sort === 'a_z') {
      scoredResults.sort((a, b) => a.event.title.localeCompare(b.event.title));
    } else if (sort === 'z_a') {
      scoredResults.sort((a, b) => b.event.title.localeCompare(a.event.title));
    } else { // relevance
      scoredResults.sort((a, b) => b.score - a.score);
    }

    const totalCount = scoredResults.length;
    const paginated = scoredResults.slice(offset, offset + limit);
    const latencyMs = Date.now() - startTime;

    return {
      algorithm: 'hybrid_semantic',
      query,
      total_count: totalCount,
      results: paginated,
      latency_ms: latencyMs,
      diagnostics: {
        slots_extracted: appliedSlots,
        residual_keywords: parsedSlots.residual_keywords,
        strategy: '384-d Dense Semantic Vector + Okapi BM25 + Slot Intent + Fuzzy Typo Ranking'
      }
    };
  }
}

let searchEngineInstance = null;

function getSearchEngine() {
  if (!searchEngineInstance) {
    searchEngineInstance = new SearchEngine();
  }
  return searchEngineInstance;
}

module.exports = {
  getSearchEngine,
  extractQueryParameters
};
