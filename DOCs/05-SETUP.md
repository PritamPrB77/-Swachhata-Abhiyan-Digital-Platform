# 05 — Setup (Docker Compose)

## Prerequisites

- Docker Desktop (Compose v2)
- Git

No need to install Node/Python locally unless you develop a service outside containers.

## Run everything

```bash
cd Broadridge
cp .env.example .env
docker compose up --build
```

Open **http://localhost** (nginx). Do not use direct service ports — they are not published.

## Demo logins

- `citizen@example.com` / `citizen123`
- `driver@example.com` / `driver123`
- `officer@example.com` / `officer123`
- `admin@example.com` / `admin123`

## Verify live tracking

1. Login as **driver** → **Share GPS** → Start sharing (allow location)
2. In another browser/profile, login as **officer** → **Live Fleet**
3. Markers should move as the driver location updates

## Useful commands

```bash
docker compose ps
docker compose logs -f nginx fleet-service
docker compose down
docker compose down -v   # wipe volumes
```

## Local UI development (optional)

```bash
cd frontend
npm install
npm run dev
```

Point API calls at `http://localhost` (nginx) or temporarily configure a proxy; production path is always relative `/api/...` behind nginx.

## Related docs

- [Architecture](./04-ARCHITECTURE.md)
- [Tech Stack](./03-TECH-STACK.md)
