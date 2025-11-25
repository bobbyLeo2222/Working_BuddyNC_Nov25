# SG Papers Monorepo

This project now mirrors a classic client/server split similar to Create React App backends.

```
sg-papers/
├── client/               # React + Vite front-end
│   ├── build/            # Production bundles (gitignored)
│   ├── public/           # Static assets served by Vite
│   ├── src/
│   │   ├── components/   # Reusable UI + feature modules
│   │   │   ├── auth/
│   │   │   ├── exam/
│   │   │   └── profile/
│   │   ├── pages/        # Route-level screens
│   │   ├── data/         # Seed data for exam papers
│   │   ├── styles/       # Global stylesheets
│   │   └── utils/        # Shared helpers (AI client, exam helpers)
│   ├── package.json
│   └── vite.config.js
├── server/               # Express API
│   ├── index.js          # Server entry point
│   ├── app.js            # Express app wiring
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── package.json
└── README.md
```

## Getting started

### Front-end

```bash
npm install       # installs workspaces (client + server)
npm run dev       # runs client + server together (http://localhost:5173 + http://localhost:5000)
npm run build     # proxies to client build (outputs to client/build)
```

Need only one service? Use `npm run dev:client` or `npm run dev:server` from the repo root.

Environment variables for the front-end (AI helper + API base URLs) live in `client/.env.local`.

### API server

```bash
cd server
npm install
npm run dev      # starts nodemon with server/index.js
```

Copy `server/.env.example` to `server/.env` and tweak values (Mongo connection, JWT secret, email SMTP, etc.).

From the repo root you can also run `npm run server`, which proxies to the same command via npm workspaces.

The API expects MongoDB connection details in `.env` within `server/` (see `server/config/db.js`).

## Adding exam papers

Exam papers now live in MongoDB through the `Paper` model and are exposed via `/api/papers`. The assets in `client/src/data/papers/` continue to serve as the source-of-truth seed data that the import script reads from.

When adding a new paper:

1. Append the metadata entry to `client/src/data/papers/index.js` (level, subject, year, school, id).
2. Create the matching exam module under `client/src/data/papers/<subject>/`, exporting an `exam` object (same shape as the existing files).
3. Seed the database by running `npm run seed:papers --workspace server` (or `npm run --workspace server seed:papers` from the repo root).
4. Restart the API (or call `GET /api/papers`) to confirm the new paper is available.

The client consumes whatever the API returns, so once the database has the new record, it becomes available in the UI without additional wiring.
