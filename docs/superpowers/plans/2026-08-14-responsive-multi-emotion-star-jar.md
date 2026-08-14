# Responsive Multi-Emotion Star Jar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the current anger-oriented star jar into a multi-emotion journal and make the same interface reliable on mobile, tablet, and desktop browsers.

**Architecture:** Keep the existing static ES-module application and localStorage persistence. Add a small emotion catalog as the single source of truth, extend store normalization for backward-compatible emotion data, update the existing views to render emotion-aware copy and filters, and replace desktop-minimum CSS with mobile-first responsive layout rules.

**Tech Stack:** HTML5, CSS custom properties and media queries, browser ES modules, localStorage, Node.js built-in test runner, GitHub Pages.

## Global Constraints

- Continue using GitHub Pages; do not add accounts, cloud synchronization, a database, or an administration page.
- Preserve the current `emotion-star-jar:v1` localStorage key and the internal `pending` / `resolved` statuses.
- Normalize legacy records without an emotion field to `angry` and do not delete or rewrite their content.
- Offer `happy`, `calm`, `sad`, `anxious`, `wronged`, `angry`, and `other`; `other` requires a custom emotion name.
- Use one DOM structure for all viewport sizes; do not create separate mobile and desktop pages.
- Support a minimum viewport width of 320px without horizontal scrolling.
- Keep primary controls at least 44px tall and text inputs at least 16px on mobile.
- Respect `prefers-reduced-motion`.
- Validate at 320×568, 360×800, 390×844, 768×1024, 1024×768, 1366×768, and 1920×1080.

---

## File Structure

- Create `js/emotion-catalog.js`: preset emotion IDs, labels, colors, lookup, and display-name helpers.
- Modify `js/star-store.js`: emotion normalization, legacy compatibility, custom-emotion validation, and emotion filtering.
- Modify `js/app.js`: emotion form behavior, draft creation, open-star rendering, and archive filtering.
- Modify `index.html`: inclusive copy, emotion controls, custom emotion field, emotion display, and filter labels.
- Modify `styles.css`: emotion color tokens plus mobile-first phone/tablet/desktop layout.
- Modify `tests/star-store.test.js`: legacy normalization, new emotion persistence, validation, and emotion filtering.
- Create `tests/emotion-catalog.test.js`: catalog completeness and display-name behavior.
- Create `tests/ui-contract.test.js`: static copy and responsive-contract regression checks.

### Task 1: Emotion catalog and backward-compatible data model

**Files:**
- Create: `js/emotion-catalog.js`
- Create: `tests/emotion-catalog.test.js`
- Modify: `js/star-store.js`
- Modify: `tests/star-store.test.js`

**Interfaces:**
- Produces: `EMOTIONS: ReadonlyArray<{id: string, label: string, color: string}>`
- Produces: `getEmotion(id: string): {id: string, label: string, color: string}` with `angry` fallback.
- Produces: `getEmotionLabel(star: object): string`, returning `customEmotion` for `other`.
- Produces: normalized star fields `emotion`, `customEmotion`, and `color`.
- Changes: `filterResolved(stars, emotion = 'all')` filters by emotion ID rather than color.

- [ ] **Step 1: Write failing catalog tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { EMOTIONS, getEmotion, getEmotionLabel } from '../js/emotion-catalog.js';

test('catalog exposes the seven approved emotions', () => {
  assert.deepEqual(EMOTIONS.map(({ id }) => id), ['happy', 'calm', 'sad', 'anxious', 'wronged', 'angry', 'other']);
});

test('custom emotion labels override the generic other label', () => {
  assert.equal(getEmotionLabel({ emotion: 'other', customEmotion: '期待' }), '期待');
  assert.equal(getEmotion('missing').id, 'angry');
});
```

- [ ] **Step 2: Extend store tests for migration, persistence, and filtering**

```js
test('legacy records become angry without losing their original color', () => {
  const store = createStarStore(memoryStorage([{ id: 'legacy', reason: '旧记录', color: 'blue', status: 'pending' }]));
  assert.equal(store.list()[0].emotion, 'angry');
  assert.equal(store.list()[0].color, 'blue');
});

test('persists a selected emotion and requires a custom other label', () => {
  const store = createStarStore(memoryStorage(), () => 0);
  assert.throws(() => store.add({ reason: '说不清', emotion: 'other' }), /情绪名称/);
  const star = store.add({ reason: '新的体验', emotion: 'happy', intensity: 75 });
  assert.equal(star.emotion, 'happy');
  assert.equal(star.color, 'yellow');
});

test('filters growth records by emotion', () => {
  const rows = [
    { status: 'resolved', emotion: 'happy' },
    { status: 'resolved', emotion: 'sad' },
    { status: 'pending', emotion: 'happy' }
  ];
  assert.equal(filterResolved(rows, 'happy').length, 1);
});
```

- [ ] **Step 3: Run focused tests and verify RED**

Run: `node --test tests/emotion-catalog.test.js tests/star-store.test.js`

Expected: FAIL because `emotion-catalog.js` does not exist and store records do not expose `emotion`.

- [ ] **Step 4: Implement the catalog**

```js
export const EMOTIONS = Object.freeze([
  { id: 'happy', label: '开心', color: 'yellow' },
  { id: 'calm', label: '平静', color: 'mint' },
  { id: 'sad', label: '难过', color: 'blue' },
  { id: 'anxious', label: '焦虑', color: 'purple' },
  { id: 'wronged', label: '委屈', color: 'pink' },
  { id: 'angry', label: '生气', color: 'coral' },
  { id: 'other', label: '其他', color: 'lavender' }
]);

const emotionMap = new Map(EMOTIONS.map((emotion) => [emotion.id, emotion]));

export const getEmotion = (id) => emotionMap.get(id) || emotionMap.get('angry');
export const getEmotionLabel = (star = {}) => star.emotion === 'other' && String(star.customEmotion || '').trim()
  ? String(star.customEmotion).trim()
  : getEmotion(star.emotion).label;
```

- [ ] **Step 5: Update star normalization and validation**

Import `getEmotion`, set missing legacy emotion to `angry`, preserve valid legacy colors, derive new-record colors from the selected catalog item, require `customEmotion` when `emotion === 'other'`, and change validation copy from “生气原因/解决方法” to “发生的事情/回应内容”. Keep the storage key and status strings unchanged.

- [ ] **Step 6: Run all unit tests and verify GREEN**

Run: `npm test`

Expected: all existing and new tests pass with zero failures.

- [ ] **Step 7: Commit the data-model task**

```powershell
git add -- js/emotion-catalog.js js/star-store.js tests/emotion-catalog.test.js tests/star-store.test.js
git commit -m "feat: support multiple emotion records"
```

### Task 2: Inclusive multi-emotion interface and interactions

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Create: `tests/ui-contract.test.js`

**Interfaces:**
- Consumes: `EMOTIONS`, `getEmotion`, and `getEmotionLabel` from `js/emotion-catalog.js`.
- Produces DOM IDs: `custom-emotion-field`, `custom-emotion`, and `open-star-emotion`.
- Archive filter values use emotion IDs from `EMOTIONS` plus `all`.

- [ ] **Step 1: Write failing UI contract tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('writing view uses inclusive emotion language and approved controls', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /发生了什么？/);
  assert.match(html, /我想怎样回应这份情绪？/);
  for (const emotion of ['happy', 'calm', 'sad', 'anxious', 'wronged', 'angry', 'other']) {
    assert.match(html, new RegExp(`value="${emotion}"`));
  }
  assert.doesNotMatch(html, /为什么生气？|我已经解决了|待解决星星/);
});
```

- [ ] **Step 2: Run the UI contract test and verify RED**

Run: `node --test tests/ui-contract.test.js`

Expected: FAIL on the old anger-specific copy and missing emotion IDs.

- [ ] **Step 3: Update HTML copy and emotion controls**

Replace the five color-only radios with seven emotion radios whose values are the emotion IDs. Add a hidden `#custom-emotion-field` containing `#custom-emotion` with `maxlength="16"`. Add `#open-star-emotion` near the opened-star heading. Replace all “待解决/已解决/生气原因” user-facing text with the approved “待回应/成长记录/发生了什么/回应情绪” copy from the specification.

- [ ] **Step 4: Update application interaction logic**

In `js/app.js`:

```js
import { getEmotion, getEmotionLabel } from './emotion-catalog.js';

const customEmotionField = document.querySelector('#custom-emotion-field');
const customEmotionInput = document.querySelector('#custom-emotion');
const openStarEmotion = document.querySelector('#open-star-emotion');
```

Listen for emotion radio changes, show the custom field only for `other`, construct drafts with `emotion` and `customEmotion`, render `getEmotionLabel(openedStar)`, set color classes from the normalized star, filter archives by emotion, and update toast/error text to the approved inclusive language.

- [ ] **Step 5: Run all tests and verify GREEN**

Run: `npm test`

Expected: catalog, store, existing interaction-unit, and UI contract tests all pass.

- [ ] **Step 6: Commit the interface task**

```powershell
git add -- index.html js/app.js tests/ui-contract.test.js
git commit -m "feat: broaden star jar to all emotions"
```

### Task 3: Mobile-first responsive layout

**Files:**
- Modify: `styles.css`
- Modify: `tests/ui-contract.test.js`

**Interfaces:**
- Consumes the existing semantic view classes and the Task 2 emotion controls.
- Produces breakpoints at `768px` and `1100px`, with base rules supporting 320–767px.

- [ ] **Step 1: Add failing responsive contract tests**

```js
test('styles are mobile-first and include tablet and desktop breakpoints', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /html\s*\{[^}]*min-width\s*:/s);
  assert.match(css, /@media\s*\(min-width:\s*768px\)/);
  assert.match(css, /@media\s*\(min-width:\s*1100px\)/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /font-size:\s*16px/);
});
```

- [ ] **Step 2: Run the responsive test and verify RED**

Run: `node --test tests/ui-contract.test.js`

Expected: FAIL because the current stylesheet enforces `html { min-width: 1040px; }` and uses only a desktop-down breakpoint.

- [ ] **Step 3: Replace desktop-minimum base layout with phone rules**

Set `html { min-width: 0; }`, `body { overflow-x: hidden; }`, `.view { width: min(100% - 24px, 1180px); padding-block: 16px 28px; }`, stack headers and action groups, make cards `width: 100%`, collapse `.open-layout` and `.archive-grid` to one column, scale the bottle with `width: min(100%, 430px)`, and use `padding-bottom: max(24px, env(safe-area-inset-bottom))`. Ensure controls are at least 44px high and text inputs use `font-size: 16px`.

- [ ] **Step 4: Add emotion color and accessibility rules**

Add `--coral` and `--lavender`, corresponding swatches and star-image filters, visible selected-state text styling, focus-visible coverage for radio labels, and custom emotion field spacing. Keep textual emotion labels visible at all widths.

- [ ] **Step 5: Add tablet and desktop enhancement breakpoints**

At `min-width: 768px`, use two-column archive and open layouts where space permits and restore horizontal subheaders. At `min-width: 1100px`, restore the centered desktop bottle stage, three-column archive, and current multi-column open layout. Avoid fixed heights that clip content.

- [ ] **Step 6: Retain reduced-motion behavior**

Keep the existing `prefers-reduced-motion: reduce` block and verify all new transitions/animations are covered by its global animation and transition disable rules.

- [ ] **Step 7: Run all tests and verify GREEN**

Run: `npm test`

Expected: all tests pass, including the responsive contract.

- [ ] **Step 8: Commit the responsive task**

```powershell
git add -- styles.css tests/ui-contract.test.js
git commit -m "style: make star jar responsive across browsers"
```

### Task 4: Cross-viewport functional and visual verification

**Files:**
- Modify: `design-qa.md`
- Do not commit: generated screenshots under `qa/` unless explicitly requested.

**Interfaces:**
- Consumes the completed static app at the existing local QA server.
- Produces a verification record in `design-qa.md` with viewport, route/view, and outcome.

- [ ] **Step 1: Run the complete automated test suite**

Run: `npm test`

Expected: zero failed, cancelled, skipped, or todo tests.

- [ ] **Step 2: Serve the exact worktree build**

Run the existing `qa-server.cjs` from this worktree on port 8771 and verify `http://localhost:8771/index.html` returns HTTP 200. Reuse the running server when already active.

- [ ] **Step 3: Verify all required viewports**

For each of 320×568, 360×800, 390×844, 768×1024, 1024×768, 1366×768, and 1920×1080, inspect home, write, open, and archive views. Confirm no horizontal overflow, no overlap, no clipped primary action, readable labels, and correct one/two/three-column behavior.

- [ ] **Step 4: Verify the multi-emotion flow**

Create one preset emotion and one custom emotion, refresh, open a pending star, return it, reopen and save a response, then filter it in growth records. Confirm the legacy localStorage fixture renders as “生气”.

- [ ] **Step 5: Record QA evidence**

Append a dated responsive/multi-emotion section to `design-qa.md` listing the tested viewports, test count, interaction flow, and any known limitations. Do not claim Safari/Firefox engine verification unless those engines were actually run.

- [ ] **Step 6: Commit QA documentation**

```powershell
git add -- design-qa.md
git commit -m "docs: verify responsive emotion experience"
```

### Task 5: Publish and verify GitHub Pages

**Files:**
- No new source files unless deployment verification reveals a defect.

**Interfaces:**
- Consumes branch `codex/desktop-multi-view` and repository `Ray-Jiang747/emotion-star-jar`.
- Produces the live page at `https://ray-jiang747.github.io/emotion-star-jar/`.

- [ ] **Step 1: Confirm publish scope**

Run: `git status -sb` and `git log --oneline origin/codex/desktop-multi-view..HEAD`

Expected: only known QA temporary files remain untracked; the source commits are ready to push.

- [ ] **Step 2: Push the verified branch**

Run: `git push origin codex/desktop-multi-view`

Expected: the remote branch advances to the local HEAD.

- [ ] **Step 3: Trigger and monitor Pages build**

Use GitHub CLI to confirm Pages source is `codex/desktop-multi-view:/`, request a Pages build when the push does not automatically queue one, and poll the latest build until its status is `built`.

- [ ] **Step 4: Verify live bytes and behavior**

Fetch the live page with a cache-busting query, confirm HTTP 200 and that it contains `发生了什么？`, `成长记录`, and all seven emotion IDs. Perform one mobile-width interaction smoke test against the live URL.

- [ ] **Step 5: Report deployment**

Return the GitHub Pages link, pushed commit, automated-test result, verified viewports, and any browser engines not directly exercised.
