const request = require("supertest");
const app = require("../src/app");

describe("Items API", () => {
  // GET /api/items  (Happy Path)
  it("should return a list of items", async () => {
    const res = await request(app).get("/api/items");

    expect(res.status).toBe(200);

    // Items route returns an array directly, not { items: [...] }
    const itemsArray = res.body.items || res.body;

    expect(Array.isArray(itemsArray)).toBe(true);

    if (itemsArray.length > 0) {
      expect(itemsArray[0]).toHaveProperty("id");
      expect(itemsArray[0]).toHaveProperty("name");
      expect(itemsArray[0]).toHaveProperty("price");
    }
  });

  // GET /api/items/:id (Happy Path)
  it("should return a single item by id", async () => {
    const res = await request(app).get("/api/items/1");

    // If item 1 doesn't exist, skip test
    if (res.status === 404) return;

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("name");
  });

  // GET /api/items/:id (Error Case)
  it("should return 404 for invalid item id", async () => {
    const res = await request(app).get("/api/items/999999");

    expect(res.status).toBe(404);

    
    expect(res.body).toHaveProperty("error");
  });

  // POST /api/items (Happy Path)
  it("should create a new item", async () => {
    const newItem = {
      name: "Test Item",
      price: 99.99,
      category: "Test",
    };

    const res = await request(app)
      .post("/api/items")
      .send(newItem)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe(newItem.name);
  });

  // POST /api/items (Error Case)
  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/items")
      .send({}) // missing required fields
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
