# ScholarFlow

ScholarFlow is a Next.js scholarship dashboard with an Express, MongoDB Atlas, and JWT backend.

## Setup

Create `server/.env` from `server/.env.example` and set `MONGODB_URI` and a strong `JWT_SECRET`. The project environment already provides `MONGODB_URI` in Vercel; local development requires your own Atlas connection string.

```bash
pnpm install
pnpm dev        # frontend
pnpm dev:api    # API on port 4000
```

The API exposes `/api/auth`, `/api/scholarships`, `/api/applications`, and `/api/dashboard`. Authentication uses an HttpOnly cookie. Public registration always creates a student; privileged roles require an administrator/database operation.

Implemented foundation: MongoDB models, password hashing, JWT sessions, role middleware, scholarship publishing/listing, application draft/submission/status workflow, dashboard statistics, notifications, audit logs, validation, CORS, Helmet, rate limiting, and a centralized Axios client. Document upload storage and the remaining staff/admin screens should be wired to the existing UI before production launch.
