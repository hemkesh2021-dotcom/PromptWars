# UrbanRoute IQ

Urban route decision cockpit with map visualization, ETA, traffic/weather context, and safety-weighted route recommendation.

## Stack
- Node.js (custom HTTP server)
- Leaflet (map UI)
- Google Directions API (primary routing)
- OSRM + Nominatim (fallback routing/geocoding)
- Open-Meteo (weather)

## Local run

```bash
cd "/Users/hemkesh/Documents/New project"
export GOOGLE_MAPS_API_KEY="YOUR_KEY_HERE"
node 