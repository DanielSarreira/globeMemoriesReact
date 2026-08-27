// 1. Regista/login de um user de teste
// 2. Cria uma viagem multi-destino com custo em USD e captions
// 3. GET /trips/{id}/edit-details → confirma citiesDetail, currency, captions, accommodations
// 4. PUT /trips/{id} → atualiza e confirma persistência
const http = require('http');

function jsonReq(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port: 8080, path, method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(d); } catch (e) {}
        resolve({ status: res.statusCode, body: json, raw: d });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const ts = Date.now();
  const username = `edit_${ts}`;

  // ── 1. Register ──
  console.log('─── 1. Registar user ───');
  const reg = await jsonReq('POST', '/register', {
    firstName: 'Edit', lastName: 'Test', nationality: 'Portugal',
    cityId: 1, email: `${username}@e2e.com`, username, password: 'Password123!', passwordConfirm: 'Password123!',
    privateProfile: false,
  });
  console.log(`  POST /register: ${reg.status}, id: ${reg.body?.id}`);
  if (reg.status !== 201) { console.log('  ABORT — registo falhou'); return; }
  const token = reg.body.token;
  const auth = { 'Authorization': `Bearer ${token}` };

  // ── 2. Criar viagem (multi-destino, USD, captions, accommodation completo) ──
  console.log('\n─── 2. Criar viagem multi-destino ───');
  const create = await jsonReq('POST', '/trips', {
    userId: reg.body.id,
    cities: [1, 2], // Lisboa + Porto
    title: 'Viagem de Edição Teste',
    startDate: '2024-05-01', endDate: '2024-05-05', tripDurationDays: 5,
    tripSummary: 'Uma viagem de teste multi-cidade para validar a edição.',
    tripDescription: 'Descrição completa da viagem de edição: Lisboa, Porto, gastronomia e cultura. Texto com mais de 20 caracteres para passar a validação.',
    weather: 'Sunny', tripRating: 4,
    tripPrivacy: 'PUBLIC', isHidden: false,
    cost: { total: 500, currency: 'USD', transport: 200, accommodation: 200, food: 50, extra: 50 },
    categories: [1], languagesSpoken: [1],
    accommodations: [{
      name: 'Hotel Teste', accommodationTypeId: 1, accommodationBoardId: 1,
      city: 'Lisboa, Portugal', price: 200, nrNights: 2,
      checkIn: '2024-05-01', checkOut: '2024-05-03',
      description: 'Quarto duplo', rating: 4, photos: [],
    }],
    recommendedFoods: [{ name: 'Bacalhau à Brás', description: 'Prato típico', city: 'Lisboa, Portugal', photos: [] }],
    tripTransports: [{ transportId: 1, cost: 200, description: 'Voo ida e volta', photos: [] }],
    referencePoints: [{ name: 'Torre de Belém', description: 'Monumento', city: 'Lisboa, Portugal', type: 'Monumento', photos: [] }],
    photos: ['trip-photos/cover-test.jpg', 'trip-photos/gal1-test.jpg'],
    photoCaptions: [null, 'Vista da Torre de Belém'],
    tripItinerary: { days: [{ day: '1', topics: [{ name: 'Visita a Belém', description: '' }] }] },
    positivePoints: [{ name: 'Boa comida', description: 'Excelente gastronomia' }],
    negativePoints: [{ name: 'Multidão', description: 'Muita gente em agosto' }],
  }, auth);
  console.log(`  POST /trips: ${create.status}, id: ${create.body?.id}`);
  if (create.status !== 200 && create.status !== 201) { console.log(`  ERRO: ${create.raw}`); return; }
  const tripId = create.body?.id;
  if (!tripId) { console.log('  ABORT — sem tripId na resposta'); return; }

  // ── 3. GET edit-details ──
  console.log('\n─── 3. GET /trips/{id}/edit-details ───');
  const ed = await jsonReq('GET', `/trips/${tripId}/edit-details`, null, auth);
  console.log(`  status: ${ed.status}`);
  if (ed.status !== 200) { console.log(`  ERRO: ${ed.raw}`); return; }
  const d = ed.body;
  console.log(`  cities: ${JSON.stringify(d.cities)}`);
  console.log(`  citiesDetail: ${JSON.stringify(d.citiesDetail)}`);
  console.log(`  currency: ${d.cost?.currency}`);
  console.log(`  cost: total=${d.cost?.total} transport=${d.cost?.transport} acc=${d.cost?.accommodation}`);
  console.log(`  photoCaptions: ${JSON.stringify(d.photoCaptions)}`);
  console.log(`  accommodations[0]: ${JSON.stringify(d.accommodations?.[0])}`);
  console.log(`  type(single/multi inferido): ${(Array.isArray(d.citiesDetail) ? d.citiesDetail.length : 0) > 1 ? 'multi' : 'single'}`);

  const checks = {
    citiesDetail: Array.isArray(d.citiesDetail) && d.citiesDetail.length === 2,
    currencyPreserved: d.cost?.currency === 'USD',
    captionsPreserved: Array.isArray(d.photoCaptions) && d.photoCaptions.length === 2 && d.photoCaptions[1] === 'Vista da Torre de Belém',
    accommodationMapped: d.accommodations?.[0]?.accommodationTypeId != null && d.accommodations?.[0]?.nrNights === 2,
    costsMapped: Number(d.cost?.transport) === 200 && Number(d.cost?.accommodation) === 200,
  };
  console.log('\n  --- VERIFICAÇÕES ---');
  Object.entries(checks).forEach(([k, v]) => console.log(`  ${v ? '✅' : '❌'} ${k}`));
  const allOk = Object.values(checks).every(Boolean);

  // ── 4. PUT (editar título + custo) ──
  console.log('\n─── 4. PUT /trips/{id} (editar) ───');
  const upd = await jsonReq('PUT', `/trips/${tripId}`, {
    ...d,
    title: 'Viagem Editada — Título Alterado',
    cost: { total: 600, currency: 'EUR', transport: 250, accommodation: 250, food: 60, extra: 40 },
    cities: d.citiesDetail ? d.citiesDetail.map((c) => c.cityId) : d.cities,
  }, auth);
  console.log(`  PUT: ${upd.status}`);
  if (upd.status !== 200) { console.log(`  ERRO: ${upd.raw}`); return; }

  const ed2 = await jsonReq('GET', `/trips/${tripId}/edit-details`, null, auth);
  const d2 = ed2.body;
  const checks2 = {
    titleUpdated: d2.title === 'Viagem Editada — Título Alterado',
    currencyUpdated: d2.cost?.currency === 'EUR',
    costUpdated: Number(d2.cost?.total) === 600,
    citiesKept: Array.isArray(d2.citiesDetail) && d2.citiesDetail.length === 2,
    captionsKept: Array.isArray(d2.photoCaptions) && d2.photoCaptions[1] === 'Vista da Torre de Belém',
  };
  console.log('  --- VERIFICAÇÕES PÓS-PUT ---');
  Object.entries(checks2).forEach(([k, v]) => console.log(`  ${v ? '✅' : '❌'} ${k}`));
  const allOk2 = Object.values(checks2).every(Boolean);

  console.log(`\n=== ${allOk && allOk2 ? 'TODOS OS TESTES PASSARAM ✅' : 'ALGUNS TESTES FALHARAM ❌'} ===`);
}

