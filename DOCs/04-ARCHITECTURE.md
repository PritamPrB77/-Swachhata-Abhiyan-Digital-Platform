# 04 — Architecture (local Docker)

## High-level

```mermaid
flowchart LR
  Browser[Browser]
  Nginx[nginx_80]
  FE[frontend]
  Auth[auth_service]
  Comp[complaint_service]
  Fleet[fleet_service]
  Drive[drive_service]
  PG[(postgres)]
  Redis[(redis)]
  Minio[(minio)]

  Browser --> Nginx
  Nginx --> FE
  Nginx --> Auth
  Nginx --> Comp
  Nginx --> Fleet
  Nginx --> Drive
  Nginx --> Minio
  Auth --> PG
  Comp --> PG
  Comp --> Minio
  Fleet --> PG
  Fleet --> Redis
  Drive --> PG
```

## Live driver GPS

```mermaid
sequenceDiagram
  participant Driver as DriverBrowser
  participant WS as FleetWebSocket
  participant Redis
  participant Officer as OfficerMap

  Driver->>WS: ping lat lng via WS
  WS->>Redis: publish fleet:live
  Redis-->>Officer: location event
  Officer->>Officer: update map marker
```

## Roles

- **citizen** — submit/track complaints, join drives
- **driver** — share phone GPS, update assigned complaints
- **officer / admin** — manage queue, watch live fleet, schedule drives

## Volumes & network

Compose defines bridge network `swachhata-net` and volumes: `postgres-data`, `redis-data`, `minio-data`, `auth-data`.

## Related docs

- [Tech Stack](./03-TECH-STACK.md)
- [Setup](./05-SETUP.md)
