# 08 — UI & Role Enhancements (latest)

## Delivered

### Landing
- Three.js 3D orbs + GSAP entrance
- Slogan: *Ek Kadam Swachhata Ki Ore*
- Role picker → login into matching workspace

### App chrome
- Left sidebar (role-filtered)
- Top-right profile chip → `/app/profile`
- Dark mode toggle
- Role dashboards with stats + recent complaints

### Complaints
- Photo auto-captures GPS (`photo_latitude/longitude`)
- Live sentiment → urgency (critical/high/medium/low)
- Backend re-analyzes text; comments can escalate urgency
- Status timeline + history + officer notes
- Citizens/drivers file; officers/admins review

### Live location
- All roles can open **Live Map**
- WebSocket feed + **coordinate change log** (Δ ≥ 0.5m)

### Rewards
- **Citizen + driver only** (UI gate + API `403` for officer/admin)

## Rebuild

```bash
docker compose up --build -d
```

Requires Docker Hub connectivity for base image metadata.
