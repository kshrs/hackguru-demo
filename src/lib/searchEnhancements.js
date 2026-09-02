/**
 * Search Enhancements & Query Preprocessing Module
 * Strictly Additive: provides query normalization, expanded synonyms, 
 * intent recognition, and typo tolerance without altering existing ranking engines.
 */

// HTML entity decoder for clean text matching
function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

// Expanded category synonyms and aliases
const EXPANDED_CATEGORIES = {
  // Hackathons & Coding
  hackathon: 'Hackathon',
  hackathons: 'Hackathon',
  hack: 'Hackathon',
  hacks: 'Hackathon',
  hackfest: 'Hackathon',
  codathon: 'Hackathon',
  ideathon: 'Hackathon',
  makeathon: 'Hackathon',
  devfest: 'Hackathon',
  coding: 'Hackathon',
  code: 'Hackathon',
  programming: 'Hackathon',
  developer: 'Hackathon',
  
  // Workshops & Training
  workshop: 'Workshop',
  workshops: 'Workshop',
  bootcamp: 'Workshop',
  bootcamps: 'Workshop',
  training: 'Workshop',
  sttp: 'Workshop',
  seminar: 'Workshop',
  seminars: 'Workshop',
  webinar: 'Workshop',
  webinars: 'Workshop',
  'hands-on': 'Workshop',
  masterclass: 'Workshop',

  // Conferences & Research
  conference: 'Conference',
  conferences: 'Conference',
  symposium: 'Conference',
  symposiums: 'Conference',
  summit: 'Conference',
  meetup: 'Conference',
  research: 'Conference',
  'paper presentation': 'Conference',

  // Contests & Competitions
  contest: 'Contest',
  contests: 'Contest',
  competition: 'Contest',
  competitions: 'Contest',
  challenge: 'Contest',
  challenges: 'Contest',
  olympiad: 'Contest',
  quiz: 'Contest',
  'project display': 'Contest',

  // Internships
  internship: 'Internship',
  internships: 'Internship',
  intern: 'Internship',
  interns: 'Internship',

  // Sports & Cultural
  sports: 'Sports',
  cricket: 'Sports',
  esports: 'Sports',
  tournament: 'Sports',
  trials: 'Sports',
  marathon: 'Sports',
  cultural: 'Cultural',
  fest: 'Cultural',
  festival: 'Cultural',
  concert: 'Cultural',

  // Academic
  academic: 'Academic & Professional',
  professional: 'Academic & Professional'
};

// Expanded locations with common aliases
const EXPANDED_LOCATIONS = {
  chennai: 'Chennai',
  madras: 'Chennai',
  coimbatore: 'Coimbatore',
  cbe: 'Coimbatore',
  kovai: 'Coimbatore',
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  delhi: 'New Delhi',
  'new delhi': 'New Delhi',
  ncr: 'New Delhi',
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  hyderabad: 'Hyderabad',
  hyd: 'Hyderabad',
  pune: 'Pune',
  madurai: 'Madurai',
  erode: 'Erode',
  perundurai: 'Perundurai',
  india: 'India',
  online: 'Online',
  remote: 'Online',
  virtual: 'Online'
};

// Expanded format modes
const EXPANDED_MODES = {
  online: 'ONLINE',
  virtual: 'ONLINE',
  remote: 'ONLINE',
  offline: 'OFFLINE',
  'in-person': 'OFFLINE',
  physical: 'OFFLINE',
  'on-campus': 'OFFLINE',
  hybrid: 'HYBRID'
};

// High-confidence typo normalization dictionary
const TYPO_MAP = {
  hackthon: 'hackathon',
  hackathons: 'hackathons',
  hackathn: 'hackathon',
  hckathon: 'hackathon',
  codng: 'coding',
  workshp: 'workshop',
  wrkshop: 'workshop',
  worlshop: 'workshop',
  workshps: 'workshops',
  confernce: 'conference',
  symposim: 'symposium',
  compitition: 'competition',
  competiton: 'competition',
  competetion: 'competition',
  internshp: 'internship',
  intrnship: 'internship',
  coimbtore: 'coimbatore',
  coimbator: 'coimbatore',
  chenai: 'chennai',
  banglore: 'bengaluru',
  hyderbad: 'hyderabad'
};

/**
 * Preprocess and normalize a search query string.
 */
function normalizeQuery(rawQuery) {
  if (!rawQuery) return '';
  let q = decodeHtmlEntities(rawQuery).trim().toLowerCase();
  
  // Replace high-confidence typos
  const words = q.split(/\s+/);
  const correctedWords = words.map(w => {
    const cleaned = w.replace(/[^a-z0-9]/g, '');
    return TYPO_MAP[cleaned] || w;
  });
  
  return correctedWords.join(' ');
}

/**
 * Checks if an event is strictly free based on its structured price fields.
 */
function isEventFree(event) {
  if (!event) return false;
  if (event.price_numeric !== undefined && event.price_numeric !== null) {
    return Number(event.price_numeric) === 0;
  }
  if (typeof event.price === 'string') {
    const p = decodeHtmlEntities(event.price).toLowerCase().trim();
    return p === 'free' || p === '₹0' || p === '0' || p === 'rs 0' || p === 'rs. 0';
  }
  return false;
}

/**
 * Validates candidate events against extracted structured constraints.
 * Strictly checks actual database/model attributes (price, mode, location).
 */
function validateStructuredConstraints(event, appliedSlots) {
  if (!event || !appliedSlots) return true;

  // 1. Price Constraint (Strict validation against structured price fields)
  if (appliedSlots.is_free) {
    if (!isEventFree(event)) {
      return false;
    }
  } else if (appliedSlots.is_paid) {
    if (isEventFree(event)) {
      return false;
    }
  }

  // 2. Mode Constraint (Strict validation against structured mode field)
  if (appliedSlots.mode) {
    const reqMode = String(appliedSlots.mode).toUpperCase();
    const eventMode = String(event.mode || 'OFFLINE').toUpperCase();
    const isVirtual = event.is_virtual === 1 || String(event.location || '').toLowerCase() === 'online';
    
    if (reqMode === 'ONLINE' && eventMode !== 'ONLINE' && !isVirtual) {
      return false;
    }
    if (reqMode === 'OFFLINE' && eventMode !== 'OFFLINE') {
      return false;
    }
  }

  // 3. Location Constraint (Strict validation against structured location field)
  if (appliedSlots.location) {
    const reqLoc = String(appliedSlots.location).toLowerCase();
    const eventLoc = String(event.location || '').toLowerCase();
    const eventVenue = String(event.venue || '').toLowerCase();
    const eventCollege = String(event.college || '').toLowerCase();
    
    if (reqLoc === 'online') {
      const isOnline = (event.mode || '').toUpperCase() === 'ONLINE' || event.is_virtual === 1 || eventLoc === 'online';
      if (!isOnline) return false;
    } else {
      const matchesLoc = eventLoc.includes(reqLoc) || eventVenue.includes(reqLoc) || eventCollege.includes(reqLoc);
      if (!matchesLoc) return false;
    }
  }

  return true;
}

module.exports = {
  decodeHtmlEntities,
  EXPANDED_CATEGORIES,
  EXPANDED_LOCATIONS,
  EXPANDED_MODES,
  TYPO_MAP,
  normalizeQuery,
  isEventFree,
  validateStructuredConstraints
};


