/* ==========================================================================
   UrbanRoute IQ — Decision Engine
   Map: Leaflet (dark tiles)  |  Routing: Google Directions API + OSRM fallback
   ========================================================================== */

const SAMPLE_TRIP = Object.freeze({
  start: "MG Road, Bengaluru",
  end: "Koramangala, Bengaluru",
  time: "21:15",
  traffic: "High",
  risk: 6,
  weather: "Rain",
  mode: "Women Safety Mode",
});

const WEATHER_FACTORS = Object.freeze({
  Clear:       { risk: 0,   scorePenalty: 0,   note: "clear weather" },
  Sunny:       { risk: 0,   scorePenalty: 0,   note: "sun exposure" },
  Cloudy:      { risk: 0.2, scorePenalty: 0.2, note: "cloud cover" },
  Rain:        { risk: 0.8, scorePenalty: 0.9, note: "wet roads" },
  "Heavy Rain":{ risk: 1.3, scorePenalty: 1.5, note: "heavy rain" },
  Fog:         { risk: 1.1, scorePenalty: 1.4, note: "low visibility" },
  Snow:        { risk: 1.0, scorePenalty: 1.3, note: "slippery surface" },
});

const TRAFFIC_FACTORS = Object.freeze({
  Low:      { risk: 0.1,  scorePenalty: 0.1 },
  Moderate: { risk: 0.35, scorePenalty: 0.3 },
  High:     { risk: 0.75, scorePenalty: 0.6 },
  Severe:   { risk: 1.1,  scorePenalty: 0.9 },
});

/* ---------- DOM ---------- */
const el = {};
const domIds = [
  "routeForm","sampleBtn","analyzeBtn","btnText","btnSpinner",
  "riskScore","riskValue","strictOutput",
  "mapBoard","leafletMap",
  "mapStatusPill","mapStatusDot","mapStatusLabel","mapStatusText",
  "routeDistA","routeEtaA","etaStatusA","etaMsgA","distA","etaA",
  "routeDistB","routeEtaB","etaStatusB","etaMsgB","distB","etaB",
  "routeSumNameA","routeSumDetailA","routeSumA",
  "routeSumNameB","routeSumDetailB","routeSumB",
  "cardDistA","cardEtaA","cardRiskA","cardSafetyA",
  "cardDistB","cardEtaB","cardRiskB","cardSafetyB",
  "routeACard","routeBCard",
  "contextSummary","biasSummary","marginSummary",
  "decisionRoute","decisionEta","decisionSafety",
  "systemDirectionsMode","timeType","transportMode",
  "tripNotificationBox","notifyLeaveTime","notifyArrivalTime","notifyHurdles","notifyHurdlesRow","addToCalBtn","sosBtn",
  "startLocationMenu","endLocationMenu"
];

/* ---------- Map globals ---------- */
let map = null;
let routeLayerA = null;
let routeLayerB = null;
let startMarker = null;
let endMarker = null;
let activeRoute = null; // 'A' or 'B' — currently selected/focused route
let trafficZones = [];
let safeZones = [];
let currentTransitInfoA = [];
let currentTransitInfoB = [];

/* ---------- Helpers ---------- */
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function roundOne(v) { return Math.round(v * 10) / 10; }
function getField(id) { return document.getElementById(id); }
function parseNum(id) { return Number.parseFloat(getField(id).value); }

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function addMinutesToTimeStr(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m + minutes;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = Math.floor(totalMins % 60);
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/* ---------- Auto-detection helpers ---------- */
function getDepartureTimestamp(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const dep = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m || 0);
  if (dep <= now) dep.setDate(dep.getDate() + 1);
  return Math.floor(dep.getTime() / 1000);
}

function getTravelDateHour(timeStr) {
  const [h] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  const pad = n => String(n).padStart(2, '0');
  return {
    date: `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`,
    hour: h,
  };
}

function deriveTrafficLevel(ratio) {
  if (ratio <= 1.08) return 'Low';
  if (ratio <= 1.25) return 'Moderate';
  if (ratio <= 1.5) return 'High';
  return 'Severe';
}

function deriveTrafficFromTime(timeStr) {
  const [h] = timeStr.split(':').map(Number);
  if ((h >= 8 && h <= 10) || (h >= 17 && h <= 20)) return 'High';
  if (h >= 23 || h <= 5) return 'Low';
  return 'Moderate';
}

function flashAutoField(fieldId) {
  const field = getField(fieldId);
  if (!field) return;
  field.classList.add('auto-detected');
  setTimeout(() => field.classList.remove('auto-detected'), 2500);
}

async function autoSetWeather(lat, lng, timeStr) {
  try {
    const info = getTravelDateHour(timeStr);
    const url = `/api/weather?lat=${lat}&lng=${lng}&date=${info.date}&hour=${info.hour}`;
    const data = await fetch(url).then(r => r.json());
    if (data.weather) {
      getField('weather').value = data.weather;
      window.lastUvIndex = data.uvIndex;
      flashAutoField('weather');
      console.log(`[Weather] Auto-detected: ${data.weather} (code ${data.weatherCode}, ${data.temperature}°C, UV: ${data.uvIndex})`);
    }
  } catch (e) {
    console.warn('[Weather] Auto-detect failed:', e.message);
  }
}

/* ==========================================================================
   Decode Google encoded polyline to [lat, lng] array
   ========================================================================== */
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

/* ==========================================================================
   Leaflet Map
   ========================================================================== */
function initMap() {
  map = L.map('leafletMap', {
    center: [12.9716, 77.5946],
    zoom: 13,
    zoomControl: true,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  L.control.attribution({ position: 'bottomright', prefix: false })
    .addAttribution('© <a href="https://carto.com/">CARTO</a> · <a href="https://osm.org/">OSM</a>')
    .addTo(map);
}

function createIcon(type) {
  const cls = type === 'start' ? 'marker-start' : 'marker-end';
  const label = type === 'start' ? 'S' : 'D';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin ${cls}"><span>${label}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

function clearMap() {
  [routeLayerA, routeLayerB, startMarker, endMarker, ...trafficZones, ...safeZones]
    .forEach(l => { if (l) map.removeLayer(l); });
  routeLayerA = routeLayerB = startMarker = endMarker = null;
  trafficZones = [];
  safeZones = [];
}

function drawRoutesOnMap(startLL, endLL, polylineA, polylineB) {
  clearMap();
  activeRoute = 'A';

  // Route B (purple dashed, underneath) — clickable
  if (polylineB) {
    routeLayerB = L.polyline(polylineB, {
      color: '#a78bfa', weight: 5, opacity: 0.5, dashArray: '8, 12', lineCap: 'round',
      interactive: true,
    }).addTo(map)
      .bindPopup('<strong style="color:#a78bfa">Route B</strong> — Alternate<br><em>Click to focus</em>')
      .on('click', () => focusRoute('B'));
  }

  // Route A (cyan bold, on top) — clickable
  if (polylineA) {
    routeLayerA = L.polyline(polylineA, {
      color: '#22d3ee', weight: 6, opacity: 0.85, lineCap: 'round',
      interactive: true,
    }).addTo(map)
      .bindPopup('<strong style="color:#22d3ee">Route A</strong> — Primary<br><em>Click to focus</em>')
      .on('click', () => focusRoute('A'));
  }

  // Markers
  startMarker = L.marker(startLL, { icon: createIcon('start') }).addTo(map).bindPopup('<strong>Start</strong>');
  endMarker = L.marker(endLL, { icon: createIcon('end') }).addTo(map).bindPopup('<strong>Destination</strong>');

  // Traffic / Safe zones logic
  const mode = getField("travelMode").value;
  const traffic = getField("trafficLevel").value;
  const time = getField("travelTime").value;
  const ctx = buildContext({ time, risk: 6, weather: 'Clear', traffic }); 

  if (traffic === 'High' || traffic === 'Severe') {
    drawTrafficZones(polylineA);
  }

  if (mode === 'Women Safety Mode' && ctx.night.risk > 0) {
    drawSafeZones(polylineA);
  }

  // Fit bounds to show all routes
  const group = L.featureGroup([routeLayerA, routeLayerB, startMarker, endMarker, ...trafficZones, ...safeZones].filter(Boolean));
  map.fitBounds(group.getBounds().pad(0.15));
}

function drawTrafficZones(polyline) {
  if (!polyline || polyline.length < 5) return;
  // Pick an arbitrary bottleneck at 60% of the route
  const bottleneckIndex = Math.floor(polyline.length * 0.6);
  const pt = polyline[bottleneckIndex];
  const circle = L.circle(pt, {
    color: 'transparent',
    fillColor: '#f43f5e',
    fillOpacity: 0.5,
    radius: 700,
    className: 'traffic-pulse-circle'
  }).addTo(map).bindPopup('<strong style="color:var(--rose)">High Traffic Bottleneck</strong><br>Avoid this gridlock area.');
  trafficZones.push(circle);
}

function drawSafeZones(polyline) {
  if (!polyline || polyline.length < 5) return;
  // Put a safe zone at 25% and 75%
  const i1 = Math.floor(polyline.length * 0.25);
  const i2 = Math.floor(polyline.length * 0.75);
  [i1, i2].forEach(idx => {
    const pt = polyline[idx];
    const circle = L.circle(pt, {
      color: 'transparent',
      fillColor: '#06b6d4',
      fillOpacity: 0.5,
      radius: 500,
      className: 'safe-zone-pulse'
    }).addTo(map).bindPopup('<strong style="color:var(--cyan)">Verified Safe Zone</strong><br>Well-lit area / Police post.');
    safeZones.push(circle);
  });
}

/* ---------- Focus / highlight a specific route ---------- */
function focusRoute(which) {
  activeRoute = which;

  if (which === 'A') {
    if (routeLayerA) {
      routeLayerA.setStyle({ weight: 7, opacity: 1, dashArray: null });
      routeLayerA.bringToFront();
      map.fitBounds(routeLayerA.getBounds().pad(0.12));
    }
    if (routeLayerB) routeLayerB.setStyle({ weight: 4, opacity: 0.3, dashArray: '8, 12' });
  } else {
    if (routeLayerB) {
      routeLayerB.setStyle({ weight: 7, opacity: 0.9, dashArray: null });
      routeLayerB.bringToFront();
      map.fitBounds(routeLayerB.getBounds().pad(0.12));
    }
    if (routeLayerA) routeLayerA.setStyle({ weight: 4, opacity: 0.3, dashArray: null });
  }

  // Re-add markers on top after route bringToFront
  if (startMarker) startMarker.bringToFront();
  if (endMarker) endMarker.bringToFront();

  // Update card active states
  updateRouteCardSelection(which);
}

function updateRouteCardSelection(which) {
  // Input cards
  const inputA = document.querySelector('.route-input-a');
  const inputB = document.querySelector('.route-input-b');
  if (inputA) inputA.classList.toggle('route-focused', which === 'A');
  if (inputB) inputB.classList.toggle('route-focused', which === 'B');

  // Comparison cards
  if (el.routeACard) el.routeACard.classList.toggle('route-focused', which === 'A');
  if (el.routeBCard) el.routeBCard.classList.toggle('route-focused', which === 'B');

  // Summary cards
  if (el.routeSumA) el.routeSumA.classList.toggle('route-focused', which === 'A');
  if (el.routeSumB) el.routeSumB.classList.toggle('route-focused', which === 'B');
}

function highlightWinner(name) {
  // Only apply winner highlight if no manual focus is active
  if (routeLayerA) routeLayerA.setStyle({ weight: name === 'Route A' ? 7 : 4, opacity: name === 'Route A' ? 1 : 0.35 });
  if (routeLayerB) routeLayerB.setStyle({
    weight: name === 'Route B' ? 7 : 4,
    opacity: name === 'Route B' ? 0.9 : 0.3,
    dashArray: name === 'Route B' ? null : '8, 12',
  });
}

/* ==========================================================================
   Fetch Routes — Google Directions API (primary) + OSRM (fallback)
   ========================================================================== */
async function fetchRoutes() {
  const origin = getField("startLocation").value.trim();
  const destination = getField("endLocation").value.trim();
  if (!origin || !destination) return alert("Enter both start and destination.");

  setLoading(true);
  setEtaState("loading", "Fetching routes from Google Maps…");
  updateStatus("loading", "Fetching…", "Querying Google Directions API…");

  try {
    // Try Google Directions API first
    const depTime = getDepartureTimestamp(getField('travelTime').value);
    const transportMode = getField('transportMode').value;
    const timeType = getField('timeType').value;

    let timeParam = `departure_time=${depTime}`;
    if (timeType === 'arrive') timeParam = `arrival_time=${depTime}`;

    const url = `/api/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&transport_mode=${transportMode}&${timeParam}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      console.log(`[Google] ✓ ${data.routes.length} route(s)`);
      await handleGoogleRoutes(data.routes);
      return;
    }

    // Google failed — fall back to OSRM
    console.warn(`[Google] ${data.status}: ${data.error || 'No routes'}`);
    console.log('[Fallback] Trying OSRM…');
    await fetchOSRMRoutes(origin, destination);

  } catch (err) {
    console.error('[Error]', err);
    updateStatus("error", "Error", err.message);
    setEtaState("error", `Error: ${err.message}`);
    setLoading(false);
  }
}

async function handleGoogleRoutes(routes) {
  const rA = routes[0];
  const etaA = rA.durationInTrafficMin || rA.durationMin;
  const distA = rA.distanceKm;
  const summaryA = rA.summary;
  const etaTextA = rA.durationInTrafficText || rA.durationText;

  let distB, etaB, summaryB, etaTextB;
  if (routes.length >= 2) {
    const rB = routes[1];
    etaB = rB.durationInTrafficMin || rB.durationMin;
    distB = rB.distanceKm;
    summaryB = rB.summary;
    etaTextB = rB.durationInTrafficText || rB.durationText;
  } else {
    distB = roundOne(distA * 1.15);
    etaB = Math.round(etaA * 1.18);
    summaryB = "Estimated alternate";
    etaTextB = `~${etaB} min`;
  }

  currentTransitInfoA = rA.transitInfo || [];
  currentTransitInfoB = (routes.length >= 2 && routes[1].transitInfo) ? routes[1].transitInfo : [];

  // Decode polylines and draw on map
  const polyA = decodePolyline(rA.polyline);
  const polyB = routes.length >= 2 ? decodePolyline(routes[1].polyline) : null;
  const startLL = [rA.startLocation.lat, rA.startLocation.lng];
  const endLL = [rA.endLocation.lat, rA.endLocation.lng];
  drawRoutesOnMap(startLL, endLL, polyA, polyB);

  // Store values
  el.distA.value = distA;  el.etaA.value = etaA;
  el.distB.value = distB;  el.etaB.value = etaB;

  // Update route cards
  el.routeDistA.textContent = `${distA} km`;
  el.routeEtaA.textContent  = `${etaA} min`;
  el.routeDistB.textContent = `${distB} km`;
  el.routeEtaB.textContent  = `${etaB} min`;

  // Summary bar
  el.routeSumNameA.textContent   = `Route A — ${summaryA}`;
  el.routeSumDetailA.textContent = `${rA.distanceText} · ${etaTextA}`;
  el.routeSumNameB.textContent   = `Route B — ${summaryB}`;
  el.routeSumDetailB.textContent = routes.length >= 2
    ? `${routes[1].distanceText} · ${etaTextB}` : `${distB} km · ${etaTextB}`;

  const trafficNote = rA.durationInTrafficMin ? ' (traffic-aware)' : '';
  el.systemDirectionsMode.textContent = `Google · ${routes.length} route(s)`;

  setEtaState("success", `✓ ${routes.length} route(s) from Google Maps${trafficNote}`);
  updateStatus("connected", "Google Maps", `${routes.length} route(s) via ${summaryA}`);

  // Auto-detect traffic level from Google's traffic-aware ETA
  if (rA.durationInTrafficMin && rA.durationMin) {
    const ratio = rA.durationInTrafficMin / rA.durationMin;
    const level = deriveTrafficLevel(ratio);
    getField('trafficLevel').value = level;
    flashAutoField('trafficLevel');
    console.log(`[Traffic] Auto-detected: ${level} (ratio: ${ratio.toFixed(2)})`);
  }

  // Auto-detect weather for the route location at the travel time
  const travelTime = getField('travelTime').value;
  await autoSetWeather(rA.startLocation.lat, rA.startLocation.lng, travelTime);

  setLoading(false);
  analyze();
}

/* OSRM fallback */
async function fetchOSRMRoutes(origin, destination) {
  setEtaState("loading", "Falling back to OSRM…");
  updateStatus("loading", "OSRM…", "Using open-source routing…");

  const [startGeo, endGeo] = await Promise.all([
    fetch(`/api/geocode?q=${encodeURIComponent(origin)}`).then(r => r.json()),
    fetch(`/api/geocode?q=${encodeURIComponent(destination)}`).then(r => r.json()),
  ]);

  if (startGeo.error || endGeo.error) throw new Error('Geocoding failed');

  const url = `/api/route?startLat=${startGeo.lat}&startLng=${startGeo.lng}&endLat=${endGeo.lat}&endLng=${endGeo.lng}`;
  const data = await fetch(url).then(r => r.json());
  if (data.error) throw new Error(data.error);

  const routes = data.routes;
  const rA = routes[0];

  let distB, etaB, summaryB, durationTextB;
  if (routes.length >= 2) {
    distB = routes[1].distanceKm; etaB = routes[1].durationMin;
    summaryB = routes[1].legs[0]?.summary || "Alternate";
    durationTextB = routes[1].durationText;
  } else {
    distB = roundOne(rA.distanceKm * 1.15);
    etaB = Math.round(rA.durationMin * 1.18);
    summaryB = "Estimated alternate";
    durationTextB = `~${etaB} min`;
  }

  currentTransitInfoA = [];
  currentTransitInfoB = [];

  // Draw OSRM GeoJSON routes
  const polyA = rA.geometry.coordinates.map(c => [c[1], c[0]]);
  const polyB = routes.length >= 2 ? routes[1].geometry.coordinates.map(c => [c[1], c[0]]) : null;
  drawRoutesOnMap([startGeo.lat, startGeo.lng], [endGeo.lat, endGeo.lng], polyA, polyB);

  el.distA.value = rA.distanceKm;  el.etaA.value = rA.durationMin;
  el.distB.value = distB;          el.etaB.value = etaB;

  el.routeDistA.textContent = `${rA.distanceKm} km`;
  el.routeEtaA.textContent  = `${rA.durationMin} min`;
  el.routeDistB.textContent = `${distB} km`;
  el.routeEtaB.textContent  = `${etaB} min`;

  el.routeSumNameA.textContent   = `Route A — ${rA.legs[0]?.summary || "Primary"}`;
  el.routeSumDetailA.textContent = `${rA.distanceKm} km · ${rA.durationText}`;
  el.routeSumNameB.textContent   = `Route B — ${summaryB}`;
  el.routeSumDetailB.textContent = `${distB} km · ${durationTextB}`;

  el.systemDirectionsMode.textContent = `OSRM · ${routes.length} route(s)`;

  setEtaState("success", `✓ ${routes.length} route(s) via OSRM`);
  updateStatus("connected", "OSRM", `${routes.length} route(s) — fallback routing`);

  // Auto-detect traffic from time of day (OSRM doesn't provide live traffic)
  const travelTime = getField('travelTime').value;
  const autoTraffic = deriveTrafficFromTime(travelTime);
  getField('trafficLevel').value = autoTraffic;
  flashAutoField('trafficLevel');
  console.log(`[Traffic] Time-based estimate: ${autoTraffic}`);

  // Auto-detect weather for the route location at the travel time
  await autoSetWeather(startGeo.lat, startGeo.lng, travelTime);

  setLoading(false);
  analyze();
}

/* ---------- UI helpers ---------- */
function setLoading(on) {
  el.analyzeBtn.disabled = on;
  el.btnText.style.display = on ? "none" : "";
  el.btnSpinner.classList.toggle("hidden", !on);
}

function setEtaState(state, msg) {
  el.etaStatusA.className = `eta-status ${state}`;
  el.etaStatusB.className = `eta-status ${state}`;
  el.etaMsgA.textContent = msg;
  el.etaMsgB.textContent = msg;
}

function updateStatus(state, label, detail) {
  const dotCls = state === "connected" ? "ok" : state === "error" ? "err" : "warn";
  const pillCls = state === "connected" ? "connected" : state === "error" ? "error" : "";
  el.mapStatusPill.className = `status-pill ${pillCls}`;
  el.mapStatusDot.className  = `status-dot ${dotCls}`;
  el.mapStatusLabel.textContent = label;
  el.mapStatusText.textContent  = detail;
}

/* ==========================================================================
   Decision Engine
   ========================================================================== */
function readFormData() {
  return {
    start: getField("startLocation").value.trim(),
    end: getField("endLocation").value.trim(),
    time: getField("travelTime").value,
    timeType: getField("timeType").value,
    transport: getField("transportMode").value,
    distA: Number.parseFloat(el.distA.value),
    distB: Number.parseFloat(el.distB.value),
    etaA: Number.parseFloat(el.etaA.value),
    etaB: Number.parseFloat(el.etaB.value),
    traffic: getField("trafficLevel").value,
    risk: parseNum("riskScore"),
    weather: getField("weather").value,
    mode: getField("travelMode").value,
  };
}

function getNightContext(t) {
  const p = t.split(":");
  const m = Number(p[0] || 0) * 60 + Number(p[1] || 0);
  if (m >= 1380 || m < 300) return { risk:1.5, scorePenalty:1.6, label:"late-night travel" };
  if (m >= 1200 || m < 360) return { risk:1.0, scorePenalty:1.1, label:"night travel" };
  if (m >= 1110)            return { risk:0.45, scorePenalty:0.45, label:"late-evening travel" };
  return { risk:0, scorePenalty:0, label:"day travel" };
}

function buildContext(d) {
  return {
    weather:  WEATHER_FACTORS[d.weather],
    traffic:  TRAFFIC_FACTORS[d.traffic],
    night:    getNightContext(d.time),
    baseRisk: clamp(d.risk * 0.72, 0.7, 7.2),
  };
}

function buildRouteProfile(name, dist, eta, oDist, oEta, ctx, mode) {
  const mpk = eta / Math.max(dist, 0.1);
  const ompk = oEta / Math.max(oDist, 0.1);
  const exposure = eta / 68 + dist / 26;
  const slower = Math.max(0, eta - oEta) / 16;
  const longer = Math.max(0, dist - oDist) / 9;
  const direct = (eta <= oEta ? 0.55 : 0) + (dist <= oDist ? 0.35 : 0);
  const smooth = Math.max(0, ompk - mpk) * 0.38;
  const smBonus = mode === "Women Safety Mode" ? smooth * 0.4 : 0;

  const risk = clamp(ctx.baseRisk + ctx.weather.risk + ctx.traffic.risk + ctx.night.risk +
    exposure + slower + longer - direct - smooth - smBonus, 1, 10);
  const safety = clamp(10.6 - risk - ctx.weather.scorePenalty - ctx.traffic.scorePenalty * 0.45 -
    ctx.night.scorePenalty - Math.max(0, mpk - 2.2) * 0.4 + smooth * 0.55, 1, 10);

  return { name, distance: dist, eta, minutesPerKm: mpk,
           estimatedRisk: roundOne(risk), safetyScore: roundOne(safety),
           transitInfo: name === "Route A" ? currentTransitInfoA : currentTransitInfoB };
}

function pickBestRoute(a, b, mode) {
  const wsm = mode === "Women Safety Mode";
  const u = r => {
    const sw = wsm ? 1.85 : 1.25, ew = wsm ? 0.025 : 0.05, rw = wsm ? 0.75 : 0.4;
    return r.safetyScore * sw - r.eta * ew - r.estimatedRisk * rw -
           (r.estimatedRisk > 6 ? (wsm ? 4.5 : 3.2) : 0);
  };
  if (a.estimatedRisk > 6 && b.estimatedRisk <= 6) return b;
  if (b.estimatedRisk > 6 && a.estimatedRisk <= 6) return a;
  if (wsm) {
    if (Math.abs(a.safetyScore - b.safetyScore) >= 0.5)
      return a.safetyScore >= b.safetyScore ? a : b;
  } else {
    if (Math.abs(a.safetyScore - b.safetyScore) < 0.35 && a.eta !== b.eta)
      return a.eta <= b.eta ? a : b;
  }
  return u(a) >= u(b) ? a : b;
}

function buildReason(ch, alt, data, ctx) {
  const eg = Math.abs(ch.eta - alt.eta);
  const rg = roundOne(Math.abs(ch.estimatedRisk - alt.estimatedRisk));
  let l1;
  if (ch.eta <= alt.eta && ch.estimatedRisk <= alt.estimatedRisk)
    l1 = `${ch.name} is faster and keeps derived risk below ${alt.name} by ${rg}.`;
  else if (ch.eta < alt.eta)
    l1 = `${ch.name} saves ${eg} mins while keeping safety within limits.`;
  else
    l1 = `${ch.name} adds ${eg} mins but avoids the higher-risk profile of ${alt.name}.`;

  const n = [];
  if (data.mode === "Women Safety Mode") n.push("Women Safety Mode prioritised safety over speed");
  if (ctx.night.risk > 0) n.push(`${ctx.night.label} lowered the safety baseline`);
  if (ctx.weather.risk > 0.6) n.push(`${data.weather.toLowerCase()} conditions added caution`);
  if (!n.length) n.push(`${data.traffic.toLowerCase()} traffic kept ETA and safety closely matched`);
  return { lineOne: l1, lineTwo: `${n.slice(0,2).join(", ")}.` };
}

function buildTip(data, ctx) {
  if (data.mode === "Women Safety Mode" && ctx.night.risk > 0)
    return "Share live location before departure and avoid switching to isolated side roads.";
  if (ctx.weather.risk >= 0.8)
    return "Reduce speed on turns and stay on lit main corridors where visibility is better.";
  if (ctx.traffic.risk >= 0.75)
    return "Ignore shortcut detours through low-visibility lanes and stay on arterial roads.";
  return "Send the chosen route to a trusted contact and keep your phone charged before departure.";
}

function renderComparison(rA, rB, ch, data, ctx) {
  el.cardDistA.textContent   = `${rA.distance} km`;
  el.cardEtaA.textContent    = `${rA.eta} min`;
  el.cardRiskA.textContent   = `${rA.estimatedRisk}/10`;
  el.cardSafetyA.textContent = `${Math.round(rA.safetyScore)}/10`;
  el.cardDistB.textContent   = `${rB.distance} km`;
  el.cardEtaB.textContent    = `${rB.eta} min`;
  el.cardRiskB.textContent   = `${rB.estimatedRisk}/10`;
  el.cardSafetyB.textContent = `${Math.round(rB.safetyScore)}/10`;

  el.routeACard.classList.toggle("active-winner", ch.name === "Route A");
  el.routeBCard.classList.toggle("active-winner", ch.name === "Route B");
  el.routeSumA.classList.toggle("winner", ch.name === "Route A");
  el.routeSumB.classList.toggle("winner", ch.name === "Route B");

  const margin = roundOne(Math.abs(rA.safetyScore - rB.safetyScore));
  el.contextSummary.textContent = `${data.weather} • ${data.traffic} • ${ctx.night.label}`;
  el.biasSummary.textContent    = data.mode === "Women Safety Mode" ? "Safety-first weighting" : "Balanced ETA weighting";
  el.marginSummary.textContent  = `${margin} safety-point spread`;

  highlightWinner(ch.name);
}

function renderDecision(ch, alt, data, ctx) {
  const reason = buildReason(ch, alt, data, ctx);
  const score  = Math.round(ch.safetyScore);
  const tip    = buildTip(data, ctx);

  let transitText = "";
  if (ch.transitInfo && ch.transitInfo.length > 0) {
    transitText = `\n\n🗺 Transit Flow:\n` + ch.transitInfo.map(t => {
      const icon = t.type === 'BUS' ? '🚌' : t.type === 'SUBWAY' ? '🚇' : t.type === 'HEAVY_RAIL' ? '🚆' : '🚋';
      return `${icon} ${t.type} (${t.line}): Board at ${t.departureStop} ➔ Alight at ${t.arrivalStop} (${t.numStops} stops)`;
    }).join("\n");
  }

  el.strictOutput.textContent =
`🚦 Route: ${ch.name}
⏱ ETA: ${ch.eta} mins
🛡 Safety Score: ${score}/10

💡 Reason:
${reason.lineOne}
${reason.lineTwo}

⚠ Tip:
${tip}${transitText}`;

  el.decisionRoute.textContent  = ch.name;
  el.decisionEta.textContent    = `${ch.eta} min`;
  el.decisionSafety.textContent = `${score}/10`;

  // --- Populate Trip Notification Box ---
  let leaveTimeStr = data.time;
  let arrivalTimeStr = addMinutesToTimeStr(data.time, ch.eta);

  if (data.timeType === 'arrive') {
    arrivalTimeStr = data.time;
    leaveTimeStr = addMinutesToTimeStr(data.time, -ch.eta);
  }

  let hurdles = [];
  if (ctx.traffic.risk > 0.1 && data.transport !== 'transit') hurdles.push(`${data.traffic} Traffic`);
  if (ctx.weather.risk > 0) hurdles.push(data.weather);
  if (data.weather === 'Sunny' && window.lastUvIndex >= 6) hurdles.push(`High UV Index (${Math.round(window.lastUvIndex)}) - Use Sunscreen 🧴`);
  
  el.notifyLeaveTime.textContent = leaveTimeStr;
  el.notifyArrivalTime.textContent = `${arrivalTimeStr} (~${ch.eta} min transit)`;
  
  if (hurdles.length > 0) {
    el.notifyHurdlesRow.style.display = '';
    el.notifyHurdles.textContent = hurdles.join(', ');
  } else {
    el.notifyHurdlesRow.style.display = 'none';
  }

  el.tripNotificationBox.classList.remove('hidden');
  
  if (data.mode === 'Women Safety Mode' && ctx.night.risk > 0) {
    el.sosBtn.classList.remove('hidden');
    el.sosBtn.onclick = () => alert("SOS Triggered! Location shared with emergency contacts.");
  } else {
    el.sosBtn.classList.add('hidden');
  }

  el.addToCalBtn.onclick = () => generateICS(data.start, data.end, leaveTimeStr, arrivalTimeStr, ch.eta, hurdles.join(', '));
}

function generateICS(start, end, leaveTimeStr, arrivalTimeStr, eta, hurdles) {
  const now = new Date();
  
  const [lh, lm] = leaveTimeStr.split(':').map(Number);
  const leaveDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lh, lm);
  // Auto-detect tomorrow if the time has already passed today
  if (leaveDate < now && Math.abs(leaveDate.getTime() - now.getTime()) > 3600000 * 12) {
    leaveDate.setDate(leaveDate.getDate() + 1);
  }

  const [ah, am] = arrivalTimeStr.split(':').map(Number);
  const arriveDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ah, am);
  if (arriveDate < leaveDate) {
    arriveDate.setDate(arriveDate.getDate() + 1);
  }

  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startIcs = formatICSDate(leaveDate);
  const endIcs = formatICSDate(arriveDate);
  const stampIcs = formatICSDate(now);
  const uid = `urbanroute-${Date.now()}@urbanroute.app`;

  const icsStr = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UrbanRoute IQ//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${stampIcs}
DTSTART:${startIcs}
DTEND:${endIcs}
SUMMARY:UrbanRoute Trip to ${end}
DESCRIPTION:Leave at ${leaveTimeStr}. ETA: ${eta} mins.\\nHurdles: ${hurdles || 'None'}
BEGIN:VALARM
TRIGGER:-PT5M
ACTION:DISPLAY
DESCRIPTION:Reminder: Leave for your trip to ${end} in 5 minutes!
END:VALARM
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsStr], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trip-reminder.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function analyze() {
  const data = readFormData();
  if (!data.start || !data.end || !data.time ||
      !Number.isFinite(data.distA) || !Number.isFinite(data.distB) ||
      !Number.isFinite(data.etaA) || !Number.isFinite(data.etaB)) return;

  const ctx = buildContext(data);
  const rA  = buildRouteProfile("Route A", data.distA, data.etaA, data.distB, data.etaB, ctx, data.mode);
  const rB  = buildRouteProfile("Route B", data.distB, data.etaB, data.distA, data.etaA, ctx, data.mode);
  const ch  = pickBestRoute(rA, rB, data.mode);
  const alt = ch.name === "Route A" ? rB : rA;

  renderComparison(rA, rB, ch, data, ctx);
  renderDecision(ch, alt, data, ctx);
}

/* ---------- Sample trip ---------- */
function applySampleTrip() {
  getField("startLocation").value = SAMPLE_TRIP.start;
  getField("endLocation").value   = SAMPLE_TRIP.end;
  getField("travelTime").value    = SAMPLE_TRIP.time;
  getField("trafficLevel").value  = SAMPLE_TRIP.traffic;
  getField("riskScore").value     = SAMPLE_TRIP.risk;
  getField("weather").value       = SAMPLE_TRIP.weather;
  getField("travelMode").value    = SAMPLE_TRIP.mode;
  el.riskValue.textContent        = SAMPLE_TRIP.risk;
  fetchRoutes();
}

/* ---------- Autocomplete ---------- */
async function fetchAutocomplete(inputEl, menuEl) {
  const q = inputEl.value.trim();
  if (q.length < 3) {
    menuEl.classList.remove('show');
    return;
  }
  try {
    const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    menuEl.innerHTML = '';
    if (data.suggestions && data.suggestions.length > 0) {
      data.suggestions.forEach(s => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = s.name;
        item.addEventListener('click', () => {
          inputEl.value = s.name;
          menuEl.classList.remove('show');
        });
        menuEl.appendChild(item);
      });
      menuEl.classList.add('show');
    } else {
      menuEl.classList.remove('show');
    }
  } catch(e) {
    menuEl.classList.remove('show');
  }
}

function setupAutocomplete() {
  const startInput = getField('startLocation');
  const endInput = getField('endLocation');
  
  startInput.addEventListener('input', debounce(() => fetchAutocomplete(startInput, el.startLocationMenu), 300));
  endInput.addEventListener('input', debounce(() => fetchAutocomplete(endInput, el.endLocationMenu), 300));

  document.addEventListener('click', (e) => {
    if (!startInput.contains(e.target) && !el.startLocationMenu.contains(e.target)) {
      el.startLocationMenu.classList.remove('show');
    }
    if (!endInput.contains(e.target) && !el.endLocationMenu.contains(e.target)) {
      el.endLocationMenu.classList.remove('show');
    }
  });

  startInput.addEventListener('focus', () => {
    if (el.startLocationMenu.children.length > 0) el.startLocationMenu.classList.add('show');
  });
  endInput.addEventListener('focus', () => {
    if (el.endLocationMenu.children.length > 0) el.endLocationMenu.classList.add('show');
  });
}

/* ---------- Init ---------- */
function initialise() {
  domIds.forEach(id => { el[id] = document.getElementById(id); });
  el.riskValue.textContent = getField("riskScore").value;

  initMap();
  setupAutocomplete();

  el.routeForm.addEventListener("submit", e => { e.preventDefault(); fetchRoutes(); });
  el.sampleBtn.addEventListener("click", applySampleTrip);

  el.riskScore.addEventListener("input", () => {
    el.riskValue.textContent = el.riskScore.value;
    if (el.etaA.value && el.etaB.value) analyze();
  });

  ["travelTime","travelMode","trafficLevel","weather"].forEach(id => {
    getField(id).addEventListener("change", () => {
      if (el.etaA.value && el.etaB.value) analyze();
    });
  });

  // ── Click on route cards to focus/highlight that route on the map ──
  // Route input cards
  document.querySelector('.route-input-a')?.addEventListener('click', () => focusRoute('A'));
  document.querySelector('.route-input-b')?.addEventListener('click', () => focusRoute('B'));

  // Route summary cards (below map)
  if (el.routeSumA) el.routeSumA.addEventListener('click', () => focusRoute('A'));
  if (el.routeSumB) el.routeSumB.addEventListener('click', () => focusRoute('B'));

  // Comparison cards
  if (el.routeACard) el.routeACard.addEventListener('click', () => focusRoute('A'));
  if (el.routeBCard) el.routeBCard.addEventListener('click', () => focusRoute('B'));

  // Auto-switch to Women Safety Mode for night time
  getField("travelTime").addEventListener("change", (e) => {
    const time = e.target.value;
    const ctx = getNightContext(time);
    if (ctx.risk > 0) {
      getField("travelMode").value = "Women Safety Mode";
      flashAutoField("travelMode");
    }
  });

  applySampleTrip();
}

initialise();
