import React, { useEffect, useState, useMemo } from "react";
import { useData } from "../state/DataContext";
import { Link } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import "../style/items.css";

function Items() {
  const { items, fetchItems } = useData();
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Add Item Dropdown Form States
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", price: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchItems(controller.signal);
    return () => controller.abort();
  }, [fetchItems]);

  useEffect(() => {
    if (items.length > 0) setLoading(false);
  }, [items]);

  /** SEARCH */
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const name = item?.name?.toLowerCase() || "";
      return name.includes(search.toLowerCase());
    });
  }, [items, search]);

  /** PAGINATION */
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page]);

  /** Skeleton Row */
  const SkeletonRow = ({ style }) => (
    <div className="item-row skeleton-row" style={style}>
      <div className="skeleton-bar" />
    </div>
  );

  /** Real Row */
  const Row = ({ index, style }) => {
    const item = paginatedItems[index];
    if (!item) return null;

    return (
      <div className="item-row" style={style}>
        <Link className="item-link" to={`/items/${item.id}`}>
          {item.name}
        </Link>
      </div>
    );
  };

  return (
    <div className="items-container">
      {/* TITLE + ADD BUTTON */}
      <div className="items-header">
        <h2 className="items-title">Items List</h2>

        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "+ Add Item"}
        </button>
      </div>
      {/*Add Item Modal*/}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Item</h3>

            <div className="modal-inputs">
              <input
                type="text"
                className="modal-input"
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />

              <input
                type="number"
                className="modal-input"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
              />

              <select
                className="modal-select"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
              >
                <option value="Furniture">Furniture</option>
                <option value="Electronics">Electronics</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="modal-buttons">
              <button
                className="submit-btn"
                disabled={saving}
                onClick={async () => {
                  if (!newItem.name || !newItem.price)
                    return alert("Please fill all fields");

                  setSaving(true);
                  try {
                    await fetch("http://localhost:3001/api/items", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(newItem),
                    });

                    setNewItem({ name: "", price: "", category: "General" });
                    setShowForm(false);
                    fetchItems();
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : "Submit"}
              </button>

              <button className="cancel-btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 SEARCH BAR */}
      <input
        type="text"
        className="search-box"
        placeholder="Search items..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {/* LOADING */}
      {loading ? (
        <List height={450} width={"100%"} itemSize={40} itemCount={10}>
          {SkeletonRow}
        </List>
      ) : (
        <>
          {/* EMPTY SEARCH RESULT */}
          {filteredItems.length === 0 && search.length > 0 ? (
            <div className="empty-state search-empty">
              <h2>No items found</h2>
              <p>Try searching for something else.</p>
            </div>
          ) : (
            <>
              {/* LIST */}
              <List
                height={350}
                width={"100%"}
                itemSize={40}
                itemCount={paginatedItems.length}
              >
                {Row}
              </List>

              {/* PAGINATION */}
              {filteredItems.length > 0 && (
                <div className="pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </button>

                  <span>
                    Page {page} of {totalPages}
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Items;
