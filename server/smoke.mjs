/**
 * Smoke test API (chạy khi server đã bật: npm start).
 * Usage: node smoke.mjs
 */
const base = process.env.SMOKE_URL || 'http://127.0.0.1:3333';

async function req(method, path, body, headers = {}) {
  const r = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: r.status, json };
}

const user = 'smoke_' + Date.now();
const pass = 'testpass12';

async function main() {
  console.log('Base:', base);

  let x = await req('GET', '/api/leaderboards/combined?limit=10');
  console.log('GET leaderboards combined', x.status, x.json.entries ? x.json.entries.length + ' entries' : x.json);

  x = await req('POST', '/api/auth/register', { username: user, password: pass });
  console.log('POST register', x.status, x.json.token ? 'token ok' : x.json);
  if (x.status !== 200) process.exit(1);
  const token = x.json.token;

  x = await req('GET', '/api/auth/me', null, { Authorization: 'Bearer ' + token });
  console.log('GET me', x.status, x.json);

  x = await req('POST', '/api/scores', { gameId: 'game1_1', score: 42, meta: { test: true } }, {
    Authorization: 'Bearer ' + token,
  });
  console.log('POST scores', x.status, x.json);

  x = await req('POST', '/api/scores', { gameId: 'game2_1', score: 30, meta: { test: true } }, {
    Authorization: 'Bearer ' + token,
  });
  console.log('POST scores game2_1', x.status, x.json);

  x = await req('GET', '/api/leaderboards/combined?limit=5');
  console.log('GET leaderboards combined after both games', x.status, JSON.stringify(x.json).slice(0, 240));

  x = await req('GET', '/api/players/me/best', null, { Authorization: 'Bearer ' + token });
  console.log('GET me/best', x.status, x.json);

  x = await req('POST', '/api/auth/logout', {}, { Authorization: 'Bearer ' + token });
  console.log('POST logout', x.status, x.json);

  x = await req('GET', '/api/auth/me', null, { Authorization: 'Bearer ' + token });
  console.log('GET me after logout (expect 401)', x.status);

  console.log('\nSmoke OK.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
