# Swachhata Abhiyan — Documentation

Cloud-deferred **local Docker microservice** web portal for complaints, driver GPS fleet tracking, and cleanliness drives.

Source problem statement: [Swachata Abhiyan.pdf](./Swachata%20Abhiyan.pdf)

## Guides

| # | Document | Description |
|---|----------|-------------|
| 01 | [Overview](./01-OVERVIEW.md) | Problem, vision, personas, scope |
| 02 | [Planning](./02-PLANNING.md) | Epics, stories, roadmap |
| 03 | [Tech Stack](./03-TECH-STACK.md) | Current local stack (Docker microservices) |
| 04 | [Architecture](./04-ARCHITECTURE.md) | Modules & data flow |
| 05 | [Setup](./05-SETUP.md) | Docker Compose bootstrap |
| 06 | [Implementation Plan](./06-IMPLEMENTATION-PLAN.md) | Build phases |
| 07 | [Gamification](./07-GAMIFICATION.md) | XP, badges, missions, store, APIs |

## Current locked stack (local phase)

- **Portal:** React + TypeScript + Vite + Tailwind + shadcn-style / Magic UI motions (+ dark mode)
- **APIs:** FastAPI microservices (auth, complaint, fleet, drive, **gamification**)
- **Data:** PostgreSQL (DB per service), Redis (live GPS), MinIO (images)
- **Gateway:** nginx (only host port **80**)
- **Tracking:** Driver phone GPS + WebSocket (no IoT device)
- **Gamification:** XP, levels, badges, missions, challenges, store, leaderboards

## Deferred

AWS Cognito/EKS/SageMaker, AI hotspot models, and advanced GitOps are **out of scope for now**.
