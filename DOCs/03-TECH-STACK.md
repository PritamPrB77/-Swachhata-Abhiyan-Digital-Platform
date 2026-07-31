# 03 — Tech Stack (local microservice phase)

AI/ML and cloud (AWS) are deferred. This phase focuses on a runnable fullstack + Docker setup.

## Summary

| Layer | Choice |
|-------|--------|
| Web portal | React 18 + TypeScript + Vite + Tailwind |
| UI kit | shadcn-style primitives + Magic UI–inspired motion (framer-motion) |
| Maps | Leaflet / react-leaflet |
| API gateway | nginx (sole published port: 80) |
| Microservices | FastAPI: auth, complaint, fleet, drive |
| Databases | PostgreSQL 16 — one database per service |
| Live GPS bus | Redis pub/sub + WebSocket |
| Object storage | MinIO (S3-compatible) |
| Auth | Local JWT (shared `JWT_SECRET`) |
| Orchestration | Docker Compose (network + named volumes) |

## Microservices

| Service | Responsibility | Database |
|---------|----------------|----------|
| `auth-service` | Register/login, roles, JWT | `auth_db` |
| `complaint-service` | Complaints + MinIO image upload | `complaint_db` |
| `fleet-service` | Vehicles, driver GPS, WebSocket live map | `fleet_db` + Redis |
| `drive-service` | Cleanliness drives & volunteer signups | `drive_db` |
| `frontend` | SPA served by nginx inside its container | — |

## Vehicle tracking approach

- **No dedicated GPS hardware** in this phase
- The **driver** shares live location from the phone/browser Geolocation API
- Updates go over **WebSocket** (`/ws/fleet`) and are fan-out via Redis to officer dashboards

## Why nginx hides ports

Backend containers listen on internal `8000` only. Compose does **not** publish those ports to the host. Clients call paths like `/api/auth/login` on `http://localhost`.

## Related docs

- [Architecture](./04-ARCHITECTURE.md)
- [Setup](./05-SETUP.md)
