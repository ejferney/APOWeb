# APO AEZ Chapter Portal

Chapter management site for Alpha Phi Omega (AEZ chapter): service hour tracking, events with RSVP and check-in, announcements, requirements reporting, availability scheduling, and officer task management.

- **Frontend:** React 19 + Vite + Tailwind (this folder, `src/`)
- **Backend:** Express + MongoDB (`server/`)

## Local development

```bash
# 1. Install dependencies (both root and server)
npm install
cd server && npm install && cd ..

# 2. Start MongoDB locally (or set MONGODB_URI in server/.env to an Atlas cluster)

# 3. Run frontend + backend together
npm run dev:full
```

Frontend runs at http://localhost:5173, API at http://localhost:5000.

## Configuration

Copy the example env files and fill them in:

- `.env.example` → `.env` (frontend): `VITE_API_URL` — where the API lives. Not needed for local dev.
- `server/.env.example` → `server/.env` (backend): `MONGODB_URI`, `JWT_SECRET` (**required in production**), `PORT`, `CLIENT_URL`.

## Deploying (free-tier friendly)

1. **Database — MongoDB Atlas** (free M0 cluster)
   - Create a cluster, a database user, and allow access from anywhere (0.0.0.0/0).
   - Copy the connection string for `MONGODB_URI`.

2. **API — Render / Railway**
   - New web service from this repo, root directory `server`.
   - Build command: `npm install` — Start command: `npm start`.
   - Environment variables: `MONGODB_URI`, `JWT_SECRET` (long random string), `CLIENT_URL` (your frontend URL, once you have it).

3. **Frontend — Vercel / Netlify**
   - Import this repo, framework preset **Vite** (root directory = repo root).
   - Environment variable: `VITE_API_URL` = your API URL from step 2 (no trailing slash).

4. Go back to the API service and set `CLIENT_URL` to the deployed frontend URL so CORS is locked down.
