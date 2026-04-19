# UrbanRoute IQ

Urban route decision cockpit with map visualization, ETA/traffic/weather context, and safety-weighted route recommendation.

## Stack

- Node.js (custom HTTP server)
- Leaflet (map UI)
- Google Directions API (primary routing)
- OSRM + Nominatim (fallback routing/geocoding)
- Open-Meteo (weather)

## Environment setup

1. Copy `.env.example` to `.env` (already created in this project).
2. Put your Google Maps key in `.env`:

	 - `GOOGLE_MAPS_API_KEY=your_actual_key`

`.env` is ignored by Git via `.gitignore`.

## Local run

```bash
cd "/Users/hemkesh/Documents/New project"
node server.js
```

Open `http://localhost:3000`.

## API endpoints

- `GET /api/directions`
- `GET /api/geocode`
- `GET /api/route`
- `GET /api/weather`

If `GOOGLE_MAPS_API_KEY` is missing, `/api/directions` returns a clear configuration error.

## Deploy (Cloud Run)

```bash
gcloud run deploy urbanroute-iq \
	--source . \
	--region asia-south1 \
	--platform managed \
	--allow-unauthenticated \
	--set-env-vars GOOGLE_MAPS_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>
```