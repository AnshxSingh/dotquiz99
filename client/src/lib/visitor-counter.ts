// Visitor Counter - Tracks unique visitors using localStorage and timestamp
const VISITOR_COUNT_KEY = "dotquiz_visitor_count";
const VISITOR_ID_KEY = "dotquiz_visitor_id";
const LAST_VISIT_KEY = "dotquiz_last_visit";

/**
 * Generate a unique visitor ID
 */
function generateVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize visitor tracking
 * Returns the current total visitor count
 */
export function initializeVisitorCounter(): number {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const currentTime = Date.now();

    // If no visitor ID exists, create one (new visitor)
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);

      // Increment visitor count for new visitor
      let count = parseInt(localStorage.getItem(VISITOR_COUNT_KEY) || "0", 10);
      count++;
      localStorage.setItem(VISITOR_COUNT_KEY, count.toString());
    }

    // Update last visit timestamp
    localStorage.setItem(LAST_VISIT_KEY, currentTime.toString());

    // Return current count
    return parseInt(localStorage.getItem(VISITOR_COUNT_KEY) || "1", 10);
  } catch (error) {
    console.error("Error initializing visitor counter:", error);
    return 0;
  }
}

/**
 * Get the current visitor count
 */
export function getVisitorCount(): number {
  try {
    return parseInt(localStorage.getItem(VISITOR_COUNT_KEY) || "0", 10);
  } catch (error) {
    console.error("Error getting visitor count:", error);
    return 0;
  }
}

/**
 * Reset visitor counter (for testing/admin purposes)
 */
export function resetVisitorCounter(): void {
  try {
    localStorage.removeItem(VISITOR_COUNT_KEY);
    localStorage.removeItem(VISITOR_ID_KEY);
    localStorage.removeItem(LAST_VISIT_KEY);
  } catch (error) {
    console.error("Error resetting visitor counter:", error);
  }
}

/**
 * Format the visitor count with proper grammar
 */
export function formatVisitorCount(count: number): string {
  if (count === 1) return "1 visitor";
  return `${count.toLocaleString()} visitors`;
}
