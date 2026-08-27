// seed-trips.cjs — seed demo trips via raw PG protocol over TCP
const net = require('net');
const crypto = require('crypto');

const TRIPS = [
  { title: 'Aventuras no Porto', start: '2025-05-01', end: '2025-05-05', sum: 'Ribeira e caves', desc: 'Vinhos do Porto, ribeira e francesinhas.', rating: 4 },
  { title: 'Algarve Dourado', start: '2025-07-10', end: '2025-07-20', sum: 'Praias e falésias', desc: 'Costa vicentina, marisco, pores-do-sol únicos.', rating: 5 },
  { title: 'Madeira Selvagem', start: '2025-09-01', end: '2025-09-08', sum: 'Levadas e florestas', desc: 'Caminhadas nas levadas, Laurisilva, poncha.', rating: 5 },
  { title: 'Sintra Mística', start: '2025-10-12', end: '2025-10-15', sum: 'Palácios e jardins', desc: 'Pena, Quinta da Regaleira, Cascais.', rating: 4 },
  { title: 'Évora Romana', start: '2025-04-20', end: '2025-04-22', sum: 'Templo e capela', desc: 'Templo de Diana, Capela dos Ossos, vinhas do Alentejo.', rating: 4 },
];

// Bare-minimum Postgres v3 client (no library). Just for seeding; not for prod.
// We'll use the simple-query protocol and md5 auth.
const MD5 = (s) => crypto.createHash('md5').update(s).digest('hex');

function buf(...items) { return Buffer.concat(items.map((i) => Buffer.isBuffer(i) ? i : Buffer.from(String(i)))); }
function int32(n) { const b = Buffer.alloc(4); b.writeInt32BE(n); return b; }
function cstr(s) { return buf(s, '\0'); }

class PgConn {
  constructor() { this.buf = Buffer.alloc(0); this.authDone = false; this.ready = null; this.responses = []; }
  feed(data) {
    this.buf = Buffer.concat([this.buf, data]);
    while (this.buf.length >= 5) {
      const type = String.fromCharCode(this.buf[0]);
      const len = this.buf.readInt32BE(1);
      if (this.buf.length < 1 + len) return;
      const payload = this.buf.slice(5, 1 + len);
      this.buf = this.buf.slice(1 + len);
      if (type === 'R') {
        const code = payload.readInt32BE(0);
        if (code === 0) this.authDone = true; // AuthOK
        else if (code === 5) { /* MD5Password */ }
        return;
      }
      if (type === 'Z') { this.readyResolve && this.readyResolve(); return; }
      if (type === 'E' || type === 'N') {
        const msg = payload.toString('utf8').replace(/\0+$/, '');
        this.responses.push({ type, msg });
      }
      if (type === 'C') { /* CommandComplete, ignore */ }
      if (type === 'D') { /* DataRow, ignore for INSERT */ }
    }
  }
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.readyResolve = () => {
        if (this.responses.some((r) => r.type === 'E')) {
          reject(new Error(this.responses.find((r) => r.type === 'E').msg));
        } else { resolve(); }
      };
      const msg = buf('Q', int32(0), cstr(sql));
      const len = int32(msg.length - 1 + 4);
      const final = Buffer.concat([cstr('Q').slice(0, 1), len, cstr(sql).slice(0)]);
      this.sock.write(final.slice(0, 1).length === 1 ? Buffer.concat([cstr('Q').slice(0, 1), int32(4 + cstr(sql).length), cstr(sql)]) : final);
    });
  }
  sendStartup() {
    const params = buf('user\0postgres\0database\0globalmemories\0\0');
    const len = int32(params.length + 4);
    this.sock.write(Buffer.concat([int32(196608), len, params]));
  }
  sendMd5Password(salt) {
    const inner = MD5(MD5('password' + 'postgres') + salt);
    const msg = buf('p', int32(4 + cstr('md5' + inner).length), cstr('md5' + inner));
    this.sock.write(msg);
  }
  async connect() {
    return new Promise((resolve, reject) => {
      this.sock = net.connect(5432, '127.0.0.1');
      this.sock.on('data', (d) => this.feed(d));
      this.sock.on('error', reject);
      this.sock.on('connect', () => {
        this.sendStartup();
        setTimeout(() => {
          // After startup, expect R=0 (AuthOk) for trust auth
          // But our DB uses md5 (we set PGPASSWORD=password)
          // Look at last response to find R type
          // Simpler: just try sending Query and see
          resolve();
        }, 500);
      });
    });
  }
}

(async () => {
  const c = new PgConn();
  await c.connect();
  await new Promise((r) => setTimeout(r, 1500));
  for (const t of TRIPS) {
    const sql = `INSERT INTO trip (title, start_date, end_date, user_id, trip_sumary, trip_description, trip_rating, trip_privacy, allow_comments) VALUES ('${t.title.replace(/'/g, "''")}', '${t.start}', '${t.end}', 4, '${t.sum.replace(/'/g, "''")}', '${t.desc.replace(/'/g, "''")}', ${t.rating}, 'public', true);`;
    try {
      await c.exec(sql);
      console.log(`  seeded: ${t.title}`);
    } catch (e) {
      console.log(`  FAILED ${t.title}: ${e.message}`);
    }
  }
  c.sock.end();
  console.log('Done');
})();
