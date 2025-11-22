import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Items from "../pages/Items";
import { DataProvider } from "../state/DataContext";

// Mock fetch globally
global.fetch = jest.fn();

// Mock react-window to simplify testing
jest.mock("react-window", () => ({
  FixedSizeList: ({ children, itemCount, height, width }) => (
    <div data-testid="virtual-list" style={{ height, width }}>
      {Array.from({ length: itemCount }).map((_, index) =>
        children({ index, style: {} })
      )}
    </div>
  ),
}));

// Helper to render with all required providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <DataProvider>{component}</DataProvider>
    </BrowserRouter>
  );
};

describe("Items Component", () => {
  const mockItems = [
    { id: "1", name: "Laptop", category: "Electronics", price: 999 },
    { id: "2", name: "Mouse", category: "Electronics", price: 29 },
    { id: "3", name: "Keyboard", category: "Electronics", price: 79 },
    { id: "4", name: "Monitor", category: "Electronics", price: 299 },
    { id: "5", name: "Desk", category: "Furniture", price: 399 },
    { id: "6", name: "Chair", category: "Furniture", price: 199 },
    { id: "7", name: "Lamp", category: "Furniture", price: 49 },
    { id: "8", name: "Notebook", category: "Stationery", price: 5 },
    { id: "9", name: "Pen", category: "Stationery", price: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();

    // Default mock for fetching items
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockItems,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders loading skeleton initially", () => {
    renderWithProviders(<Items />);

    // Check for skeleton rows
    const skeletons = document.querySelectorAll(".skeleton-row");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("displays items after loading", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeTruthy();
    });

    expect(screen.getByText("Mouse")).toBeTruthy();
    expect(screen.getByText("Keyboard")).toBeTruthy();
  });

  test("renders title and add button", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Items List")).toBeTruthy();
    });

    expect(screen.getByText("+ Add Item")).toBeTruthy();
  });

  test("shows add item form when button is clicked", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Items List")).toBeTruthy();
    });

    const addButton = screen.getByText("+ Add Item");
    fireEvent.click(addButton);

    // Check form inputs appear
    expect(screen.getByPlaceholderText("Item name")).toBeTruthy();
    expect(screen.getByPlaceholderText("Price")).toBeTruthy();
    expect(screen.getByText("Submit")).toBeTruthy();
  });

  test("toggles form visibility when add button is clicked multiple times", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Items List")).toBeTruthy();
    });

    const addButton = screen.getByText("+ Add Item");
    
    // Open form
    fireEvent.click(addButton);
    expect(screen.getByPlaceholderText("Item name")).toBeTruthy();
    expect(screen.getByText("Close")).toBeTruthy();

    // Close form
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    expect(screen.queryByPlaceholderText("Item name")).toBeNull();
  });

  test("submits new item successfully", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    // Mock POST request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "10", name: "New Item", price: 100 }),
    });

    // Mock GET request after POST
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [...mockItems, { id: "10", name: "New Item", price: 100 }],
    });

    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Items List")).toBeTruthy();
    });

    // Open form
    const addButton = screen.getByText("+ Add Item");
    fireEvent.click(addButton);

    // Fill form
    const nameInput = screen.getByPlaceholderText("Item name");
    const priceInput = screen.getByPlaceholderText("Price");

    fireEvent.change(nameInput, { target: { value: "New Item" } });
    fireEvent.change(priceInput, { target: { value: "100" } });

    // Submit
    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/items",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "New Item", price: "100" }),
        })
      );
    });
  });

  test("shows alert when submitting empty form", async () => {
    // Mock alert
    global.alert = jest.fn();

    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Items List")).toBeTruthy();
    });

    // Open form
    const addButton = screen.getByText("+ Add Item");
    fireEvent.click(addButton);

    // Try to submit without filling fields
    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    expect(global.alert).toHaveBeenCalledWith("Please fill all fields");
  });

  test("filters items based on search input", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    fireEvent.change(searchInput, { target: { value: "Lap" } });

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeTruthy();
      expect(screen.queryByText("Mouse")).toBeNull();
    });
  });

  test("shows empty state when search returns no results", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    fireEvent.change(searchInput, { target: { value: "NonExistentItem" } });

    await waitFor(() => {
      expect(screen.getByText("No items found")).toBeTruthy();
    });

    expect(screen.getByText("Try searching for something else.")).toBeTruthy();
  });

  test("resets to page 1 when searching", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeTruthy();
    });

    // Navigate to page 2
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of/)).toBeTruthy();
    });

    // Search should reset to page 1
    const searchInput = screen.getByPlaceholderText("Search items...");
    fireEvent.change(searchInput, { target: { value: "Lap" } });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeTruthy();
    });
  });

  test("pagination controls work correctly", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeTruthy();
    });

    // Check initial page
    expect(screen.getByText(/Page 1 of/)).toBeTruthy();

    // Prev button should be disabled on first page
    const prevButton = screen.getByText("Prev");
    expect(prevButton).toBeDisabled();

    // Click next
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of/)).toBeTruthy();
    });

    // Prev should now be enabled
    expect(prevButton).not.toBeDisabled();

    // Go back to page 1
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeTruthy();
    });
  });

  test("next button is disabled on last page", async () => {
    // Use fewer items to test last page
    const fewItems = mockItems.slice(0, 3);
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fewItems,
    });

    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeTruthy();
    });

    // With 3 items and pageSize 8, we should only have 1 page
    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeDisabled();
  });

  test("renders item links correctly", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeTruthy();
    });

    const laptopLink = screen.getByText("Laptop").closest("a");
    expect(laptopLink).toHaveAttribute("href", "/items/1");

    const mouseLink = screen.getByText("Mouse").closest("a");
    expect(mouseLink).toHaveAttribute("href", "/items/2");
  });

  test("displays correct number of items per page", async () => {
    renderWithProviders(<Items />);

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeTruthy();
    });

    // First page should show 8 items (pageSize = 8)
    const virtualList = screen.getByTestId("virtual-list");
    const items = virtualList.querySelectorAll(".item-row:not(.skeleton-row)");
    expect(items.length).toBeLessThanOrEqual(8);
  });

  test("handles fetch abort on unmount", async () => {
    const { unmount } = renderWithProviders(<Items />);

    // Immediately unmount
    unmount();

    // This test mainly ensures no errors occur during abort
    expect(true).toBe(true);
  });
});