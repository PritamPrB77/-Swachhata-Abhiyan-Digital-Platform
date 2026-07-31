# 01 — Overview

## Background

Swachh Bharat Abhiyan (Clean India Mission) aims to improve sanitation, reduce waste, and promote cleanliness in urban and rural areas.

Today, citizen feedback, waste collection tracking, and cleanliness monitoring are handled by disconnected systems, manual reporting, and delayed communication. That leads to:

- Delayed grievance resolution for waste management issues
- Lack of transparency in cleanliness drives and fund usage
- Difficulty tracking field staff performance and resource allocation
- Limited citizen participation without a central digital platform
- Poor analytics to measure progress and identify problem zones

## Product vision

Build a **cloud-hosted Swachhata Abhiyan Management Platform** delivered as a **single web-based portal** that:

- Centralizes citizen complaints, cleanliness drives, and waste management data
- Enables real-time issue reporting from the browser (geo-tagged images, location-based complaints)
- Tracks waste collection vehicles and workforce using GPS / IoT feeds
- Provides dashboards for municipal officers to monitor progress
- Encourages engagement through gamification, rewards, and feedback loops
- Uses AI analytics to identify high-waste areas and optimize cleaning schedules

## Objectives

1. **Citizen engagement** — Web portal for reporting cleanliness issues with geo-tagged images
2. **Workforce & vehicle tracking** — GPS-enabled real-time monitoring of waste collection teams
3. **Resource allocation** — AI-assisted route optimization for waste collection trucks
4. **Progress monitoring** — Public dashboards with cleanliness scores per ward/city
5. **Feedback & gamification** — Rewards for citizens and wards that maintain cleanliness
6. **Scalable infrastructure** — Cloud-hosted platform designed for city-to-nationwide growth

## Personas

| Persona | Goals | Primary portal areas |
|---------|-------|----------------------|
| **Citizen** | Report issues, track status, join drives, earn rewards | Complaint submit/track, drives, leaderboard |
| **Field Staff** | Receive assignments, update job status, verify completion | Assigned jobs, map, completion with photo |
| **Municipal Officer** | Monitor wards, allocate resources, view analytics | Ops dashboard, fleet map, scorecards |
| **Admin** | Manage users, wards, categories, system config | Admin console, audit, masters |

## Delivery approach (v1)

- **One web portal** (React + TypeScript), responsive and installable as a **PWA** so phones can use camera + geolocation without a native app
- Role-based views after Cognito login (Citizen / Field Staff / Officer / Admin)
- Public read-only cleanliness scoreboard (optional unauthenticated view)

## In scope (MVP / v1)

- Citizen complaint submission with image + GPS (browser APIs)
- Complaint categorization and auto-assign to nearest field team
- Complaint status tracking for citizens
- GPS vehicle tracking ingest + officer map view
- Cleanliness drive scheduling and volunteer registration
- Digital participation certificates (PDF stored in S3)
- Ward/city cleanliness scorecards
- Basic reward points and leaderboards
- Notifications (email/SMS via SNS + Twilio)
- Cloud deploy path on AWS (EKS)

## Out of scope (v1)

- Native iOS/Android apps (Flutter/React Native)
- Full nationwide multi-tenant federation (design for it; implement single-city/tenant first)
- Complex payment / fund-utilization accounting modules
- Offline-first field apps with full sync

## Success metrics (initial)

- Median time from complaint submit → assignment < 15 minutes (business hours)
- % of complaints resolved within SLA (target defined per city)
- Citizen repeat usage (complaints + drive participation)
- Officer dashboard daily active use
- Ward cleanliness score trend over 4–8 weeks

## Related docs

- [Planning](./02-PLANNING.md)
- [Tech Stack](./03-TECH-STACK.md)
- [Architecture](./04-ARCHITECTURE.md)
- Source PDF: [Swachata Abhiyan.pdf](./Swachata%20Abhiyan.pdf)
