const { getAllEvents } = require('./db');
const crypto = require('crypto');

function tokenize(text) {
  if (!text) return [];
  return String(text).toLowerCase().match(/[a-z0-9_+#]+/g) || [];
}

class FastVectorEmbedder {
  constructor(dim = 384) {
    this.dim = dim;
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
    const tokens = tokenize(text);
    const vec = new Float32Array(this.dim);

    if (tokens.length === 0) {
      vec[0] = 1.0;
      return vec;
    }

    for (const t of tokens) {
      if (this.basis[t]) {
        const b = this.basis[t];
        for (let d = 0; d < this.dim; d++) vec[d] += b[d] * 2.5;
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
    return vec;
  }

  cosineSimilarity(vecA, vecB) {
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }
}

class EventRecommender {
  constructor() {
    this.embedder = new FastVectorEmbedder(384);
    this.events = getAllEvents();
    this.eventVectors = new Map();
    this.initVectors();
  }

  initVectors() {
    for (const e of this.events) {
      const doc = `${e.title} ${e.category} ${e.tags || ''} ${e.description || ''} ${e.college || ''} ${e.location}`;
      this.eventVectors.set(e.id, this.embedder.encode(doc));
    }
  }

  buildUserVector(profile = {}, sessionInteractions = []) {
    const interests = profile.interests || ['AI / Machine Learning', 'Hackathon'];
    const skillLevel = profile.skillLevel || 'Beginner';
    const city = profile.city || 'Coimbatore';
    const role = profile.role || 'Engineering Student';

    const profileText = `${interests.join(' ')} ${skillLevel} ${city} ${role} college event competition workshop coding`;
    const baseVec = this.embedder.encode(profileText);

    if (!sessionInteractions || sessionInteractions.length === 0) {
      return baseVec;
    }

    const combinedVec = new Float32Array(384);
    for (let d = 0; d < 384; d++) combinedVec[d] = baseVec[d] * 2.0;

    let totalWeight = 2.0;
    for (const interaction of sessionInteractions) {
      const eVec = this.eventVectors.get(interaction.eventId);
      if (eVec) {
        const w = interaction.type === 'register' ? 5.0 : interaction.type === 'bookmark' ? 3.0 : 1.0;
        for (let d = 0; d < 384; d++) combinedVec[d] += eVec[d] * w;
        totalWeight += w;
      }
    }

    let norm = 0;
    for (let d = 0; d < 384; d++) {
      combinedVec[d] /= totalWeight;
      norm += combinedVec[d] * combinedVec[d];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let d = 0; d < 384; d++) combinedVec[d] /= norm;
    }
    return combinedVec;
  }

  recommend(options = {}) {
    const profile = options.profile || {};
    const sessionInteractions = options.sessionInteractions || [];
    const userCity = (profile.city || options.city || 'Coimbatore').toLowerCase();
    const rawInterests = profile.interests || options.interests || ['AI / Machine Learning', 'Hackathons'];
    const userInterests = (Array.isArray(rawInterests) ? rawInterests : String(rawInterests).split(',')).map(i => i.trim().toLowerCase()).filter(Boolean);
    const userSkill = (profile.skillLevel || options.skillLevel || 'Beginner').toLowerCase();
    const topK = parseInt(options.limit || 8, 10);
    const exploreRate = options.exploreRate !== undefined ? options.exploreRate : 0.15;

    // Refresh events from DB if needed
    if (!this.events || this.events.length === 0) {
      this.events = getAllEvents();
      this.initVectors();
    }

    const userVec = this.buildUserVector({ ...profile, interests: userInterests, city: userCity, skillLevel: userSkill }, sessionInteractions);
    const candidates = [];

    for (const event of this.events) {
      const eId = event.id;
      let eVec = this.eventVectors.get(eId);
      if (!eVec) {
        const doc = `${event.title} ${event.category} ${event.tags || ''} ${event.description || ''} ${event.college || ''} ${event.location}`;
        eVec = this.embedder.encode(doc);
        this.eventVectors.set(eId, eVec);
      }

      // 1. Semantic Cosine Similarity
      const semanticSim = this.embedder.cosineSimilarity(userVec, eVec);

      // 2. Location Match Factor
      const eventLoc = (event.location || '').toLowerCase();
      const eventMode = (event.mode || 'OFFLINE').toUpperCase();
      let locMatch = 0.4;
      if (eventMode === 'ONLINE') {
        locMatch = 0.95;
      } else if (eventLoc.includes(userCity) || (userCity === 'coimbatore' && (eventLoc.includes('coimbatore') || eventLoc.includes('perundurai') || eventLoc.includes('erode')))) {
        locMatch = 1.0;
      } else if (userCity === 'any' || userCity === 'all') {
        locMatch = 0.8;
      }

      // 3. Category & Interest Overlap
      const eventCat = (event.category || '').toLowerCase();
      const eventTags = (event.tags || '').toLowerCase();
      const eventTitle = (event.title || '').toLowerCase();
      let interestOverlap = 0;

      for (const interest of userInterests) {
        if (eventCat.includes(interest) || eventTags.includes(interest) || eventTitle.includes(interest)) {
          interestOverlap += 1.0;
        } else {
          // Micro-matching
          if (interest.includes('ai') && (eventTitle.includes('ai') || eventTags.includes('agentic') || eventTags.includes('ml') || eventTitle.includes('horizon'))) {
            interestOverlap += 1.0;
          } else if (interest.includes('hack') && (eventCat.includes('hackathon') || eventTitle.includes('hack') || eventTitle.includes('codathon'))) {
            interestOverlap += 1.0;
          } else if (interest.includes('robot') && (eventTags.includes('robotics') || eventTitle.includes('corexathon') || eventTags.includes('hardware'))) {
            interestOverlap += 1.0;
          } else if (interest.includes('web') && (eventTags.includes('web') || eventTags.includes('fullstack') || eventTags.includes('react'))) {
            interestOverlap += 1.0;
          } else if (interest.includes('design') && (eventTags.includes('design') || eventTags.includes('ui') || eventTags.includes('ux'))) {
            interestOverlap += 1.0;
          }
        }
      }
      const interestScore = Math.min(1.0, interestOverlap / Math.max(1, userInterests.length));

      // 4. Popularity Scaling
      const views = event.views_count || 0;
      const popScore = Math.min(1.0, Math.log1p(views) / 8.0);

      // 5. Multi-factor Composite Ranking Formula (HackGuru.md)
      const finalScore = (0.45 * Math.max(0, semanticSim)) +
                          (0.25 * locMatch) +
                          (0.15 * interestScore) +
                          (0.10 * popScore) +
                          (event.is_featured ? 0.05 : 0.0);

      // 6. Explainability Evidence Tagging
      let badge = '🎯 Recommended Opportunity';
      let tagCategory = 'Interest Match';

      if (interestScore >= 0.5 || semanticSim > 0.65) {
        const topMatchedInterest = userInterests.find(i => eventCat.includes(i) || eventTags.includes(i) || eventTitle.includes(i)) || userInterests[0] || event.category;
        badge = `✨ Recommended for your interest in ${topMatchedInterest.toUpperCase()}`;
        tagCategory = 'Interest Aligned';
      } else if (locMatch === 1.0 && eventMode !== 'ONLINE') {
        badge = `📍 Happening locally in ${event.location}`;
        tagCategory = 'Local Campus';
      } else if (eventMode === 'ONLINE') {
        badge = `🌐 Online / Remote Friendly`;
        tagCategory = 'Virtual Event';
      } else if (popScore > 0.6) {
        badge = `🔥 Trending among engineering students`;
        tagCategory = 'Trending';
      }

      const matchPct = Math.min(99, Math.max(78, Math.floor((finalScore / (finalScore + 0.15)) * 100)));

      candidates.push({
        event,
        score: Math.round(finalScore * 1000) / 1000,
        semantic_similarity: Math.round(semanticSim * 1000) / 1000,
        match_percentage: matchPct,
        explanation: badge,
        tag_category: tagCategory,
        is_explore: false
      });
    }

    // Sort by composite score descending
    candidates.sort((a, b) => b.score - a.score);
    let topCandidates = candidates.slice(0, topK);

    // 7. Exploration Injection (15% Multi-Armed Bandit Novelty)
    if (exploreRate > 0 && candidates.length > topK) {
      const representedCats = new Set(topCandidates.map(c => c.event.category));
      const unseenCandidates = candidates.slice(topK).filter(c => !representedCats.has(c.event.category) && (c.event.rating || 4.5) >= 4.5);

      if (unseenCandidates.length > 0) {
        const exploreItem = { ...unseenCandidates[0] };
        exploreItem.is_explore = true;
        exploreItem.explanation = '🌟 Explore Something New: Trending outside your primary focus';
        exploreItem.tag_category = 'Discovery';
        exploreItem.match_percentage = 92;
        topCandidates[topCandidates.length - 1] = exploreItem;
      }
    }

    return {
      success: true,
      profile: {
        interests: userInterests,
        city: userCity,
        skillLevel: userSkill
      },
      total_candidates: candidates.length,
      recommendations: topCandidates
    };
  }
}

let globalRecommender = null;
function getRecommender() {
  if (!globalRecommender) {
    globalRecommender = new EventRecommender();
  }
  return globalRecommender;
}

module.exports = {
  EventRecommender,
  getRecommendations: (opts) => getRecommender().recommend(opts)
};
