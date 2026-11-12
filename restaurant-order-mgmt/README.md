# Restaurant Order Dashboard

A local restaurant order app split into three routed pages (CreateItems, CreateOrder, Dashboard) with a lightweight Node backend and SQLite persistence.

## Prerequisites

- Node.js and npm

## Run locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start backend and frontend together** (recommended)
   ```bash
   npm run dev
   ```
   - Backend API: `http://localhost:3001` (SQLite DB at `DB/app.db`)
   - Frontend (Vite): URL shown in terminal (typically `http://localhost:5173`)

   Or run separately in two terminals:
   ```bash
   npm run dev:server   # backend (http://localhost:3001, DB/app.db)
   npm run dev:client   # frontend (Vite dev server)
   ```

3. **Open the app pages/routes**
   - `/items` — **CreateItems**: create and list saved menu items (name, cuisine/category)
   - `/create-order` — **CreateOrder**: place an order for a customer by selecting saved items
   - `/dashboard` — **Dashboard**: live in-transit board (PLACED + READY only) with mark-ready/mark-picked-up actions and optional voice pickup announcement

   A default route redirects to a sensible starting page (see app navigation).

## Dashboard on another screen

The Dashboard can be opened on another screen/browser on the same machine (or another device that can reach the backend host). It reads/writes shared in-transit order data from the same backend/SQLite database (`DB/app.db`), so updates made from CreateOrder or another screen are reflected via API refresh/polling.

## Data storage

- **SQLite database:** `DB/app.db` (created/initialized automatically by the backend on start)
- **Tables:** menu items and orders (status, timestamps, announced marker)

## Other commands

- `npm run server` — start backend only
- `npm run build` — build frontend for production (`dist/`)
- `npm run preview` — preview production frontend build
- `npm test` — run automated tests/checks

## Notes

- Voice pickup announcements on the Dashboard use the browser Web Speech API; enable the **Voice** toggle (user interaction) on that screen/device.
- The Dashboard shows only orders in transit (**PLACED** and **READY**); fulfilled orders are not displayed on the Dashboard.
- Local browser `localStorage` from earlier versions is not automatically migrated.
