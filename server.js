const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
node_modules
.env
.DS_Storenode_modules
.env
.DS_Storenode_modules
.env
.DS_Storenode_modules
.env
.DS_Store
const PORT = process.env.PORT || 3000;
const DIR = __dirname;
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // ── Google Directions API (primary — real traffic ETA) ──
  if (parsed.pathname === '/api/directions') {
    return proxyGoogleDirections(parsed.query, res);
  }

  // ── Geocode via Nominatim (free, no key) ──
  if (parsed.pathname === '/api/geocode') {
    return proxyGeocoding(parsed.query, res);
  }

  // ── OSRM fallback route ──
  if (parsed.pathname === '/api/route') {
    return proxyOSRM(parsed.query, res);
  }

  // ── Weather (Open-Meteo, free) ──
  if (parsed.pathname === '/api/weather') {
    return proxyWeather(parsed.query, res);
  }

  // ── Static files ──
  const filePath = path.join(DIR, parsed.pathname === '/' ? 'index.html' : parsed.pathname);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

/* ── Google Directions API (server-side, avoids CORS) ── */
function proxyGoogleDirections(query, res) {
  const { origin, destination, departure_time } = query;
  if (!origin || !destination) {
    return sendJSON(res, 400, { error: 'origin and destination required' });
  }

  // Use provided departure_time (Unix timestamp) or default to 'now'
  const depTime = departure_time || 'now';

  const apiUrl = `https://maps.googleapis.com/maps/api/directions/json`
    + `?origin=${encodeURIComponent(origin)}`
    + `&destination=${encodeURIComponent(destination)}`
    + `&alternatives=true`
    + `&mode=driving`
    + `&departure_time=${depTime}`
    + `&key=${GOOGLE_KEY}`;

  console.log(`[Google] Directions: "${origin}" → "${destination}"`);

  httpsGet(apiUrl, {}, (err, body) => {
    if (err) return sendJSON(res, 500, { error: err.message });
    try {
      const data = JSON.parse(body);
      console.log(`[Google] Status: ${data.status}, Routes: ${data.routes ? data.routes.length : 0}`);

      if (data.status !== 'OK') {
        console.error(`[Google] Error: ${data.error_message || data.status}`);
        return sendJSON(res, 200, {
          status: data.status,
          error: data.error_message || data.status,
          routes: [],
        });
      }

      // Parse routes into clean format
      const routes = data.routes.map((r, i) => {
        const leg = r.legs[0];
        return {
          index: i,
          summary: r.summary || `Route ${i + 1}`,
          distanceKm: Math.round(leg.distance.value / 100) / 10,
          distanceText: leg.distance.text,
          durationMin: Math.round(leg.duration.value / 60),
          durationText: leg.duration.text,
          // Traffic-aware duration if available
          durationInTrafficMin: leg.duration_in_traffic
            ? Math.round(leg.duration_in_traffic.value / 60)
            : null,
          durationInTrafficText: leg.duration_in_traffic
            ? leg.duration_in_traffic.text
            : null,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          startLocation: leg.start_location,
          endLocation: leg.end_location,
          // Encoded polyline for map
          polyline: r.overview_polyline.points,
          steps: leg.steps.length,
        };
      });

      console.log(`[Google] ✓ ${routes.length} route(s): `
        + routes.map(r => `${r.distanceKm}km/${r.durationMin}min via ${r.summary}`).join(' | '));

      sendJSON(res, 200, {
        status: 'OK',
        provider: 'Google Directions API',
        routes,
      });

    } catch (e) {
      sendJSON(res, 500, { error: 'Parse error: ' + e.message });
    }
  });
}

/* ── Geocode via Nominatim (free) ── */
function proxyGeocoding(query, res) {
  const { q } = query;
  if (!q) return sendJSON(res, 400, { error: 'q is required' });

  const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
  console.log(`[Geocode] "${q}"`);

  httpsGet(apiUrl, { 'User-Agent': 'UrbanRouteIQ/1.0' }, (err, body) => {
    if (err) return sendJSON(res, 500, { error: err.message });
    try {
      const results = JSON.parse(body);
      if (results.length === 0) return sendJSON(res, 404, { error: 'Location not found' });
      const { lat, lon, display_name } = results[0];
      console.log(`[Geocode] ✓ ${display_name.slice(0, 60)}… → ${lat},${lon}`);
      sendJSON(res, 200, { lat: parseFloat(lat), lng: parseFloat(lon), name: display_name });
    } catch (e) {
      sendJSON(res, 500, { error: 'Parse error' });
    }
  });
}

/* ── OSRM fallback ── */
function proxyOSRM(query, res) {
  const { startLat, startLng, endLat, endLng } = query;
  if (!startLat || !startLng || !endLat || !endLng) {
    return sendJSON(res, 400, { error: 'startLat, startLng, endLat, endLng required' });
  }

  const apiUrl = `https://router.project-osrm.org/route/v1/driving/`
    + `${startLng},${startLat};${endLng},${endLat}`
    + `?alternatives=true&overview=full&geometries=geojson&steps=true`;

  console.log(`[OSRM] Fallback route…`);

  httpsGet(apiUrl, {}, (err, body) => {
    if (err) return sendJSON(res, 500, { error: err.message });
    try {
      const data = JSON.parse(body);
      if (data.code !== 'Ok') return sendJSON(res, 400, { error: data.code || 'No routes' });

      const routes = data.routes.map((r, i) => ({
        index: i,
        distanceKm: Math.round(r.distance / 100) / 10,
        durationMin: Math.round(r.duration / 60),
        durationText: formatDuration(r.duration),
        geometry: r.geometry,
        legs: r.legs.map(l => ({ summary: l.summary || `Route ${i + 1}`, steps: l.steps.length })),
      }));

      console.log(`[OSRM] ✓ ${routes.length} route(s)`);
      sendJSON(res, 200, { routes });
    } catch (e) {
      sendJSON(res, 500, { error: 'Parse error: ' + e.message });
    }
  });
}

function formatDuration(s) {
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

function httpsGet(apiUrl, headers, cb) {
  const opts = url.parse(apiUrl);
  opts.headers = { ...headers };
  https.get(opts, (r) => {
    let body = '';
    r.on('data', d => body += d);
    r.on('end', () => cb(null, body));
  }).on('error', e => cb(e));
}

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}

/* ── Weather via Open-Meteo (free, no API key) ── */
function proxyWeather(query, res) {
  const { lat, lng, date, hour } = query;
  if (!lat || !lng) return sendJSON(res, 400, { error: 'lat and lng required' });

  const apiUrl = `https://api.open-meteo.com/v1/forecast`
    + `?latitude=${lat}&longitude=${lng}`
    + `&hourly=weather_code,temperature_2m`
    + `&forecast_days=2&timezone=auto`;

  console.log(`[Weather] Fetching for ${lat},${lng} at ${date}T${String(hour).padStart(2,'0')}:00`);

  httpsGet(apiUrl, {}, (err, body) => {
    if (err) return sendJSON(res, 500, { error: err.message });
    try {
      const data = JSON.parse(body);
      if (!data.hourly || !data.hourly.time) {
        return sendJSON(res, 500, { error: 'No hourly data' });
      }

      // Find matching hour in forecast
      const targetStr = `${date}T${String(hour).padStart(2, '0')}:00`;
      let idx = data.hourly.time.indexOf(targetStr);
      if (idx === -1) idx = 0; // fallback to first entry

      const weatherCode = data.hourly.weather_code[idx];
      const temperature = data.hourly.temperature_2m[idx];
      const weather = mapWeatherCode(weatherCode);

      console.log(`[Weather] ✓ Code ${weatherCode} → ${weather}, ${temperature}°C`);
      sendJSON(res, 200, { weather, weatherCode, temperature });
    } catch (e) {
      sendJSON(res, 500, { error: 'Parse error: ' + e.message });
    }
  });
}

function mapWeatherCode(code) {
  if (code <= 1) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if ((code >= 51 && code <= 55) || (code >= 56 && code <= 57)) return 'Rain';
  if ((code >= 61 && code <= 63) || (code >= 80 && code <= 81)) return 'Rain';
  if (code === 65 || (code >= 66 && code <= 67) || code === 82) return 'Heavy Rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'Snow';
  if (code >= 95) return 'Heavy Rain';
  return 'Clear';
}

server.listen(PORT, () => {
  console.log(`\n  UrbanRoute IQ`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  App          →  http://localhost:${PORT}`);
  console.log(`  Directions   →  /api/directions (Google)`);
  console.log(`  Geocode      →  /api/geocode (Nominatim)`);
  console.log(`  Route (OSRM) →  /api/route (fallback)`);
  console.log(`  Weather      →  /api/weather (Open-Meteo)`);
  console.log(`  API Key      →  ${GOOGLE_KEY ? 'Configured' : 'Missing'}\n`);
});
