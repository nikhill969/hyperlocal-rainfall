# Hyperlocal Rainfall-Induced Waterlogging & Environmental Risk Mapping System

A responsive project prototype that combines locality rainfall, geographic context, and citizen observations to assess localized waterlogging risk and identify recurring hotspots. Risk scores are informational and are not a guaranteed flood prediction or official warning.

## Technology

- Frontend: React, Vite, HTML, CSS, and JavaScript
- Backend: Node.js and Express
- Persistence: JSON files only; no MongoDB, MySQL, or other database
- Maps: Leaflet and OpenStreetMap
- Weather: Open-Meteo with a fallback when the service is unavailable
- Authentication: salted `scrypt` password hashes and signed, expiring bearer tokens

## Run Locally

Requirements: Node.js 18+ and npm.

```powershell
npm run install:all
npm start
```

The API listens on `http://localhost:5000`; Vite serves the frontend on `http://localhost:3000` (or the next available port). Alternatively, run the backend and frontend separately with `npm run dev:backend` and `npm run dev:frontend`.

Development admin account:

- Email: `admin@hyperlocal.local`
- Password: `RainfallAdmin!2026`

Citizens must register first, then sign in with their registered email and password to open the citizen dashboard. Registration saves their name, email, area, and selected coordinates but does not create a login session. The sign-in page separates citizen and administrator login. In production, set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a long random `AUTH_SECRET`; the server refuses to start in production if the password or signing secret is missing. Do not expose the development admin credentials publicly.

### Google Sign-In and Password Recovery

To enable the Google account chooser, create a Google OAuth **Web application** client ID. Set the same client ID as `GOOGLE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`, and add the frontend origin (for example `http://localhost:3000`) to the OAuth client's authorized JavaScript origins. Restart both development servers after changing the environment files. Google verifies the ID token on the backend; new Google users must select an area before their citizen account is created. If the OAuth client ID is not configured, email sign-in remains available and the Google button explains the missing setup.

Forgot-password links are one-use and expire after 30 minutes. For local development, the reset link is displayed in the UI. For production, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` so reset links are emailed; production reset requests are disabled without SMTP configuration.

Citizen registration and report submission use searchable OpenStreetMap/Nominatim locations or browser GPS. Selected locality coordinates are stored with the profile; report coordinates can also be selected precisely on the map. Browser geolocation requires user permission and a secure context (localhost is supported).

## JSON Persistence

The backend creates and updates these files in `backend/data/`:

- `users.json`: citizen and administrator accounts; passwords are stored as salted hashes
- `reports.json`: reports, coordinates, locality, rainfall/risk snapshot, image, timestamps, and status
- `locations.json`: supported localities and map centers

These files remain available after backend restarts. Set `DATA_DIR` to use a different writable directory. Back up this directory to preserve the project data.

## Roles and Pages

Citizens register with a locality and can view that locality's reports, weather/risk summary, map, and hotspots. They can submit a report by selecting a point on the map or using GPS, attach an optional image, and track their own report status. A citizen may delete only their own pending report.

Administrators can view all localities and reports, see the registered citizen list and area risk summaries, filter report management by locality/status/risk/date, and move reports through Pending, Verified, In Progress, Resolved, and Rejected. Report reads and mutations are checked by the backend; hiding a frontend button is not used as an access-control boundary.

Main views include the home dashboard, risk map, area reports, my reports, report submission, hotspots, rainfall details, admin report management, and citizen management.

## API Overview

- `GET /api/health` reports API and JSON storage status
- `GET /api/auth/locations` lists registration localities
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/admin-login`, `POST /api/auth/google`, `GET /api/auth/me`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/reports` lists all reports for admins and same-area reports for citizens
- `GET /api/reports/my` lists the signed-in citizen's own reports
- `POST /api/reports` creates a report for the authenticated citizen's locality
- `PUT /api/reports/:id/verify` updates status (admin only)
- `DELETE /api/reports/:id` deletes a report (admin, or its owner while Pending)
- `GET /api/users` lists citizens (admin only)
- `GET /api/areas` lists rainfall/risk summaries (admin only)
- `GET /api/weather`, `GET /api/risk`, `GET /api/hotspots`, `GET /api/analytics`

Protected endpoints require `Authorization: Bearer <token>`. The server derives citizen ID, name, role, and area from that token; it does not trust those fields from a report submission.

## Verification

Run the backend integration test:

```powershell
npm test --prefix backend
```

The test checks anonymous access denial, citizen/admin login, area isolation, admin moderation, and JSON persistence after a backend restart using temporary test files.

## Risk Assessment

The prototype score combines available rainfall, elevation, and nearby non-rejected citizen reports. Weather or elevation service failures use a clearly labeled fallback. The map and scoring are for demonstration and environmental awareness only; they are not calibrated for emergency response.