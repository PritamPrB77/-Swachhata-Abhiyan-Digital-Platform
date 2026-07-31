# 02 — Planning

## Delivery model

- **Agile**, 2-week sprints
- **Project management:** Jira + Confluence
- **Source control:** GitHub (feature branches → PR → main)
- **Cadence:** Sprint planning → daily standup → review/demo → retrospective

## Epics & features

### Epic 1 — Citizen Complaint System

- Complaint submission with image and GPS location (browser/PWA)
- Issue categorization (garbage, street cleaning, toilet maintenance, etc.)
- Auto-assign to nearest field team
- Status timeline for citizens (Submitted → Assigned → In Progress → Resolved / Rejected)

### Epic 2 — Waste Collection Management

- GPS-based vehicle tracking (ingest from devices / mobile browsers for staff)
- Real-time route monitoring on officer map
- Work completion verification via portal (photo + notes)
- Route optimization hooks (AI later; rule-based first)

### Epic 3 — Cleanliness Drive Management

- Event scheduling and volunteer registration
- Progress tracking and live updates
- Digital certificates for participants

### Epic 4 — Data & Analytics

- City and ward cleanliness scorecards
- AI-based hotspot detection
- Predictive inputs for resource planning

### Epic 5 — Citizen Engagement & Rewards

- Leaderboards for cleanliness ratings
- Reward points for complaint resolution participation and drives
- Public awareness campaigns in the portal

## Sample user stories

### Complaints

- As a **Citizen**, I can submit a complaint with category, description, photo, and my location so that the municipality can act.
- As a **Citizen**, I can track my complaint status so that I know when it is resolved.
- As a **System**, I assign a new complaint to the nearest available field team based on ward/geo.
- As **Field Staff**, I can update job status and upload proof of completion.

### Fleet & routes

- As an **Officer**, I can see live vehicle positions on a map filtered by ward.
- As an **Officer**, I can view planned vs actual routes for a shift.
- As **Field Staff**, my device/portal can send periodic GPS pings while on duty.

### Drives

- As an **Officer**, I can create a cleanliness drive with date, location, and capacity.
- As a **Citizen**, I can register as a volunteer and receive a certificate after attendance is marked.

### Analytics & rewards

- As an **Officer**, I can view ward cleanliness scores and trends.
- As a **Citizen**, I can see my points and city/ward leaderboard.
- As an **Admin**, I can configure point rules and campaign banners.

## Sprint roadmap (8 × 2 weeks)

| Sprint | Focus | Key deliverables |
|--------|--------|------------------|
| **1** | Foundation | Cloud/local infra skeleton, Cognito roles, complaint CRUD API, health checks |
| **2** | Citizen portal | Geo-tagged image upload (S3), complaint UI, tracking pages |
| **3** | Fleet map | GPS ingest API, DynamoDB latest-position cache, officer map + routes |
| **4** | Drives | Event module, volunteer signup, certificate PDF generation |
| **5** | Analytics UI | Ward/city scorecards dashboard, basic aggregates |
| **6** | AI hotspots | SageMaker integration for hotspot detection + schedule suggestions |
| **7** | Gamification | Points engine, leaderboards, campaigns |
| **8** | Launch | End-to-end integration, Cypress/UAT, hardening, public launch |

Detailed build tasks: [Implementation Plan](./06-IMPLEMENTATION-PLAN.md).

## Roles & RACI (lightweight)

| Activity | Product | Eng | DevOps | QA | City stakeholders |
|----------|---------|-----|--------|-----|-------------------|
| Backlog priority | A | C | I | C | C |
| Sprint delivery | C | A | C | C | I |
| UAT sign-off | C | C | I | C | A |
| Production release | C | C | A | C | I |

A = Accountable, C = Consulted, I = Informed

## Definition of Done

- Code merged via reviewed PR
- Unit/API tests for new backend endpoints; Cypress for critical UI paths
- Lint/security gates green (SonarQube / Snyk in CI)
- Feature documented in Confluence or linked DOCs section
- Deployed at least to **staging**
- Acceptance criteria checked in Jira

## UAT & launch checklist

- [ ] Seed data: wards, categories, sample users per role
- [ ] Complaint happy path + SLA timers validated with officers
- [ ] Image upload and geo accuracy verified on mobile browsers
- [ ] Fleet map updates within agreed latency
- [ ] Drive register → attend → certificate flow tested
- [ ] Scorecards match agreed formulas
- [ ] Rewards points audited against rules
- [ ] Load smoke test on staging
- [ ] Runbooks for incidents (on-call, rollback via ArgoCD)
- [ ] Privacy/consent copy for location and photos approved

## Workflow (engineering)

1. Backlog planning → Jira epics & stories  
2. Development → GitHub feature branches  
3. Build & test → GitHub Actions + pytest + Cypress  
4. Containerize → Docker images to AWS ECR  
5. Deploy → ArgoCD GitOps to Kubernetes  
6. Monitor → Prometheus, Grafana, CloudWatch, ELK; sprint review feedback  

## Related docs

- [Overview](./01-OVERVIEW.md)
- [Tech Stack](./03-TECH-STACK.md)
- [Implementation Plan](./06-IMPLEMENTATION-PLAN.md)
