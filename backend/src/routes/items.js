const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { updateStats } = require("./stats");

const router = express.Router();
const DATA_PATH = path.join(__dirname, "../../../data/items.json");

// Load items.json with error safety
async function readItems() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("Failed to load items database");
  }
}

// Save items.json safely
async function writeItems(items) {
  try {
    await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2));
  } catch (err) {
    throw new Error("Failed to save items database");
  }
}

// GET api/items  (pagination + search)
router.get("/", async (req, res, next) => {
  try {
    const items = await readItems();
    const { page, pageSize, q } = req.query;

    let results = items;

    // Search filter
    if (q) {
      const search = q.toLowerCase();
      results = results.filter((item) => {
        const name = item?.name?.toLowerCase() || "";
        return name.includes(search);
      });
    }

    // If NO pagination params provided → return ALL items
    if (!page && !pageSize) {
      return res.json({
        items: results,
        total: results.length,
      });
    }

    // Otherwise apply pagination
    const p = parseInt(page) || 1;
    const ps = parseInt(pageSize) || 10;

    const start = (p - 1) * ps;
    const paginated = results.slice(start, start + ps);

    res.json({
      items: paginated,
      total: results.length,
      page: p,
      pageSize: ps,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const items = await readItems();
    const item = items.find((i) => i.id === id);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post("/", async (req, res, next) => {
  try {
    const { name, price, category } = req.body;

    // Validation
    if (!name || price === undefined) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    // Ensure price is a valid number
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
      return res.status(400).json({ error: "Price must be a valid number" });
    }

    const items = await readItems();

    const newItem = {
      id: Date.now(),
      name,
      price: numericPrice,
      category: category || "General",
    };

    items.push(newItem);
    await writeItems(items);

    // Update stats after adding item
    updateStats(items);

    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
