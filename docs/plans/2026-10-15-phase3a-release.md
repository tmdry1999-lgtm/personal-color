# 3단계-A 배포 준비 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `phase3a-camera` 브랜치를 방문객에게 내보내도 되는 상태로 만든다. 측정 기록과 턱 들기는 운영자가 켤 때만 동작하게 하고, 웹캠 설정은 웹캠별로 저장한다. 그다음 master에 병합하고 배포한다.

**Architecture:** 두 운영자 모드(데이터 수집, 턱 들기)는 새 순수 모듈 `app/src/modes.js`에 기본값과 표시 문구를 둔다. 상태는 `operator.js`의 메모리에만 둔다(저장하지 않으므로 새로고침하면 꺼짐). 기존 판정 함수 `shouldLog`·`needsNeckCapture`는 모드를 인자로 받는다. 웹캠 설정은 `settings.cameras[deviceId]`로 나눠 저장하고, 옛 형식(`settings.camera`)은 불러올 때 옮긴다.

**Tech Stack:** HTML + ES 모듈(빌드 없음), Node 24 `node:test`. 새 라이브러리 없음.

**Spec:** `docs/specs/2026-10-12-personal-color-booth-design.md`, 근거: `wiki/decisions/status-2026-10-13.md`, 2026-10-15 브랜치 리뷰

## 이번 계획에서 정한 것 (사용자 결정 2026-10-15)

1. **데이터 수집 모드**: 켜면 측정 기록이 쌓인다. 꺼져 있으면(기본) 아무것도 기록하지 않는다.
2. **턱 들기 모드**: 데이터 수집 모드와 따로 켜고 끈다. 기본은 꺼짐. 켜져 있어도 "베이스 화장했어요"를 체크한 사람만 턱 들기 단계를 거친다.
3. 두 모드 모두 **저장하지 않는다**. 새로고침하면 꺼진 상태(방문객 모드)로 돌아간다.
4. 모드가 하나라도 켜져 있으면 화면 오른쪽 아래에 작은 표시: 예 `기록 중 · P3 · 턱 들기`.
5. 데이터 수집 모드가 꺼져 있는데 기록이 남아 있으면 운영자 창에 "기록 N건이 남아 있습니다" 안내. 자동으로 지우지 않는다.
6. **웹캠 설정은 웹캠별로 저장한다.** 저장값이 없는 웹캠은 그 웹캠의 기본값(켤 때의 자동 값)으로 고정하고 그 값을 저장한다. [웹캠 설정 초기화]는 지금 쓰는 웹캠의 값만 지운다.
7. 옛 형식의 저장값(`camera`)은 처음 열리는 웹캠의 값으로 넘겨받는다. 부스 PC에서 맞춰 둔 노출 값을 잃지 않기 위해서다.

## 이번에 하지 않는 것 (`wiki/decisions/phase3-backlog.md`에 기록만)

- 눈동자 색상각 필터의 채도 하한, 0/360° 경계
- 턱 든 목 사진 프레임이 0장이면 경고 없음, 1장만 있어도 값을 받아들임
- 목만 쓰는데 매 프레임 전체 영역을 계산함(성능), 목 픽셀을 Lab으로 두 번 변환함
- 중복 코드 3쌍(`measureLitRegion`/`measureRegion`, `sampleMaskInRect`/`sampleMask`, `parseTypedValue`/`clampToCaps`), `chinLifted(delta + baseline, baseline)` 계산식

## Global Constraints

- 사진·프레임 픽셀은 메모리에서만 쓰고 분석 뒤 참조를 버린다. 디스크·서버·저장소·로그에 저장하지 않는다.
- `localStorage`(`pc-booth-settings`)에는 운영자 설정만 둔다: 웹캠 id, A4 영역, 카드 종류, 웹캠별 설정값, 환경 메모. **운영자 모드는 저장하지 않는다.**
- 측정 기록(`sessionStorage`의 `pc-booth-log`)은 **데이터 수집 모드가 켜져 있을 때만** 추가한다. 숫자만 담는다.
- 판정 기준값(`app/data/seasons.json`의 범위·가중치)은 바꾸지 않는다.
- 숫자 기준값은 코드에 쓰지 않고 `seasons.json`에서 읽는다.
- 화면 문구는 한국어. 코드 식별자·JSON 키는 영어.
- 위키를 바꾸면 `wiki/log.md`에 한 줄 기록한다. 마지막에 `npm run check` 통과.
- 대상 브라우저: Windows Chrome.

## Review Focus

1. **새로고침하면 두 모드가 꺼진다.** Chrome은 새로고침 때 체크박스 상태를 되살릴 수 있다 → `autocomplete="off"`와 시작 시 `checked = false`로 막는다 (Task 1·2 수동 확인).
2. **모드가 꺼져 있으면 기록이 한 건도 늘지 않는다.** 측정을 여러 번 해도 `op-log-count`가 그대로여야 한다 (Task 1 `shouldLog` 테스트 + 수동 확인).
3. **부스 PC에 저장된 옛 웹캠 설정이 사라지지 않는다.** 배포 후 첫 실행에서 노출 값이 전과 같아야 한다 (Task 3 이전 형식 테스트 + Task 5 수동 확인).
4. **웹캠을 2초 안에 두 번 바꿔도** 이전 웹캠의 값이 새 웹캠에 적용되거나 저장되지 않는다 (Task 3 타이머 가드 + 수동 확인).
5. **턱 들기 모드가 꺼져 있으면 베이스 화장을 체크해도 턱 들기 화면이 나오지 않는다** (Task 2 `needsNeckCapture` 테스트 + 수동 확인).

---

### Task 1: 데이터 수집 모드 (기록은 켤 때만)

**Files:**
- Create: `app/src/modes.js`
- Create: `tests/modes.test.js`
- Modify: `app/src/measure-log.js` (`shouldLog`)
- Modify: `tests/measure-log.test.js:52-57`
- Modify: `app/src/operator.js`
- Modify: `app/src/app.js` (`shouldLog` 호출부)
- Modify: `app/index.html` (운영자 창, 표시 배지)
- Modify: `app/style.css`

**Interfaces:**
- Produces: `DEFAULT_MODES = { dataCollection: false, chinLift: false }`, `modeBadgeText(modes, participant) → string | null`, `leftoverLogNotice(modes, count) → string`, `shouldLog(out, modes) → boolean`, operator가 돌려주는 `modes() → { dataCollection, chinLift }` (복사본)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/modes.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MODES, modeBadgeText, leftoverLogNotice } from '../app/src/modes.js';

test('DEFAULT_MODES: 두 모드 모두 꺼짐 (방문객 모드가 기본)', () => {
  assert.deepEqual(DEFAULT_MODES, { dataCollection: false, chinLift: false });
  assert.ok(Object.isFrozen(DEFAULT_MODES));
});

test('modeBadgeText: 모두 꺼져 있으면 null', () => {
  assert.equal(modeBadgeText(DEFAULT_MODES, 'P3'), null);
});

test('modeBadgeText: 켜진 모드와 참가자 번호를 보여준다', () => {
  assert.equal(modeBadgeText({ dataCollection: true, chinLift: false }, ' P3 '), '기록 중 · P3');
  assert.equal(modeBadgeText({ dataCollection: false, chinLift: true }, 'P3'), '턱 들기');
  assert.equal(modeBadgeText({ dataCollection: true, chinLift: true }, 'P3'), '기록 중 · P3 · 턱 들기');
});

test('modeBadgeText: 참가자 번호가 비면 "P?" (makeLogEntry와 같은 규칙)', () => {
  assert.equal(modeBadgeText({ dataCollection: true, chinLift: false }, '  '), '기록 중 · P?');
});

test('leftoverLogNotice: 수집 모드가 꺼져 있고 기록이 남아 있을 때만 안내', () => {
  assert.equal(leftoverLogNotice({ dataCollection: false, chinLift: false }, 3), '기록 3건이 남아 있습니다. [모두 복사] 후 [비우기] 해 주세요.');
  assert.equal(leftoverLogNotice({ dataCollection: false, chinLift: false }, 0), '');
  assert.equal(leftoverLogNotice({ dataCollection: true, chinLift: false }, 3), '');
});
```

`tests/measure-log.test.js`의 52~57행 테스트를 아래로 바꾼다:

```js
test('shouldLog: 데이터 수집 모드가 켜져 있고 성공한 측정만 기록한다', () => {
  const on = { dataCollection: true, chinLift: false };
  const off = { dataCollection: false, chinLift: false };
  assert.equal(shouldLog(okOut, on), true);
  for (const error of ['card_saturated', 'card_occluded', 'card_missing', 'too_dark', 'no_skin', 'not_enough_frames']) {
    assert.equal(shouldLog({ ok: false, error }, on), false, error);
  }
});

test('shouldLog: 데이터 수집 모드가 꺼져 있거나 모드를 모르면 기록하지 않는다 (방문객 개인정보)', () => {
  assert.equal(shouldLog(okOut, { dataCollection: false, chinLift: true }), false);
  assert.equal(shouldLog(okOut, undefined), false);
  assert.equal(shouldLog(okOut), false);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `modes.js` 없음, `shouldLog(okOut, off)`가 true

- [ ] **Step 3: 구현**

`app/src/modes.js`:

```js
// 운영자 모드: 메모리에만 두고 저장하지 않는다. 새로고침하면 꺼진 상태(방문객 모드)로 돌아간다.
export const DEFAULT_MODES = Object.freeze({ dataCollection: false, chinLift: false });

// 모드가 켜져 있음을 운영자가 화면에서 바로 알 수 있게 하는 작은 표시. 모두 꺼져 있으면 null
export function modeBadgeText(modes, participant) {
  const parts = [];
  if (modes.dataCollection) parts.push(`기록 중 · ${participant?.trim() || 'P?'}`);
  if (modes.chinLift) parts.push('턱 들기');
  return parts.length ? parts.join(' · ') : null;
}

// 수집 모드를 껐는데 복사하지 않은 기록이 남아 있으면 알려준다. 자동으로 지우지 않는다.
export function leftoverLogNotice(modes, count) {
  if (modes.dataCollection || count === 0) return '';
  return `기록 ${count}건이 남아 있습니다. [모두 복사] 후 [비우기] 해 주세요.`;
}
```

`app/src/measure-log.js`의 `shouldLog`:

```js
// 데이터 수집 모드가 켜져 있을 때, 성공한 측정만 기록한다.
// 실패한 측정은 조명·A4 문제라 범위 재설정 데이터에 쓸 수 없다.
export function shouldLog(out, modes) {
  return modes?.dataCollection === true && out.ok === true;
}
```

`app/index.html` — 운영자 창의 `<h3>측정 기록 …</h3>` 바로 아래(참가자 번호 앞)에 추가하고, 제목을 바꾼다:

```html
  <h3>측정 기록 (숫자만, 이 탭을 닫으면 사라져요)</h3>
  <label><input type="checkbox" id="op-mode-data" autocomplete="off"> 데이터 수집 모드 (켜야 기록돼요, 새로고침하면 꺼짐)</label>
```

그리고 `<p><span id="op-log-count">0건</span> <span id="op-log-status"></span></p>` 아래에:

```html
  <p id="op-log-left" class="notice" hidden></p>
```

`<p id="error" …>` 바로 아래(`</main>` 앞이면 그 안, 아니면 body 안)에 배지:

```html
  <div id="mode-badge" class="mode-badge" hidden></div>
```

`app/style.css` 맨 끝:

```css
.mode-badge { position: fixed; right: 12px; bottom: 12px; padding: 4px 10px; border-radius: 12px; background: rgba(0,0,0,0.55); color: #fff; font-size: 0.85rem; z-index: 5; }
```

`app/src/operator.js`:
- import 추가: `import { DEFAULT_MODES, modeBadgeText, leftoverLogNotice } from './modes.js';`
- `const log = loadLog(logStore);` 아래에 모드 상태와 표시 함수:

```js
  // 운영자 모드: 메모리에만. 새로고침 때 Chrome이 체크 상태를 되살리지 않게 시작할 때 끈다
  const modes = { ...DEFAULT_MODES };
  $('op-mode-data').checked = false;

  function renderModes() {
    const text = modeBadgeText(modes, $('op-participant').value);
    $('mode-badge').textContent = text ?? '';
    $('mode-badge').hidden = text === null;
    const left = leftoverLogNotice(modes, log.length);
    $('op-log-left').textContent = left;
    $('op-log-left').hidden = left === '';
  }
  $('op-mode-data').addEventListener('change', (e) => { modes.dataCollection = e.target.checked; renderModes(); });
  $('op-participant').addEventListener('input', renderModes);
```

- `renderLogCount()`의 본문 끝에 `renderModes();`를 넣는다. `renderModes`가 `renderLogCount`보다 먼저 정의돼 있어야 하므로, 위 블록을 `function renderLogCount` 앞에 둔다. (`renderLogCount()`는 비우기·추가 때마다 불리므로 남은 기록 안내도 같이 갱신된다.)
- 반환 객체에 추가: `modes: () => ({ ...modes }),`

`app/src/app.js`의 기록 호출:

```js
    if (shouldLog(out, operator.modes())) {
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (기존 136개 + 새 테스트)

- [ ] **Step 5: 수동 확인 (브라우저, `npm run serve` → http://localhost:8080/app/)**

1. 처음 열면 배지가 없다. Ctrl+Shift+S → 데이터 수집 모드 체크 → 배지 `기록 중 · P1`. 참가자 번호를 P3으로 바꾸면 배지가 `기록 중 · P3`.
2. 모드를 켠 채로 1회 측정 → 기록 1건. 모드를 끄면 "기록 1건이 남아 있습니다" 안내가 보인다. 끈 채로 1회 측정 → 여전히 1건.
3. 모드를 켠 채로 새로고침(F5) → 체크가 꺼져 있고 배지가 없다. 남은 기록 안내는 보인다(기록은 탭을 닫을 때까지 남음). [비우기] → 안내가 사라진다.

- [ ] **Step 6: 커밋**

```bash
git add app/src/modes.js tests/modes.test.js app/src/measure-log.js tests/measure-log.test.js app/src/operator.js app/src/app.js app/index.html app/style.css
git commit -m "feat: data collection mode gates the measurement log (off by default)"
```

---

### Task 2: 턱 들기 모드

**Files:**
- Modify: `app/src/flow.js` (`needsNeckCapture`)
- Modify: `tests/flow.test.js:42-46`
- Modify: `app/src/operator.js`
- Modify: `app/src/app.js` (`needsNeckCapture` 호출부)
- Modify: `app/index.html`

**Interfaces:**
- Consumes: Task 1의 `modes` 상태, `renderModes()`, `operator.modes()`
- Produces: `needsNeckCapture(flags, modes) → boolean`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/flow.test.js`의 42~46행 테스트를 바꾼다:

```js
test('needsNeckCapture: 턱 들기 모드가 켜져 있고 베이스 화장을 체크한 사람만 목을 따로 찍는다', () => {
  const on = { dataCollection: false, chinLift: true };
  const off = { dataCollection: true, chinLift: false };
  assert.equal(needsNeckCapture({ baseMakeup: true }, on), true);
  assert.equal(needsNeckCapture({ baseMakeup: false }, on), false);
  assert.equal(needsNeckCapture({}, on), false);
  assert.equal(needsNeckCapture({ baseMakeup: true }, off), false);
  assert.equal(needsNeckCapture({ baseMakeup: true }, undefined), false);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `needsNeckCapture({ baseMakeup: true }, off)`가 true

- [ ] **Step 3: 구현**

`app/src/flow.js`:

```js
// 운영자가 턱 들기 모드를 켰을 때, 베이스 화장을 한 사람만 턱을 든 목 사진을 한 번 더 찍는다
// (얼굴 피부는 화장 색이라 웜/쿨을 못 가림). 기본은 꺼짐: 판정에 아직 안 쓰는 값이라 방문객 대기만 늘어난다.
export function needsNeckCapture(flags, modes) {
  return modes?.chinLift === true && flags?.baseMakeup === true;
}
```

`app/index.html` — Task 1에서 넣은 데이터 수집 모드 줄 바로 아래:

```html
  <label><input type="checkbox" id="op-mode-chin" autocomplete="off"> 턱 들기 모드 (베이스 화장한 사람만 목 사진 추가, 새로고침하면 꺼짐)</label>
```

`app/src/operator.js` — `$('op-mode-data').checked = false;` 아래와 이벤트 연결 부분에:

```js
  $('op-mode-chin').checked = false;
  $('op-mode-chin').addEventListener('change', (e) => { modes.chinLift = e.target.checked; renderModes(); });
```

`app/src/app.js`:

```js
    if (needsNeckCapture(flags, operator.modes()) && frames.length * 2 >= t.framesPerCapture) {
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 수동 확인**

1. 모드 꺼짐 + "베이스 화장했어요" 체크 → 측정 후 턱 들기 화면 없이 바로 결과.
2. 턱 들기 모드만 켬 → 배지 `턱 들기`. 베이스 화장 체크 → 턱 들기 화면이 나온다. 체크 안 함 → 안 나온다.
3. 새로고침 → 체크 꺼짐.

- [ ] **Step 6: 커밋**

```bash
git add app/src/flow.js tests/flow.test.js app/src/operator.js app/src/app.js app/index.html
git commit -m "feat: chin-lift neck capture only in operator chin-lift mode (off by default)"
```

---

### Task 3: 웹캠별 설정 저장

**Files:**
- Modify: `app/src/settings.js`
- Modify: `tests/settings.test.js:16-25`
- Modify: `app/src/camera.js` (`streamDeviceId` 추가)
- Modify: `app/src/app.js` (`startCamera`, 기록 호출부의 `camera`)
- Modify: `app/src/operator.js` (초기화 버튼)

**Interfaces:**
- Produces: `DEFAULT_SETTINGS.cameras = {}` (`camera` 필드는 없어짐), `LEGACY_CAMERA = '*legacy'`, `cameraValuesFor(settings, deviceId) → object | null`, `withCameraValues(settings, deviceId, values | null) → settings`, `streamDeviceId(stream) → string`, `setupOperator({ …, onCameraReset })`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/settings.test.js` import 줄을 바꾼다:

```js
import { DEFAULT_SETTINGS, LEGACY_CAMERA, loadSettings, saveSettings, cameraValuesFor, withCameraValues, rectFromDrag, displayRectToRaw } from '../app/src/settings.js';
```

16~25행의 두 테스트(`saveSettings → loadSettings 왕복`, `웹캠 설정값(camera)은 처음엔 비어 있다`)를 아래로 바꾸고, 새 테스트를 더한다:

```js
const camA = { saturation: 100, colorTemperature: 5000, exposureTime: 300 };
const camB = { saturation: 64, colorTemperature: 4600, exposureTime: 156 };

test('saveSettings → loadSettings 왕복, 막히면 false', () => {
  const s = memory();
  const v = { deviceId: 'cam1', cardRect: { x: 0.1, y: 0.2, w: 0.1, h: 0.2 }, cardType: 'gray18', cameras: { cam1: camA }, envNote: '반사판' };
  assert.equal(saveSettings(s, v), true);
  assert.deepEqual(loadSettings(s), v);
  assert.equal(saveSettings(broken, v), false);
});

test('웹캠 설정값은 처음엔 비어 있다 (각 웹캠의 기본값으로 고정 후 저장)', () => {
  assert.deepEqual(DEFAULT_SETTINGS.cameras, {});
  assert.equal('camera' in DEFAULT_SETTINGS, false);
});

test('loadSettings: 옛 형식(camera 하나)은 LEGACY_CAMERA로 옮긴다 (부스 PC에 맞춰 둔 값 보존)', () => {
  const s = memory();
  s.setItem('pc-booth-settings', JSON.stringify({ deviceId: null, camera: camA, cardType: 'white' }));
  const loaded = loadSettings(s);
  assert.equal('camera' in loaded, false);
  assert.deepEqual(loaded.cameras, { [LEGACY_CAMERA]: camA });
});

test('loadSettings: 옛 형식 camera가 null이면 옮길 것이 없다', () => {
  const s = memory();
  s.setItem('pc-booth-settings', JSON.stringify({ camera: null }));
  assert.deepEqual(loadSettings(s).cameras, {});
});

test('loadSettings: 불러온 값을 고쳐도 DEFAULT_SETTINGS는 그대로', () => {
  const loaded = loadSettings(memory());
  loaded.cameras.x = camA;
  assert.deepEqual(DEFAULT_SETTINGS.cameras, {});
});

test('cameraValuesFor: 그 웹캠의 값, 없으면 옛 형식 값, 둘 다 없으면 null', () => {
  const base = { ...DEFAULT_SETTINGS, cameras: { a: camA } };
  assert.deepEqual(cameraValuesFor(base, 'a'), camA);
  assert.equal(cameraValuesFor(base, 'b'), null);
  assert.deepEqual(cameraValuesFor({ ...DEFAULT_SETTINGS, cameras: { [LEGACY_CAMERA]: camB } }, 'b'), camB);
  assert.equal(cameraValuesFor({ ...DEFAULT_SETTINGS, cameras: undefined }, 'a'), null);
});

test('withCameraValues: 웹캠별로 따로 저장하고, 다른 웹캠 값은 건드리지 않는다', () => {
  const s1 = withCameraValues({ ...DEFAULT_SETTINGS, cameras: { a: camA } }, 'b', camB);
  assert.deepEqual(s1.cameras, { a: camA, b: camB });
  assert.deepEqual(cameraValuesFor(s1, 'a'), camA);
});

test('withCameraValues: 저장하면 옛 형식 값은 한 번만 넘겨받고 지운다', () => {
  const s = withCameraValues({ ...DEFAULT_SETTINGS, cameras: { [LEGACY_CAMERA]: camA } }, 'a', camA);
  assert.deepEqual(s.cameras, { a: camA });
  assert.equal(cameraValuesFor(s, 'b'), null);
});

test('withCameraValues: null이면 그 웹캠 값만 지운다 (초기화), 원래 객체는 그대로', () => {
  const before = { ...DEFAULT_SETTINGS, cameras: { a: camA, b: camB } };
  const after = withCameraValues(before, 'a', null);
  assert.deepEqual(after.cameras, { b: camB });
  assert.deepEqual(before.cameras, { a: camA, b: camB });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `LEGACY_CAMERA`, `cameraValuesFor`, `withCameraValues` 없음

- [ ] **Step 3: 구현**

`app/src/settings.js`:

```js
// 운영자 설정만 저장한다 (사진·측정값은 저장하지 않음)
const KEY = 'pc-booth-settings';
// cameras: 웹캠 deviceId별 채도·색온도·노출 값. 저장값이 없는 웹캠은 켤 때의 자기 기본값으로 고정한다
export const DEFAULT_SETTINGS = Object.freeze({ deviceId: null, cardRect: null, cardType: 'white', cameras: Object.freeze({}), envNote: '' });
// 옛 형식(웹캠 구분 없는 camera 하나)을 잠시 담아 두는 자리. 처음 열리는 웹캠이 넘겨받는다
export const LEGACY_CAMERA = '*legacy';
```

`loadSettings`를 바꾼다:

```js
export function loadSettings(storage) {
  try {
    const { camera, ...saved } = JSON.parse(storage.getItem(KEY) ?? '{}');
    const cameras = { ...(saved.cameras ?? {}) };
    if (camera && typeof camera === 'object' && Object.keys(cameras).length === 0) cameras[LEGACY_CAMERA] = camera;
    return { ...DEFAULT_SETTINGS, ...saved, cameras };
  } catch {
    return { ...DEFAULT_SETTINGS, cameras: {} };
  }
}
```

`saveSettings` 아래에 추가:

```js
// 실제로 열린 웹캠의 저장값. 없으면 옛 형식 값, 그것도 없으면 null(웹캠 기본값으로 고정)
export function cameraValuesFor(settings, deviceId) {
  return settings.cameras?.[deviceId] ?? settings.cameras?.[LEGACY_CAMERA] ?? null;
}

// 그 웹캠의 값을 바꾼 새 설정. values가 null이면 지운다. 옛 형식 값은 여기서 정리한다
export function withCameraValues(settings, deviceId, values) {
  const { [LEGACY_CAMERA]: _legacy, ...cameras } = settings.cameras ?? {};
  if (values) cameras[deviceId] = values;
  else delete cameras[deviceId];
  return { ...settings, cameras };
}
```

(`DEFAULT_SETTINGS`를 freeze했으므로 `{ ...DEFAULT_SETTINGS }` 복사본을 쓰는 기존 코드는 그대로 동작한다. 기존 `loadSettings` 첫 테스트의 `deepEqual(…, DEFAULT_SETTINGS)`는 `cameras: {}`끼리 비교라 통과한다.)

`app/src/camera.js`의 `stopCamera` 아래에 추가:

```js
// 실제로 열린 웹캠의 id (저장해 둔 웹캠이 빠져 기본 웹캠으로 열렸을 수도 있으므로 요청한 id가 아니라 이것을 쓴다)
export function streamDeviceId(stream) {
  const s = stream.getVideoTracks()[0]?.getSettings?.() ?? {};
  return s.deviceId || 'unknown';
}
```

`app/src/app.js`:
- import 수정: `import { openCamera, stopCamera, applyCameraSettings, grabFrame, streamDeviceId } from './camera.js';`, `import { browserStorage, loadSettings, saveSettings, displayRectToRaw, cameraValuesFor, withCameraValues } from './settings.js';`
- `state`에 `cameraId: null` 추가.
- `setupOperator` 호출에 추가:

```js
  // [웹캠 설정 초기화]: 지금 웹캠의 값만 지우고, 새로고침 후 그 웹캠 기본값으로 다시 고정한다
  onCameraReset: () => {
    if (state.cameraId) updateSettings(withCameraValues(state.settings, state.cameraId, null));
    location.reload();
  },
```

- `startCamera`의 `setTimeout` 부분을 바꾼다:

```js
  // 화면 밝기가 자리잡은 뒤(2초) 이 웹캠의 저장값을 적용한다. 처음 쓰는 웹캠이면 지금 값(웹캠 기본값)으로 고정하고 저장한다.
  // 2초 안에 웹캠을 또 바꾸면 이전 웹캠의 타이머는 아무것도 하지 않는다.
  const stream = state.stream;
  const id = streamDeviceId(stream);
  state.cameraId = id;
  setTimeout(async () => {
    if (state.stream !== stream) return;
    const saved = cameraValuesFor(state.settings, id);
    const report = await applyCameraSettings(stream, saved);
    if (state.stream !== stream) return;
    updateSettings(withCameraValues(state.settings, id, saved ?? report.values));
    operator.setCaps(report);
    operator.setControls(report.controls, async (key, value) => {
      updateSettings(withCameraValues(state.settings, id, { ...cameraValuesFor(state.settings, id), [key]: value }));
      operator.setCaps(await applyCameraSettings(stream, cameraValuesFor(state.settings, id)));
    });
  }, 2000);
```

- 기록 호출부의 `camera: state.settings.camera`를 `camera: cameraValuesFor(state.settings, state.cameraId)`로 바꾼다.

`app/src/operator.js`:
- `setupOperator({ overlay, getSettings, setSettings, onCameraChange, onCameraReset })`
- 초기화 버튼 핸들러를 바꾼다:

```js
  // 지금 웹캠의 설정값만 지우고, 새로고침 후 그 웹캠 기본값으로 다시 고정한다
  $('op-camera-reset').addEventListener('click', onCameraReset);
```

`app/index.html`의 버튼 문구: `<button id="op-camera-reset">이 웹캠 설정 초기화 (웹캠 기본값으로 다시 고정)</button>`, 제목 `<h3>웹캠 설정 (웹캠마다 따로 저장되고, 켤 때마다 다시 적용)</h3>`.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS. `grep -rn "settings.camera\b\|camera: null" app/src`에 남은 옛 형식 사용이 없어야 한다.

- [ ] **Step 5: 수동 확인**

1. 개발 PC: 배포 전 브라우저 저장값 그대로 열기 → 운영자 창의 노출 값이 전과 같다(옛 값 넘겨받음). 개발자 도구 Application → Local Storage → `pc-booth-settings`의 `cameras`에 실제 웹캠 id 하나만 있고 `camera`·`*legacy`는 없다.
2. 웹캠이 2대 이상이면: B로 바꾸면 B의 기본값으로 고정되고 A 값은 남아 있다. 다시 A로 바꾸면 A 값이 돌아온다. 1대뿐이면 이 항목은 건너뛰고 기록에 "1대라 미확인"이라 적는다.
3. 노출 값을 바꾼 뒤 [이 웹캠 설정 초기화] → 새로고침 후 웹캠 기본값으로 고정된다.

- [ ] **Step 6: 커밋**

```bash
git add app/src/settings.js tests/settings.test.js app/src/camera.js app/src/app.js app/src/operator.js app/index.html
git commit -m "feat: save webcam settings per device, migrate legacy value, ignore stale camera timer"
```

---

### Task 4: 위키 정리

**Files:**
- Modify: `wiki/measurement/regions.md` (목 — 턱 든 사진 행)
- Modify: `wiki/measurement/webcam-limits.md` (웹캠별 저장)
- Modify: `wiki/decisions/phase3-backlog.md` (리뷰에서 미룬 항목)
- Modify: `wiki/decisions/decisions.md` (2026-10-15 결정)
- Modify: `wiki/decisions/status-2026-10-13.md` (병합 예정 표시)
- Modify: `wiki/log.md`

- [ ] **Step 1: regions.md 숫자 불일치 수정**

"목 — 턱 든 사진" 행의 위치 찾기 칸을 실제 코드대로 바꾼다:

> 운영자가 **턱 들기 모드**를 켰고 베이스 화장 체크 시에만: 얼굴 촬영 직후 "턱을 살짝 들어 주세요" → 얼굴 촬영 때보다 `neckLiftMinDeg`(12°) 이상 든 상태가 1초 유지되면 10장 더 촬영 → 같은 방식으로 목 영역 측정 (`liftedNeck`). `neckTimeoutSeconds`(10초) 안에 못 들면 건너뛰고 경고 `neck_not_lifted`

"제외 조건" 아래 목록 근처에 한 줄: "턱 들기 모드는 기본 꺼짐(2026-10-15). 판정에 아직 안 쓰는 값이라 방문객 대기를 늘리지 않기 위함."

- [ ] **Step 2: webcam-limits.md**

웹캠 설정 저장을 설명하는 부분에: "웹캠별로 따로 저장한다(`cameras[deviceId]`). 처음 쓰는 웹캠은 켤 때의 자동 값으로 고정하고 저장한다. 옛 형식 값 하나는 처음 열리는 웹캠이 넘겨받는다(2026-10-15)."

- [ ] **Step 3: phase3-backlog.md**

"이번에 하지 않는 것" 4개 항목을 출처 "2026-10-15 브랜치 리뷰"로 추가한다.

- [ ] **Step 4: decisions.md, status 문서, log.md**

- decisions.md: "이번 계획에서 정한 것" 1~7을 요약해 2026-10-15 날짜로 추가.
- status-2026-10-13.md "다음 할 일" 8번 옆에 "→ 2026-10-15 `docs/plans/2026-10-15-phase3a-release.md`로 진행" 표시.
- log.md에 한 줄: `| 2026-10-15 | measurement/regions.md, measurement/webcam-limits.md, decisions/* | 운영자 모드(데이터 수집·턱 들기, 기본 꺼짐), 웹캠별 설정, 리뷰 미룬 항목 |`

- [ ] **Step 5: 점검과 커밋**

Run: `npm run check`
Expected: 테스트·위키 링크·데이터 형식 모두 통과

```bash
git add wiki/
git commit -m "docs: operator modes, per-webcam settings, deferred review items"
```

---

### Task 5: 수동 점검, 병합, 배포

**Files:** 없음 (git 작업과 브라우저 확인)

- [ ] **Step 1: 설치 전 수동 점검** (로컬 `npm run serve`, 모드는 모두 꺼진 상태)

1. 1회 측정 → 결과 화면 QR을 **안드로이드 폰**으로 스캔 → 결과 페이지가 열린다
2. 결과 화면에서 [처음으로] → 두 번째 사람(또는 같은 사람 다시) 측정 → 이전 선택(성별·체크)이 남아 있지 않다
3. 결과 화면을 그대로 두고 60초 → 대기 화면으로 돌아간다
4. 모드를 모두 끈 채로 2회 측정 → 운영자 창 기록이 0건 그대로

결과를 사용자에게 보고한다. 하나라도 실패하면 멈추고 원인부터 찾는다(superpowers:systematic-debugging).

- [ ] **Step 2: 전체 브랜치 리뷰**

`master...phase3a-camera` 차이를 리뷰한다(superpowers:requesting-code-review). 지적된 것은 이 계획 범위면 고치고, 아니면 backlog에 기록한다.

- [ ] **Step 3: 병합 (사용자 확인 후)**

```bash
git checkout master
git pull --ff-only
git merge --no-ff phase3a-camera -m "Merge phase3a-camera: webcam lock, measurement log, neck capture, operator modes"
npm run check
```

Expected: 모두 통과

- [ ] **Step 4: 배포 (사용자 확인 후)**

```bash
git push origin master
```

1~2분 뒤 https://tmdry1999-lgtm.github.io/personal-color/app/ 에서:
- 강력 새로고침(Ctrl+Shift+R) 후 운영자 창에 "데이터 수집 모드", "턱 들기 모드" 체크박스가 보인다
- 1회 측정 → 결과·QR 정상, 배지 없음, 기록 0건
- **부스 PC라면** 노출 값이 배포 전과 같다 (Review Focus 3)

- [ ] **Step 5: 기록**

`wiki/log.md`에 `| 2026-10-15 | (배포) | phase3a-camera master 병합, Pages 배포 |` 한 줄, 메모리(프로젝트 진행 상황) 갱신.

```bash
git add wiki/log.md
git commit -m "docs: record phase3a release"
git push origin master
```
