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
