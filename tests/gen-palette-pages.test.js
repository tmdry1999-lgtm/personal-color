import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderTonePalettes, renderSeasonExtras } from '../tools/gen-palette-pages.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const palettes = JSON.parse(read('../app/data/palettes.json'));

test('tone-palettes.md는 palettes.json에서 생성한 내용과 같다 (npm run gen:palettes)', () => {
  assert.equal(read('../wiki/palettes/tone-palettes.md'), renderTonePalettes(palettes));
});

test('season-extras.md는 palettes.json에서 생성한 내용과 같다 (npm run gen:palettes)', () => {
  assert.equal(read('../wiki/palettes/season-extras.md'), renderSeasonExtras(palettes));
});
