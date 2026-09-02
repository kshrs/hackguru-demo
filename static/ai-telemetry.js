/**
 * HackGURU - AI Behavioral Telemetry & Dynamic Feed Rendering Engine
 * Handles:
 * 1. Viewport Dwell Time Tracking via IntersectionObserver.
 * 2. Real-time Interaction Logging to Node.js Gateway (POST /api/v1/interactions).
 * 3. Dynamic AI Recommendation Feed Rendering (GET /api/v1/recommendations).
 * 4. Deterministic Explainability & Evidence Badge Visual Mapping.
 */

(function () {
  "use strict";

  // Determine Gateway API Base URL
  const GATEWAY_URL = window.HACKGURU_GATEWAY_URL || "http://localhost:5000";
  const USER_ID = localStorage.getItem("hackguru_user_id") || "usr_kishor";

  // Telemetry state tracking
  const activeViews = new Map(); // element -> { eventId, enterTime }
  const reportedDwells = new Set(); // deduplicate rapid re-entries

  /**
   * Dispatches interaction telemetry to Node.js Gateway
   */
  async function logInteraction(eventId, interactionType, dwellSeconds = 0, metadata = {}) {
    if (!eventId) return;
    try {
      await fetch(`${GATEWAY_URL}/api/v1/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          event_id: Number(eventId),
          interaction_type: interactionType,
          dwell_time_seconds: Math.round(dwellSeconds),
          metadata: metadata
        })
      });
      console.log(`[AI Telemetry] Logged ${interactionType} for event #${eventId} (dwell: ${dwellSeconds}s)`);
    } catch (err) {
      console.warn(`[AI Telemetry] Gateway unavailable:`, err.message);
    }
  }

  /**
   * Initializes IntersectionObserver for Dwell-Time Tracking
   */
  let observer = null;
  function setupViewportObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target;
          const eventId = card.getAttribute("data-event-id") || card.getAttribute("data-id");
          if (!eventId) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Card entered viewport
            if (!activeViews.has(card)) {
              activeViews.set(card, {
                eventId: Number(eventId),
                enterTime: Date.now()
              });
            }
          } else {
            // Card exited viewport
            if (activeViews.has(card)) {
              const view = activeViews.get(card);
              const dwellSeconds = (Date.now() - view.enterTime) / 1000.0;
              activeViews.delete(card);

              // Only log meaningful views (> 2.0s)
              if (dwellSeconds >= 2.0) {
                logInteraction(view.eventId, "view", dwellSeconds);
              }
            }
          }
        });
      },
      { threshold: [0.5] }
    );

    document.querySelectorAll(".modern-card").forEach((card) => observer.observe(card));
  }

  /**
   * Maps evidence badges to visual color palettes
   */
  function getBadgeStyle(badgeText, isExploration, tags) {
    const text = (badgeText || "").toLowerCase();

    // 1. Explore/Exploit Model (Amber)
    if (isExploration || text.includes("explore") || text.includes("popular in") || text.includes("out of your usual")) {
      return {
        bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        color: "#92400E",
        border: "#F59E0B",
        icon: "⚡",
        label: badgeText ? `${badgeText}` : "Explore Something New / Out of your usual zone"
      };
    }

    // 2. Current Session (Short-term cache) (Blue)
    if (text.includes("session") || text.includes("recent clicks") || text.includes("based on your")) {
      return {
        bg: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
        color: "#1E40AF",
        border: "#3B82F6",
        icon: "⏱️",
        label: "Based on your recent clicks"
      };
    }

    // 3. Micro Genres (Emerald Green)
    if (text.includes("&") || text.includes("niche match")) {
      const parts = (badgeText || "").split("&");
      const tag = parts.length > 1 ? parts[1].trim() : (tags && tags[0]) || "AI Systems";
      return {
        bg: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
        color: "#065F46",
        border: "#10B981",
        icon: "🎯",
        label: `Niche match: ${tag}`
      };
    }

    // 4. Algorithmic Push / Explicit Feedback (Purple)
    if (text.includes("college") || text.includes("attended") || text.includes("interest")) {
      return {
        bg: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
        color: "#5B21B6",
        border: "#8B5CF6",
        icon: "🏛️",
        label: badgeText || "Recommended because you attended similar AI workshops"
      };
    }

    // Default Fallback
    return {
      bg: "#F3E8FF",
      color: "#6D28D9",
      border: "#C4B5FD",
      icon: "✨",
      label: badgeText || "Curated for You"
    };
  }

  /**
   * Clones and renders a personalized card element matching scraped CSS
   */
  function createPersonalizedCard(recItem) {
    const e = recItem.event || {};
    const eId = e.id || 1;
    const badgeStyle = getBadgeStyle(recItem.badge || recItem.reason, recItem.is_exploration);

    const article = document.createElement("article");
    article.className = "modern-card ai-recommended-card";
    article.setAttribute("role", "button");
    article.setAttribute("tabindex", "0");
    article.setAttribute("aria-label", `View event: ${e.title || ""}`);
    article.setAttribute("data-event-id", eId);
    article.setAttribute("data-id", eId);
    article.setAttribute("data-category", (e.category || "").toLowerCase());
    article.setAttribute("data-mode", (e.mode || "offline").toLowerCase());
    article.setAttribute("data-location", (e.location || "").toLowerCase());
    article.setAttribute("data-price", String(e.price || "").toLowerCase().includes("free") ? "free" : "paid");
    article.setAttribute("data-views", e.views_count || 100);
    article.setAttribute("data-title", (e.title || "").toLowerCase());

    const isFree = String(e.price || "").toLowerCase().includes("free") || e.price === "0" || e.price === "₹0" || !e.price;
    const priceCls = isFree ? "price-free" : "price-paid";
    const priceText = isFree ? "Free" : e.price || "₹600";
    const imgSrc = e.image_url || "/static/ace_files/dfa7a08a-4016-4409-aefa-a87b4000da9a-ECLearnix---Hero-Section-Banners.png";

    article.innerHTML = `
      <div class="modern-image">
        <img alt="${e.title || ""}" loading="lazy" src="${imgSrc}">
        <span class="mode-overlay-badge">${(e.mode || "OFFLINE").toUpperCase()}</span>
        <button class="image-like-btn" aria-label="Like" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 24 24" fill="none" style="cursor: pointer;">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="#3D3D3D" stroke-width="2"></path>
          </svg>
        </button>
      </div>
      <div class="modern-content">
        <!-- AI EVIDENCE BADGE (OFFICIAL CHECKLIST ALIGNED) -->
        <div style="margin-bottom: 8px;">
          <span class="ai-evidence-pill" style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; background: ${badgeStyle.bg}; color: ${badgeStyle.color}; border: 1px solid ${badgeStyle.border}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <span>${badgeStyle.icon}</span>
            <span>${badgeStyle.label}</span>
          </span>
        </div>

        <div class="modern-title-row">
          <h4 class="modern-title">${e.title || ""}</h4>
          <div class="modern-actions">
            <button class="save-btn" aria-label="Save" aria-pressed="false">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 24 24" fill="none" style="cursor: pointer;">
                <path d="M6 2C4.89543 2 4 2.89543 4 4V22C4 22.3795 4.214 22.725 4.553 22.894C4.892 23.063 5.298 23.026 5.6 22.8L12 18L18.4 22.8C18.702 23.026 19.108 23.063 19.447 22.894C19.786 22.725 20 22.3795 20 22V4C20 2.89543 19.1046 2 18 2H6Z" fill="transparent" stroke="#3D3D3D" stroke-width="1.8" stroke-linejoin="round"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="modern-desc"><p>${e.description || ""}</p></div>
        <div class="card-info-rows">
          <div class="info-row">
            <span class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 14" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5.67715C0 2.5498 2.49282 0 5.58568 0C8.67854 0 11.1714 2.5498 11.1714 5.67715C11.1714 7.18695 10.7411 8.80808 9.98046 10.2086C9.22077 11.6074 8.11081 12.8229 6.72229 13.472C6.00098 13.8091 5.17038 13.8091 4.44907 13.472C3.06055 12.8229 1.9506 11.6074 1.1909 10.2086C0.430275 8.80808 0 7.18695 0 5.67715Z" fill="#1C1C1C"></path></svg>
              <span class="meta-text">${e.location || "India"}</span>
            </span>
            <span class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M9.93329 8.18422C10.2561 8.18422 10.5178 7.92251 10.5178 7.59967C10.5178 7.27683 10.2561 7.01512 9.93329 7.01512C9.61045 7.01512 9.34873 7.27683 9.34873 7.59967C9.34873 7.92251 9.61045 8.18422 9.93329 8.18422Z" fill="#1C1C1C"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4.08775 1.02344C4.32988 1.02344 4.52616 1.21972 4.52616 1.46185V1.9077C4.91314 1.90026 5.33947 1.90026 5.80836 1.90027H8.2126C8.68151 1.90026 9.1079 1.90026 9.49487 1.9077V1.46185C9.49487 1.21972 9.69116 1.02344 9.93329 1.02344C10.1754 1.02344 10.3717 1.21972 10.3717 1.46185V1.94533C10.5237 1.95692 10.6675 1.97148 10.8037 1.98978C11.489 2.08193 12.0438 2.27607 12.4812 2.71353C12.9187 3.15098 13.1128 3.7057 13.205 4.39104C13.2945 5.05697 13.2945 5.90786 13.2945 6.98211V8.2172C13.2945 9.29146 13.2945 10.1424 13.205 10.8083C13.1128 11.4936 12.9187 12.0484 12.4812 12.4858C12.0438 12.9233 11.489 13.1174 10.8037 13.2096C10.1378 13.2991 9.28689 13.2991 8.21263 13.2991H5.80844C4.73418 13.2991 3.88326 13.2991 3.21733 13.2096C2.53199 13.1174 1.97728 12.9233 1.53982 12.4858C1.10236 12.0484 0.90822 11.4936 0.816078 10.8083C0.726546 10.1424 0.726553 9.29147 0.726563 8.2172V6.98214C0.726553 5.90787 0.726546 5.05697 0.816078 4.39104C0.90822 3.7057 1.10236 3.15098 1.53982 2.71353C1.97728 2.27607 2.53199 2.08193 3.21733 1.98978C3.35349 1.97148 3.49738 1.95692 3.64933 1.94533V1.46185C3.64933 1.21972 3.84562 1.02344 4.08775 1.02344ZM3.33417 2.8588C2.74606 2.93787 2.40722 3.08615 2.15983 3.33354C1.91244 3.58093 1.76416 3.91976 1.68509 4.50787C1.6717 4.60748 1.6605 4.71233 1.65114 4.82304H12.3699C12.3605 4.71233 12.3493 4.60748 12.3359 4.50788C12.2569 3.91976 12.1086 3.58093 11.8612 3.33354C11.6138 3.08615 11.275 2.93787 10.6869 2.8588C10.0861 2.77803 9.29427 2.7771 8.17963 2.7771H5.84141C4.72677 2.7771 3.9349 2.77803 3.33417 2.8588ZM1.60339 7.01512C1.60339 6.5159 1.60358 6.08142 1.61104 5.69987H12.41C12.4175 6.08142 12.4176 6.5159 12.4176 7.01512V8.18422C12.4176 9.29886 12.4167 10.0907 12.3359 10.6915C12.2569 11.2796 12.1086 11.6184 11.8612 11.8658C11.6138 12.1132 11.275 12.2615 10.6869 12.3405C10.0861 12.4213 9.29427 12.4222 8.17963 12.4222H5.84141C4.72677 12.4222 3.93489 12.4213 3.33417 12.3405C2.74606 12.2615 2.40722 12.1132 2.15983 11.8658C1.91244 11.6184 1.76416 11.2796 1.68509 10.6915C1.60432 10.0907 1.60339 9.29886 1.60339 8.18422V7.01512Z" fill="#1C1C1C"></path></svg>
              <span>${e.date || "2026"}</span>
            </span>
          </div>
        </div>
        <div class="card-divider"></div>
        <div class="modern-footer-new">
          <div class="footer-left-group">
            <span class="modern-category-badge" style="background: rgb(245, 243, 255); color: rgb(109, 40, 217); border: 1px solid rgb(221, 214, 254);">${e.category || "Academic & Professional"}</span>
            <span class="modern-status" style="background: rgb(243, 244, 246); color: rgb(31, 41, 55); border: 1px solid rgb(229, 231, 235);">Upcoming</span>
            <span class="meta-item views-meta">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 8 6" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 2.85833C0.520217 1.20173 2.0678 0 3.89632 0C5.72483 0 7.27242 1.20173 7.79263 2.85833C7.27242 4.51494 5.72483 5.71667 3.89632 5.71667C2.0678 5.71667 0.520217 4.51494 0 2.85833ZM5.52965 2.85833C5.52965 3.29152 5.35757 3.70697 5.05126 4.01328C4.74495 4.31958 4.3295 4.49167 3.89632 4.49167C3.46313 4.49167 3.04769 4.31958 2.74138 4.01328C2.43507 3.70697 2.26298 3.29152 2.26298 2.85833C2.26298 2.42515 2.43507 2.0097 2.74138 1.70339C3.04769 1.39708 3.46313 1.225 3.89632 1.225C4.3295 1.225 4.74495 1.39708 5.05126 1.70339C5.35757 2.0097 5.52965 2.42515 5.52965 2.85833Z" fill="#3D3D3D"></path></svg>
              <span>${e.views_count || "100"}</span>
            </span>
          </div>
          <span class="modern-price ${priceCls}">${priceText}</span>
        </div>
      </div>
    `;

    // Click handler for card modal + interaction logging
    article.addEventListener("click", (ev) => {
      if (ev.target.closest(".image-like-btn") || ev.target.closest(".save-btn")) return;
      logInteraction(eId, "view", 3.0);
      if (typeof window.openEventModal === "function") {
        window.openEventModal(e);
      }
    });

    // Bookmark / Save button click
    const saveBtn = article.querySelector(".save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const isSaved = saveBtn.getAttribute("aria-pressed") === "true";
        saveBtn.setAttribute("aria-pressed", !isSaved ? "true" : "false");
        const svgPath = saveBtn.querySelector("path");
        if (svgPath) {
          svgPath.setAttribute("fill", !isSaved ? "#7F00FF" : "transparent");
          svgPath.setAttribute("stroke", !isSaved ? "#7F00FF" : "#3D3D3D");
        }
        logInteraction(eId, "bookmark", 0);
      });
    }

    return article;
  }

  /**
   * Fetches personalized recommendation feed from Node.js Gateway
   */
  async function loadPersonalizedFeed() {
    const container = document.querySelector(".events-list");
    const countChip = document.querySelector(".results-count-chip strong");
    if (!container) return;

    try {
      console.log(`[AI Engine] Fetching personalized recommendations from ${GATEWAY_URL}/api/v1/recommendations...`);
      const res = await fetch(`${GATEWAY_URL}/api/v1/recommendations?user_id=${USER_ID}&limit=8`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data && data.success && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        console.log(`[AI Engine] Received ${data.recommendations.length} recommendations in ${data.gateway_latency_ms || data.latency_ms}ms.`);

        // Clear hardcoded cards
        container.innerHTML = "";

        // Render AI cards
        data.recommendations.forEach((item) => {
          container.appendChild(createPersonalizedCard(item));
        });

        if (countChip) {
          countChip.innerText = data.recommendations.length;
        }

        // Setup telemetry observer on newly rendered cards
        setupViewportObserver();
      }
    } catch (err) {
      console.warn(`[AI Engine] Falling back to default feed:`, err.message);
      // Keep existing cards and still setup viewport observer
      setupViewportObserver();
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadPersonalizedFeed();
    });
  } else {
    loadPersonalizedFeed();
  }

  // Export for debugging/inspection in browser DevTools
  window.HackGuruAI = {
    logInteraction,
    loadPersonalizedFeed,
    getUserId: () => USER_ID
  };
})();
