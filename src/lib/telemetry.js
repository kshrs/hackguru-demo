/**
 * Behavioral Telemetry & Dwell Time Tracking for HackGuru Next.js Frontend
 * Dispatches real-time view, dwell time, and bookmark events to Node.js Gateway (:5000)
 */

const GATEWAY_URL = typeof window !== "undefined" && (window.HACKGURU_GATEWAY_URL || "http://127.0.0.1:5000");

export async function logTelemetryInteraction({
  userId = "usr_kishor",
  eventId,
  interactionType = "view",
  weight = interactionType === "bookmark" ? 3.0 : 1.0,
  dwellSeconds = 0,
  metadata = {}
}) {
  if (!eventId) return;

  const payload = {
    user_id: userId,
    event_id: Number(eventId),
    interaction_type: interactionType,
    weight: Number(weight),
    dwell_time_seconds: Math.round(dwellSeconds),
    metadata
  };

  try {
    // 1. Direct call to Node.js Gateway
    const res = await fetch(`${GATEWAY_URL}/api/v1/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload)
    });
    return res;
  } catch (err) {
    // Gateway fallback
    try {
      if (interactionType === "bookmark") {
        return await fetch("/api/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ eventId: Number(eventId), userId })
        });
      }
    } catch (_) {}
  }
}

/**
 * Returns badge styling based on official checklist
 */
export function getBadgeVisualProps(badgeText, isExploration, tags) {
  const text = (badgeText || "").toLowerCase();

  // 1. Explore Something New (Amber)
  if (isExploration || text.includes("explore") || text.includes("popular in") || text.includes("out of your usual")) {
    return {
      bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
      color: "#92400E",
      border: "#F59E0B",
      icon: "⚡",
      label: badgeText ? `${badgeText}` : "Explore Something New: Out of your usual zone"
    };
  }

  // 2. Current Session / Recent Clicks (Blue)
  if (text.includes("session") || text.includes("recent clicks") || text.includes("based on your")) {
    return {
      bg: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
      color: "#1E40AF",
      border: "#3B82F6",
      icon: "⏱️",
      label: "Based on your recent clicks"
    };
  }

  // 3. Micro Genres / Niche Match (Emerald Green)
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

  // 4. Algorithmic Push / Explicit Feedback (Deep Purple)
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
