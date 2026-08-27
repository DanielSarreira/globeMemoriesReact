// Validates the normalise logic by fetching the live API and running the same transform
// that InteractiveMap.js will run.

const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

// Same logic as InteractiveMap.normaliseFeedTrip
function normaliseFeedTrip(raw) {
  if (!raw) return null;
  const id = raw.id ?? raw.tripId;
  const title = raw.title ?? raw.tripTitle ?? "";
  const user = raw.user ?? raw.username ?? "";
  const countries = Array.isArray(raw.countriesVisited)
    ? raw.countriesVisited
    : (raw.country ? [raw.country] : []);
  const cities = Array.isArray(raw.citiesVisited)
    ? raw.citiesVisited
    : (raw.city ? [raw.city] : []);

  const pairs = [];
  if (cities.length > 0) {
    cities.forEach((city, idx) => {
      const country = countries[idx] || countries[0] || "";
      if (city && country) pairs.push({ city, country });
    });
  }
  if (pairs.length === 0 && countries.length > 0) {
    countries.forEach((country) => pairs.push({ city: country, country }));
  }
  if (pairs.length === 0) return null;

  return pairs.map((p) => ({
    id, title, city: p.city, country: p.country,
    user, tripLink: `/travel/${id}`,
    label: `${p.city}, ${p.country}`,
  }));
}

function flatFeedTrips(list) {
  const out = [];
  (list || []).forEach((raw) => {
    const norm = normaliseFeedTrip(raw);
    if (Array.isArray(norm)) out.push(...norm);
  });
  return out;
}

(async () => {
  const r = await get('http://localhost:8080/trips/public-feed');
  console.log(`HTTP ${r.status}, totalElements=${r.body.totalElements}`);
  const flat = flatFeedTrips(r.body.content);
  console.log(`\nFLATTENED to ${flat.length} map entries:\n`);
  flat.forEach((t, i) => {
    console.log(`  [${i}] id=${t.id} title="${t.title}" user="${t.user}" -> ${t.label} -> /travel/${t.id}`);
  });
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(2); });
