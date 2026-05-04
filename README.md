# UrbanRoute IQ

> **Women Safety Mode · Real-time Routing · Live Map**

An urban mobility decision cockpit that compares multiple routes and recommends the safest one by combining live ETA, traffic conditions, weather data, and a contextual safety score. Built with a dedicated **Women Safety Mode** that applies additional risk weighting to route selection.

---

## Features

- 🗺️ **Live interactive map** — routes drawn on OpenStreetMap via Leaflet
- 🔀 **Route A vs Route B comparison** — distance, ETA, derived risk, and safety score side-by-side
- 🚨 **Women Safety Mode** — extra penalty applied to risk scoring so the safest route is always preferred
- 🚦 **Real-time traffic ETA** — Google Directions API with live traffic (`duration_in_traffic`)
- 🌦️ **Auto weather fetch** — Open-Meteo forecast for the travel hour (no API key required)
- 📍 **Address autocomplete** — powered by Nominatim (free, no key)
- 📅 **Calendar reminder** — one-click `.ics` download with a 5-minute lead reminder
- 📲 **SOS / live location share** — emergency share button in Women Safety Mode
- 🐳 **Docker-ready** — hardened non-root container, single `docker run` command

---

## Tech stack

| Layer | Technology |
|---|---|
| Server | Node.js 18 (zero-dependency custom HTTP server) |
| Map UI | Leaflet 1.9 + OpenStreetMap tiles |
| Primary routing | Google Directions API (traffic-aware, multi-modal) |
| Fallback routing | OSRM (public instance, driving) |
| Geocoding / autocomplete | Nominatim (OpenStreetMap) |
| Weather | Open-Meteo hourly forecast |
| Container | Docker (node:18-alpine, non-root) |
| Cloud deploy | Google Cloud Run |

---

## Prerequisites

- **Node.js ≥ 18** (for local development)
- **Docker** (optional, for containerised runs)
- **Google Maps API key** with the *Directions API* enabled (optional — the app falls back to OSRM when no key is provided)

---

## Getting started

### 1. Clone and configure

```bash
git clone https://github.com/hemkesh2021-dotcom/PromptWars_WomenSafety.git
cd PromptWars_WomenSafety
```

Create a `.env` file in the project root:

```ini
# .env — never commit this file
GOOGLE_MAPS_API_KEY=your_actual_key
```

> `.env` is already listed in `.gitignore`. Without this key the app still works using the free OSRM fallback.

### 2. Run locally

```bash
node server.js          # or: npm start
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Run with Docker

```bash
# Build the image
docker build -t urbanroute-iq .

# Run (pass your key as an env var)
docker run -p 3000:3000 -e GOOGLE_MAPS_API_KEY=your_actual_key urbanroute-iq
```

---

## API reference

All endpoints are served by the Node.js backend to keep API keys server-side and avoid CORS issues.

### `GET /api/directions`

Fetches traffic-aware routes from the Google Directions API.

| Parameter | Required | Description |
|---|---|---|
| `origin` | ✅ | Start address or `lat,lng` |
| `destination` | ✅ | End address or `lat,lng` |
| `transport_mode` | | `driving` (default) or `transit` |
| `departure_time` | | Unix timestamp |
| `arrival_time` | | Unix timestamp |

Returns an array of routes with distance, ETA, traffic ETA, and encoded polyline.

---

### `GET /api/geocode`

Resolves an address string to coordinates via Nominatim.

| Parameter | Required | Description |
|---|---|---|
| `q` | ✅ | Address / place name |

---

### `GET /api/autocomplete`

Returns up to 5 address suggestions for a partial query.

| Parameter | Required | Description |
|---|---|---|
| `q` | ✅ | Partial address / place name |

---

### `GET /api/route`

OSRM fallback — returns driving routes when Google key is unavailable.

| Parameter | Required | Description |
|---|---|---|
| `startLat` | ✅ | Origin latitude |
| `startLng` | ✅ | Origin longitude |
| `endLat` | ✅ | Destination latitude |
| `endLng` | ✅ | Destination longitude |

---

### `GET /api/weather`

Fetches an hourly weather forecast from Open-Meteo (free, no key required).

| Parameter | Required | Description |
|---|---|---|
| `lat` | ✅ | Latitude |
| `lng` | ✅ | Longitude |
| `date` | | `YYYY-MM-DD` (defaults to today) |
| `hour` | | `0`–`23` (defaults to 0) |

---

## Safety scoring

The decision engine scores each route out of **10** and applies the following weighted penalties:

| Factor | Penalty range |
|---|---|
| Base contextual risk (slider) | 1 – 10 |
| Weather (Clear → Heavy Rain) | 0 – 1.5 |
| Traffic (Low → Severe) | 0.1 – 0.9 |
| Women Safety Mode multiplier | ×1.25 on the heavier-risk route |

The route with the **lower derived risk score** is recommended. In Women Safety Mode the recommendation always breaks ties in favour of the safer path.

---

## Deploy to Google Cloud Run

```bash
gcloud run deploy urbanroute-iq \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_MAPS_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>
```

The `Dockerfile` uses a non-root `appuser` and the `node:18-alpine` base image.

---

## License

MIT