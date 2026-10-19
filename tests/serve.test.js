import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStaticServer } from '../tools/serve.js';

test('정적 서버: JSON·JS 타입, 없는 파일 404', async () => {
  const server = createStaticServer('.');
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const json = await fetch(`${base}/app/data/seasons.json`);
    assert.equal(json.status, 200);
    assert.ok(json.headers.get('content-type').startsWith('application/json'));
    const js = await fetch(`${base}/app/src/color.js`);
    assert.ok(js.headers.get('content-type').startsWith('text/javascript'));
    assert.equal((await fetch(`${base}/nope.txt`)).status, 404);
    assert.equal((await fetch(`${base}/%2e%2e/secret`)).status, 404);
  } finally {
    server.close();
  }
});

test('정적 서버: / 와 /app 은 /app/ 으로 보낸다 (끝 / 없이 쳐도 열리게)', async () => {
  const server = createStaticServer('.');
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ['/', '/app']) {
      const res = await fetch(`${base}${path}`, { redirect: 'manual' });
      assert.equal(res.status, 302, path);
      assert.equal(res.headers.get('location'), '/app/', path);
    }
    assert.equal((await fetch(`${base}/app`)).status, 200);
    assert.equal((await fetch(`${base}/app/result.html?v=1`)).status, 200);
  } finally {
    server.close();
  }
});
