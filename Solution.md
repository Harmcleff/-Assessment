# SOLUTION.md

## 1. Backend Improvements

### 1.1 Replaced Blocking I/O With Async I/O

Originally, the backend used synchronous filesystem operations (`readFileSync`, `writeFileSync`), blocking the event loop during file access.

**Fix:** All file interactions were rewritten using:
* `fs.promises.readFile`
* `fs.promises.writeFile`
* `async/await`

**Trade-off:** Non-blocking I/O increases scalability but introduces async complexity (promises/errors), which was handled via `try/catch` and `next(err)`.

### 1.2 Removed Unnecessary Recalculation on Every Request

Previously, `/api/stats` recomputed:
* `total`
* `averagePrice`

on every request — even when no data changed.

**Fix:** Stats are now cached in memory. Recalculations occur only when:
* `/api/items` adds a new item

**Trade-off:** In-memory caching is fast and simple but does not persist across server restarts. 

### 1.3 Eliminated Repeated Disk Reads

Previously, `/api/stats` recalculated the statistics by reloading `items.json` on every request.
This caused unnecessary disk access and redundant computation.

**Fix:** `stats.js` no longer reads the file at all. Instead, the Items router updates statistics once whenever items change using updateStats(items)

**Trade-off:** Small memory footprint, Only updated when item mutations occur (POST).

### 1.4 Introduced Safe Cache Invalidation

When the items file is updated via POST, the stats cache regenerates using `updateStats()`.

**Trade-off:** Centralized update logic requires consistent usage, but improves correctness.

### 1.5 Improved Error Handling

All routes now use:
* `try/catch`
* `next(err)` for Express error middleware
* Validation checks (`name`, `price`, invalid IDs)

This ensures clean failure modes and predictable API responses.

---

## 2. Frontend Fixes

### 2.1 Fixed Memory Leak in Items.js

The Items page continued running fetch requests after unmount, causing:
* Memory leaks
* React warnings
* Useless network calls

**Fix:** Added an `AbortController` and canceled fetches on unmount.

```javascript
useEffect(() => {
  const controller = new AbortController();
  fetchItems(controller.signal);
  return () => controller.abort();
}, [fetchItems]);
```

**Trade-off:** Slightly more code complexity, but dramatically improved stability.

### 2.2 Updated DataContext to Accept an Abort Signal

Items.js updated its call to:

```javascript
fetchItems(controller.signal);
```

But DataContext did not accept a signal previously.

**Fix:** `fetchItems` now accepts and forwards the signal to `fetch()`.

**Trade-off:** Maintains prop-drilling of the abort signal, keeping cancellation centralized.

### 2.3 Fixed Incorrect API Endpoint in ItemDetail

The frontend attempted to fetch:

```javascript
http://localhost:3000/api/items/:id
```

But the backend ran on port `3001`, causing redirect loops.

**Fix:** Updated to:

```javascript
http://localhost:3001/api/items/:id
```

**Trade-off:** Hardcoding URLs works for local development; using a proxy would be cleaner for deployment.



## 4. Testing Implementation

### 4.1 Comprehensive Unit Tests

Created thorough test suites for both frontend components using Jest and React Testing Library:

**ItemDetail.test.js** - Tests for the item detail page:
* Skeleton loader rendering during data fetch
* Successful data display after loading
* Navigation to home on fetch errors (404, network failures)
* Back link functionality
* Correct API endpoint calls based on URL parameters
* Price formatting with dollar signs

**Items.test.js** - Tests for the items list page:
* Loading skeleton state
* Item list rendering after data loads
* Add item form toggle functionality
* Form submission with validation
* Search/filter functionality
* Empty search state handling
* Pagination controls (prev/next buttons, disabled states)
* Item links with correct routing
* Fetch abort on component unmount

### 4.2 Mocking Strategy

* **fetch API**: Mocked globally to control API responses
* **react-router-dom**: Mocked `useNavigate` for navigation testing
* **react-window**: Simplified virtual list rendering for easier testing
* **DataContext**: Mocked `useData` hook to control component state

### 4.3 Test Coverage

All critical user flows are covered:
* Happy paths (successful data loading and display)
* Error paths (network failures, validation errors)
* User interactions (clicks, form submissions, navigation)
* Edge cases (empty states, pagination boundaries)

