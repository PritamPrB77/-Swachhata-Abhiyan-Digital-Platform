# 06 — Implementation Plan (local fullstack phase)

Cloud, AI/ML, and advanced DevOps are deferred. Current goal: Dockerized microservice fullstack with live driver GPS.

## Done in this phase

1. Monorepo layout: `frontend/`, `services/*`, `nginx/`, `scripts/`, `docker-compose.yml`
2. **auth-service** — JWT register/login, seeded demo users
3. **complaint-service** — geo complaints + MinIO image upload
4. **fleet-service** — vehicles, driver phone GPS, Redis + WebSocket live map
5. **drive-service** — drives, volunteer signup, certificate codes
6. **frontend** — React portal (shadcn-style UI + Magic UI motion), role-based pages
7. **nginx** — single host entry on port 80; no backend ports published
8. Compose network + named volumes for Postgres, Redis, MinIO

## How to run

See [Setup](./05-SETUP.md) — `docker compose up --build` then open http://localhost

## Suggested next increments (still local)

1. Officer attendance UI listing all volunteers for a drive
2. Complaint auto-assign by nearest live driver position
3. PWA install + background location caveats documentation
4. Basic Cypress smoke tests behind nginx
5. Later: AWS/IaC, SageMaker hotspots, ArgoCD

## Related docs

- [Planning](./02-PLANNING.md)
- [Architecture](./04-ARCHITECTURE.md)
- [Setup](./05-SETUP.md)
