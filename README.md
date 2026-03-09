# CampusOS

CampusOS is a React + Vite + Firebase (Auth + Realtime Database) campus platform.

## Features
- Login/signup with email/password
- Dashboard + feed + notifications
- Notes sharing
- Events with calendar and RSVP
- Lost & Found with matching + contact thread
- Complaints system
- Budget tracker
- Admin-only controls

## Tech Stack
- React 19
- Vite 7
- Firebase Auth
- Firebase Realtime Database
- Recharts
- Lucide icons

## Run Locally
```bash
npm install
npm run dev
```

Build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Routes
Student-facing routes:
- `/`
- `/feed`
- `/notes`
- `/events`
- `/lost-found`
- `/complaints`
- `/budget`

Hidden admin routes:
- `/ops-core-9x7` (Admin Dashboard)
- `/ops-core-9x7-complaints`
- `/ops-core-9x7-notes`
- `/ops-core-9x7-events`
- `/ops-core-9x7-lost-found`

## Admin Role Model
Admin access is based only on RTDB role.

A user is admin only when this is set in RTDB:
- `users/{uid}/role = "admin"`

Student role:
- `users/{uid}/role = "student"`

If role is changed in DB, sign out and sign in again.

## Firebase Notes
Project config is currently in `src/firebase.js`.
For production, recommended:
- move config to environment variables
- deploy strict RTDB security rules from `firebase/rtdb.rules.json`
- do not use client-side admin passwords for access control

## Hosting Checklist
Before hosting:
1. `npm run build` passes.
2. Admin users have `role: "admin"` in RTDB.
3. Non-admin users have `role: "student"`.
4. Firebase Auth provider Email/Password is enabled.
5. RTDB rules are locked down.
6. Deploy `dist` folder to your host (Vercel/Netlify/Firebase Hosting).

## Deploy RTDB Rules
From project root:
```bash
firebase deploy --only database
```

## Current Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
