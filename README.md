# TEAM-NKVV-B2B (Scubeg Backend)

This repository contains a small Node.js + Express backend that serves static vendor/buyer pages and provides API endpoints for authentication, vendor and buyer actions. The app uses MongoDB (via mongoose) for persistence.

> Note: This README was generated from the workspace files. Please review and edit any project-specific details (environment variables, API contracts, or remote URLs) before sharing publicly.

## Features
- Express server serving static HTML pages from `public/`.
- API routes under `/api` for auth, vendor and buyer actions.
- MongoDB (mongoose) connection.
- Simple client-side pages for vendors and buyers (dashboard, inventory, products, orders, notifications, chat, profile, etc.).

## Quickstart (local)
1. Clone the repo

   git clone https://github.com/sandymandycandy/TEAM-NKVV-B2B.git
   cd TEAM-NKVV-B2B

2. Install dependencies

   npm install

3. Create a `.env` file at project root with these variables:

   MONGO_URI=your_mongodb_connection_string
   PORT=3000
   JWT_SECRET=your_jwt_secret

4. Start the server

   npm start

5. Open the app in your browser

   - http://localhost:3000/login
   - Vendor pages: `/vendor-dashboard`, `/vendor/inventory`, `/vendor/orders`, etc.
   - Buyer pages: `/buyer-dashboard`, `/buyer/products`, `/buyer/cart`, etc.

## Project structure
- `server.js` — Express app, route registrations, static file serving.
- `routes/api/` — API routes (auth, buyer, vendor).
- `public/` — static frontend HTML, CSS, client JS and uploads.
- `models/` — Mongoose models (User, Product, Order, Notification, Message).
- `config/db.js` — (if present) MongoDB connection helper.
- `scripts/` — one-off maintenance scripts.

## API highlights
- Auth: `/api/auth` (signup/login)
- Vendor APIs: `/api/vendor/*` (inventory, products, orders, notifications, chat endpoints)
- Buyer APIs: `/api/buyer/*` (products listing, orders, cart endpoints)

Note: Examine `routes/api/` for full route details and required headers (e.g., `x-auth-token`).

## Sockets / Real-time
The project includes realtime messaging logic (server-side socket handlers). Client pages may open socket connections and expect JWT tokens for authentication.

## Contributing
- Ensure you have a `.env` with a working `MONGO_URI` and valid `JWT_SECRET`.
- Follow existing route patterns when adding APIs.
- Keep front-end pages in `public/` simple and static; use fetch/XHR for API calls.

## License
Add your license here (e.g., MIT). 

---
If anything in this README is incorrect or incomplete, open an issue or update the file directly.