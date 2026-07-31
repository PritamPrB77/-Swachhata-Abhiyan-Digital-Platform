# Swachhata Abhiyan Digital Platform

Production-oriented **local Docker microservice** web portal for cleanliness complaints, **driver phone GPS** live fleet tracking, volunteer drives, and **gamification** (XP, badges, missions, store, leaderboards).

> **Out of scope for this phase:** AWS/cloud, AI/ML, advanced GitOps.  
> Stack stays **React (Vite) + FastAPI microservices + PostgreSQL + nginx** — existing services were **not rewritten**; gamification was **added** as a new service.

---

## How to run (start here)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- Git

### Start the platform

```bash
cd D:\Broadridge
cp .env.example .env
docker compose up --build
```

Open: **http://localhost**  
Only **port 80** is published (nginx). Backend ports are internal.

### Stop / reset

```bash
docker compose down          # stop
docker compose down -v       # stop + wipe databases/volumes
docker compose logs -f nginx gamification-service
```

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@example.com | citizen123 |
| Driver | driver@example.com | driver123 |
| Officer | officer@example.com | officer123 |
| Admin | admin@example.com | admin123 |

### Quick smoke test
1. Login as **citizen** → submit a complaint → check **Rewards** for +10 XP  
2. Login as **driver** → **Share GPS** → allow location  
3. Login as **officer** → **Live Fleet** → see moving marker  
4. Open **Rewards** → claim daily login, view badges / missions / store / leaderboard  

---

## Location / fleet — which APIs?

**No Google Maps GPS device API and no IoT tracker.** Tracking uses:

| Layer | Technology | Purpose |
|-------|------------|---------|
| Browser | **Geolocation API** (`navigator.geolocation.watchPosition`) | Driver phone lat/lng |
| Realtime | **Native WebSocket** `/ws/fleet` (FastAPI) | Live stream to officers |
| Fan-out | **Redis Pub/Sub** channel `fleet:live` | Broadcast latest positions |
| REST | `POST /api/fleet/location`, `GET /api/fleet/live` | Persist + snapshot |
| Map UI | **Leaflet + OpenStreetMap** tiles | Display trucks on map |

Flow: Driver browser → WebSocket/REST → fleet-service → Redis → Officer map via WebSocket.

---

## Architecture (microservices)

```text
Browser ──► nginx:80
              ├── /                     → frontend (React SPA)
              ├── /api/auth/            → auth-service
              ├── /api/complaints/      → complaint-service
              ├── /api/fleet/           → fleet-service
              ├── /ws/fleet             → fleet-service (WebSocket)
              ├── /api/drives/          → drive-service
              ├── /api/gamification/    → gamification-service   ← NEW
              └── /media/               → MinIO
```

| Service | DB | Responsibility |
|---------|----|----------------|
| auth-service | `auth_db` | Register/login JWT + roles |
| complaint-service | `complaint_db` | Complaints + MinIO images |
| fleet-service | `fleet_db` + Redis | Vehicles + live driver GPS |
| drive-service | `drive_db` | Events / volunteers / certificates |
| **gamification-service** | **`gamification_db`** | XP, levels, badges, missions, store, leaderboards |

Network: `swachhata-net` · Volumes: `postgres-data`, `redis-data`, `minio-data`

---

## Gamification (what was added)

### Progression
`Beginner → Contributor → Champion → Hero → Legend` (by XP)  
Levels scale with XP; redeemable **points** power the store.

### Point examples
| Action | XP |
|--------|----|
| Daily login | +5 |
| Complaint submitted | +10 |
| Complaint verified/assigned | +20 |
| Issue resolved | +40 |
| Volunteer event | +50 |
| Weekly streak (every 7 days) | +50 |

### Features in UI (`/app/rewards`)
- Profile XP bar, streaks, tier chips  
- Badges (10 seeded)  
- Daily / weekly / monthly missions  
- Community & ward challenges  
- Reward store (coupons, certificates, digital badges)  
- City + ward leaderboards  
- In-app gamification notifications  

Existing complaint/drive pages **call** `/api/gamification/award` after success (additive hooks only).

### Key APIs
- `GET /api/gamification/me`
- `POST /api/gamification/checkin`
- `POST /api/gamification/award`
- `GET /api/gamification/badges|missions|challenges|store|leaderboard|notifications`
- `POST /api/gamification/store/redeem`

---

## Frontend notes

- React + TypeScript + Vite + Tailwind  
- shadcn-style primitives + Framer Motion (Magic UI–style)  
- Dark mode toggle in header  
- Maps: Leaflet / OSM  

> The long enterprise brief mentioned Next.js + Express + Prisma. **This repo intentionally keeps the current FastAPI microservice stack** and adds gamification without a rewrite. A future migration doc can cover Next/Express if required.

---

## Project layout

```text
Broadridge/
  docker-compose.yml
  nginx/nginx.conf
  scripts/init-databases.sql
  frontend/                 # React SPA
  services/
    auth-service/
    complaint-service/
    fleet-service/
    drive-service/
    gamification-service/   # NEW
  DOCs/                     # planning + design docs
```

---

## Docs index

See [`DOCs/README.md`](./DOCs/README.md) and [`DOCs/07-GAMIFICATION.md`](./DOCs/07-GAMIFICATION.md).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 80 in use | Stop other local web servers or change nginx host mapping |
| Gamification 500 / DB missing | `docker compose exec postgres psql -U swachh -c "CREATE DATABASE gamification_db;"` then restart gamification service |
| Login email invalid | Use `@example.com` demos (not `.local`) |
| Map empty | Driver must click **Start sharing location** and allow GPS |
| Frontend old UI | `docker compose up --build -d frontend nginx` |
