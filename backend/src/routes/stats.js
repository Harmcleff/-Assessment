const express = require('express');
const router = express.Router();

// In-memory stats cache (updated by item router)
let cachedStats = {
  total: 0,
  averagePrice: 0
};

/**
 * Safely updates the cached statistics.
 * Handles invalid entries and non-numeric prices gracefully.
 */
function updateStats(items) {
  if (!Array.isArray(items)) {
    // Fail-safe: reset stats if corrupted
    cachedStats = { total: 0, averagePrice: 0 };
    return;
  }

  const validPrices = items
    .map(i => Number(i.price))
    .filter(n => !isNaN(n));

  cachedStats.total = items.length;

  cachedStats.averagePrice =
    validPrices.length === 0
      ? 0
      : validPrices.reduce((acc, cur) => acc + cur, 0) / validPrices.length;
}

/**
 * GET /api/stats
 * Returns cached stats with safety validation.
 */
router.get('/', (req, res) => {
  try {
    // Fail-safe: repair missing or invalid stats
    if (
      typeof cachedStats.total !== "number" ||
      typeof cachedStats.averagePrice !== "number"
    ) {
      cachedStats = { total: 0, averagePrice: 0 };
    }

    res.json(cachedStats);
  } catch (err) {
    // Server error fallback
    res.status(500).json({ error: "Failed to retrieve statistics" });
  }
});

module.exports = { router, updateStats };
