import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom"; // required

import ItemDetail from "../pages/ItemDetail";

// Mock fetch globally
global.fetch = jest.fn();

// Mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("ItemDetail Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders skeleton loader while loading", () => {
    fetch.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/item/123"]}>
        <Routes>
          <Route path="/item/:id" element={<ItemDetail />} />
        </Routes>
      </MemoryRouter>
    );

    const skeletonElements = document.querySelectorAll(
      '[style*="rgb(227, 227, 227)"]'
    );

    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  test("fetches and displays item", async () => {
    const mockItem = {
      id: "123",
      name: "Test Item",
      category: "Electronics",
      price: 99.99,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItem,
    });

    render(
      <MemoryRouter initialEntries={["/item/123"]}>
        <Routes>
          <Route path="/item/:id" element={<ItemDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Test Item")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/items/123"
    );
  });

  test("navigates home on error", async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    render(
      <MemoryRouter initialEntries={["/item/123"]}>
        <Routes>
          <Route path="/item/:id" element={<ItemDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
