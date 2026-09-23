# Mini Device Fleet Monitor

A small application that monitors a fleet of simulated devices. Each device periodically sends a **heartbeat** to the application, which tracks the latest heartbeat and allows an operator to view the current status of the entire fleet through both a REST API and a real-time web dashboard.

---

## Design / Architecture

### System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────┐
│   Next.js UI    │────▶│  Express.js API   │────▶│  MongoDB  │
│   (Port 3000)   │     │   (Port 5000)     │     │  (27017)  │
└─────────────────┘     └──────────────────┘     └───────────┘
                              ▲
                              │ POST /devices/{id}/heartbeat
                        ┌─────┴─────┐
                        │ Simulator │
                        │  (CLI)    │
                        └───────────┘
```

### Key Design Decisions

- **Server-generated UUIDs**: Devices receive a UUID on registration (not client-provided IDs) for unique identification.
- **Computed status**: ONLINE/OFFLINE is a **virtual field** computed at query time by comparing `lastHeartbeat` against a 30-second threshold. No scheduled jobs or background workers needed.
- **Server timestamps**: Heartbeat timestamps are generated server-side (`Date.now()`) to avoid clock-skew issues between devices.
- **Polling-based frontend**: The dashboard polls the API every 5 seconds for real-time updates. Simpler and more reliable than WebSockets for this scale.
- **MongoDB**: Chosen for its flexible schema (heartbeat payloads can include optional fields like `cpu_usage` and `signal_strength` without migrations).

### Backend Structure

```
backend/
├── src/
│   ├── app.js                  # Express app setup (CORS, routes, error handling)
│   ├── server.js               # Entry point (connects DB, starts server)
│   ├── config/db.js            # MongoDB connection helper
│   ├── models/Device.js        # Mongoose schema with computed virtual status
│   ├── controllers/
│   │   ├── deviceController.js # Register, list, detail, heartbeat handlers
│   │   └── summaryController.js# Fleet summary handler
│   ├── routes/
│   │   ├── devices.js          # /devices routes
│   │   └── summary.js          # /summary route
│   ├── middleware/
│   │   └── errorHandler.js     # Centralized error handler (400/404/409/500)
│   └── utils/constants.js      # HEARTBEAT_TIMEOUT_MS = 30000
└── tests/
    ├── setup.js                # In-memory MongoDB for isolated tests
    ├── device.test.js          # Registration & listing tests
    ├── heartbeat.test.js       # Heartbeat handling tests
    └── status.test.js          # ONLINE/OFFLINE timeout & summary tests
```

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker** & **Docker Compose** (for containerized deployment)

---

## How to Build the Application

### With Docker (recommended)

```bash
docker compose build
```

### Without Docker (local development)

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
npm run build
```

---

## How to Run the Application

### With Docker (recommended)

```bash
docker compose up
```

This starts:
- **MongoDB** on port `27017`
- **Backend API** on port `5000`
- **Frontend Dashboard** on port `3000`

Open http://localhost:3000 to view the dashboard.

### Without Docker (local development)

You need a running MongoDB instance on `mongodb://localhost:27017`.

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

- API: http://localhost:5000
- Dashboard: http://localhost:3000

---

## How to Run the Simulator

The simulator is a standalone Node.js CLI script (no additional dependencies needed).

```bash
node simulator/index.js
```

To point at a custom API URL:
```bash
API_URL=http://localhost:5000 node simulator/index.js
```

### Simulator Commands

| Command | Description |
|---------|-------------|
| `stop <n>` | Stop device number n (1-5) — it will go OFFLINE after ~30s |
| `start <n>` | Restart a stopped device |
| `list` | Show all devices and their running state |
| `help` | Show available commands |
| `exit` | Shut down all devices and exit |

**Example workflow:**
```
simulator> list           # See all 5 devices running
simulator> stop 3         # Stop device 3
# Wait 30 seconds, then check the dashboard — device 3 should be OFFLINE
simulator> start 3        # Restart device 3 — it goes back ONLINE
```

---

## How to Run the Tests

```bash
cd backend
npm test
```

Tests use `mongodb-memory-server` for fully isolated in-memory MongoDB instances.

### Test Coverage

| Suite | Tests | What's Covered |
|-------|-------|---------------|
| `device.test.js` | 9 | Registration (success, validation, trimming), listing, detail, 404 |
| `heartbeat.test.js` | 6 | Heartbeat acceptance, extended fields, 404, timestamp updates, server timestamp |
| `status.test.js` | 10 | ONLINE/OFFLINE transitions, 30s boundary, list status, fleet summary counts |
| **Total** | **25** | All pass ✅ |

---

## Example API Requests

### Register a Device
```bash
curl -X POST http://localhost:5000/devices \
  -H "Content-Type: application/json" \
  -d '{"name": "Lab Device 01"}'
```
Response:
```json
{
  "id": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
  "name": "Lab Device 01",
  "status": "OFFLINE",
  "last_heartbeat": null
}
```

### Send a Heartbeat
```bash
curl -X POST http://localhost:5000/devices/{id}/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"status": "OK", "cpu_usage": 42, "signal_strength": -71}'
```

### List All Devices
```bash
curl http://localhost:5000/devices
```

### Get Device Details
```bash
curl http://localhost:5000/devices/{id}
```

### Fleet Summary
```bash
curl http://localhost:5000/summary
```
Response:
```json
{
  "total": 5,
  "online": 4,
  "offline": 1
}
```

---

## Assumptions

1. **Device names must be unique** — the backend enforces case-insensitive uniqueness and rejects purely numeric names.
2. **Heartbeat payloads are flexible** — `status`, `cpu_usage`, and `signal_strength` are all optional.
3. **No authentication** — this is an internal monitoring tool, not a public-facing API.
4. **Single-server deployment** — no horizontal scaling or load balancing considered.
5. **Heartbeat history is not stored** — only the latest heartbeat data is kept per device.
6. **30-second timeout is configurable** — defined as a constant in `utils/constants.js`.

---

## Known Limitations

1. **No heartbeat history** — only the most recent heartbeat is stored; no time-series data.
2. **No pagination** — the device list endpoint returns all devices; may be slow with thousands.
3. **Polling, not WebSocket** — the frontend polls every 5 seconds; not truly real-time.
4. **No rate limiting** — the API has no rate limiting or request throttling.
5. **No HTTPS** — runs over HTTP; would need a reverse proxy for TLS in production.

---

## What I Would Improve with One Additional Day

1. **WebSocket support** — replace polling with Socket.IO for instant status updates on the dashboard.
2. **Heartbeat history** — store heartbeat history with a configurable retention period and expose a `GET /devices/{id}/heartbeats` endpoint.
3. **Pagination & filtering** — `GET /devices?status=ONLINE&page=1&limit=20` for large fleets.
4. **Dashboard charts** — add CPU usage and signal strength sparklines per device.
5. **Rate limiting** — add `express-rate-limit` to prevent heartbeat flooding.
6. **E2E tests** — Cypress/Playwright tests for the frontend dashboard.
7. **Health monitoring** — `/health` endpoint with MongoDB connectivity checks for Docker health checks.

---

## AI Usage

- **Which AI tools**: Google Antigravity (Claude Opus 4.6)
- **What I used them for**: Scaffolding the project structure, generating boilerplate code (Express routes, Mongoose model, Jest tests), creating the CSS design system, and writing Dockerfiles.
- **One suggestion I changed**: The AI initially suggested using `setupFilesAfterSetup` in the Jest config, which is not a valid Jest option. I corrected this to remove it entirely since test files import the setup directly via `require('./setup')`.
- **One thing I personally verified**: Ran all 25 automated tests locally and confirmed they pass, particularly the 30-second ONLINE/OFFLINE boundary tests which required fixing a race condition in the exact-boundary test case.
