// e2e-full.cjs — end-to-end test of the full requested flow
const http = require('http');
const WebSocket = require('ws');
const { execSync } = require('child_process');
const fs = require('fs');

function jsonReq(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? (Buffer.isBuffer(body) ? body : JSON.stringify(body)) : null;
    const opts = {
      hostname: '127.0.0.1', port: 8080, path, method,
      headers: {
        ...(data && !Buffer.isBuffer(data) ? { 'Content-Type': 'application/json' } : {}),
        ...(data ? { 'Content-Length': data.length } : {}),
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(d); } catch (e) {}
        resolve({ status: res.statusCode, body: json, raw: d, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function rawUpload(path, buffer, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----e2e' + Date.now();
    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, buffer, footer]);
    const opts = {
      hostname: '127.0.0.1', port: 8080, path, method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
    req.write(body);
    req.end();
  });
}

async function main() {
  // ── 0. DB has admin from previous session ──
  console.log('─── 0. Health ───');
  const root = await jsonReq('GET', '/actuator/health');
  console.log(`  /actuator/health: ${root.status} (${root.body ? JSON.stringify(root.body) : 'no body'})`);

  // ── 1. Register a new test user ──
  console.log('\n─── 1. Register new test user ───');
  const ts = Date.now();
  const username = `e2e_${ts}`;
  const reg = await jsonReq('POST', '/register', {
    firstName: 'E2E', lastName: 'Test', nationality: 'Portugal',
    cityId: 1, email: `${username}@e2e.com`, username, password: 'Password123!', passwordConfirm: 'Password123!',
    privateProfile: false,
  });
  console.log(`  POST /register: ${reg.status}, id: ${reg.body?.id}, token: ${reg.body?.token ? reg.body.token.substring(0, 30) + '...' : 'NO TOKEN'}`);
  if (reg.status !== 201) { console.log('Registration failed. Aborting.'); return; }
  const userId = reg.body.id;
  const token = reg.body.token;

  // ── 2. Verify default photo is null ──
  console.log('\n─── 2. Initial profile (no photo) ───');
  const me1 = await jsonReq('GET', `/users/${userId}/detailed`, null, { 'Authorization': `Bearer ${token}` });
  console.log(`  /users/${userId}/detailed: ${me1.status}, profilePhoto: ${me1.body?.profilePhoto || 'null'}`);

  // ── 3. Upload a profile photo ──
  console.log('\n─── 3. Upload profile photo ───');
  // Create a minimal valid JPEG (1x1 red pixel)
  const tinyJpeg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x72, 0x73, 0x74,
    0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88,
    0x89, 0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2,
    0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5,
    0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8,
    0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1,
    0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3,
    0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01,
    0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF, 0xD9,
  ]);
  const up = await rawUpload('/photos/upload', tinyJpeg, token);
  console.log(`  POST /photos/upload: ${up.status}`);
  console.log(`    fileUrl: ${up.body?.fileUrl}`);
  console.log(`    publicUrl: ${up.body?.publicUrl}`);
  const newPhotoUrl = up.body?.fileUrl;
  if (!newPhotoUrl) { console.log('Upload failed. Aborting.'); return; }

  // ── 4. Verify backend actually saved the new URL ──
  console.log('\n─── 4. Verify DB has new photo URL ───');
  const me2 = await jsonReq('GET', `/users/${userId}/detailed`, null, { 'Authorization': `Bearer ${token}` });
  console.log(`  /users/${userId}/detailed: ${me2.status}, profilePhoto: ${me2.body?.profilePhoto}`);
  const sameUrl = me2.body?.profilePhoto === newPhotoUrl;
  console.log(`  Matches upload response? ${sameUrl ? '✓ YES' : '✗ NO'}`);

  // ── 5. Verify the photo file is accessible on the server ──
  console.log('\n─── 5. Fetch the photo file ───');
  const photoPath = `/files/${newPhotoUrl}`;
  const photoRes = await new Promise((resolve) => {
    http.get(`http://localhost:8080${photoPath}`, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => resolve({ status: res.statusCode, size: d.length }));
    }).on('error', () => resolve({ status: 0 }));
  });
  console.log(`  GET ${photoPath}: ${photoRes.status}, size: ${photoRes.size} bytes`);

  // ── 6. Username availability check ──
  console.log('\n─── 6. Username availability ───');
  const taken = await jsonReq('GET', `/users/check-username?username=${username}&firstName=John&lastName=Smith`);
  console.log(`  taken: ${JSON.stringify(taken.body)}`);
  const available = await jsonReq('GET', `/users/check-username?username=brand_new_${ts}`);
  console.log(`  available: ${JSON.stringify(available.body)}`);

  // ── 7. Update profile text fields via PATCH ──
  console.log('\n─── 7. Update profile (text fields) ───');
  const upd = await jsonReq('PATCH', `/users/${userId}/update-profile`, {
    firstName: 'E2E Updated', lastName: 'Test', userBio: 'I love traveling!',
    nationality: 'Portugal', city: 'Lisbon, Portugal', gender: 'M',
    birthDate: '1990-01-01', languagesSpoken: 'Portuguese, English',
  }, { 'Authorization': `Bearer ${token}` });
  console.log(`  PATCH /users/${userId}/update-profile: ${upd.status}`);
  if (upd.body) {
    console.log(`    firstName: ${upd.body.firstName}, userBio: ${upd.body.userBio}`);
  }

  // ── 8. Delete photo ──
  console.log('\n─── 8. Delete profile photo ───');
  const del = await jsonReq('DELETE', '/photos/profile', null, { 'Authorization': `Bearer ${token}` });
  console.log(`  DELETE /photos/profile: ${del.status}`);
  const me3 = await jsonReq('GET', `/users/${userId}/detailed`, null, { 'Authorization': `Bearer ${token}` });
  console.log(`  profilePhoto after delete: ${me3.body?.profilePhoto || 'null'}`);

  // ── 9. Login again with the same credentials ──
  console.log('\n─── 9. Login again with new credentials ───');
  const login = await jsonReq('POST', '/login', { username, password: 'Password123!' });
  console.log(`  POST /login: ${login.status}, token: ${login.body?.token ? 'YES' : 'NO'}`);

  console.log('\n=== ALL DONE ===');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
