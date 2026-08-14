# Desktop Multi-View Emotion Star Jar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the current crowded page as a desktop, four-view emotion star jar with a dynamic bottle, write-and-fold flow, random open/return/resolve flow, and resolved archive.

**Architecture:** Replace the monolithic inline page with a small static ES-module application. `js/star-store.js` owns normalized persistence and state transitions; `js/app.js` owns view routing, rendering, and animations; `styles.css` owns the desktop visual system; `index.html` contains only semantic view shells. Browser state remains in the existing `emotion-star-jar:v1` local-storage key for backward compatibility.

**Tech Stack:** HTML5, CSS, browser ES modules, Local Storage, Web Animations/CSS animations, Node.js built-in test runner, Python static server for browser verification.

## Global Constraints

- Build only the desktop website; remove mobile-app and installation/PWA scope.
- The four views are home, write star, random open/resolve, and resolved archive.
- Home contains the bottle and navigation only; it must not contain the creation form, solution form, or archive list.
- Random open selects only pending stars; returning keeps data unchanged; resolving requires a non-empty solution.
- Preserve the exact fields `id`, `title`, `reason`, `intensity`, `color`, `createdAt`, `status`, `solution`, and `resolvedAt`.
- Persist records locally and restore them after reload.
- Respect `prefers-reduced-motion` and keep keyboard focus visible.
- Use the supplied reference for material, palette, and atmosphere, while following the approved multi-view structure.

---

### Task 1: State Model and Persistence

**Files:**
- Create: `package.json`
- Create: `js/star-store.js`
- Create: `tests/star-store.test.js`

**Interfaces:**
- Produces: `createStarStore(storage, randomFn)` returning `{ list, pending, resolved, add, pickRandomPending, resolve, save }`.
- Produces: `normalizeStar(raw)` and `filterResolved(stars, color)` for later UI rendering.

- [ ] **Step 1: Write failing model tests**

Create `tests/star-store.test.js` with tests that assert normalization, add/persist, pending-only random selection, non-mutating return behavior, non-empty solution validation, resolution timestamps, and color filtering:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStarStore, filterResolved } from '../js/star-store.js';

const memoryStorage = (seed = []) => {
  let raw = JSON.stringify(seed);
  return {
    getItem: () => raw,
    setItem: (_key, value) => { raw = value; },
    read: () => JSON.parse(raw)
  };
};

test('adds and persists a normalized pending star', () => {
  const storage = memoryStorage();
  const store = createStarStore(storage, () => 0);
  const star = store.add({ title: '误会', reason: '没有被理解', intensity: 70, color: 'pink' });
  assert.equal(star.status, 'pending');
  assert.equal(store.pending().length, 1);
  assert.equal(storage.read()[0].reason, '没有被理解');
});

test('random selection never returns a resolved star', () => {
  const storage = memoryStorage([
    { id: 'done', reason: '旧问题', status: 'resolved', solution: '沟通', resolvedAt: '2026-08-14T10:00:00.000Z' },
    { id: 'open', reason: '新问题', status: 'pending' }
  ]);
  const store = createStarStore(storage, () => 0);
  assert.equal(store.pickRandomPending().id, 'open');
});

test('resolve requires a solution and moves the star to resolved', () => {
  const storage = memoryStorage([{ id: 'open', reason: '新问题', status: 'pending' }]);
  const store = createStarStore(storage, () => 0);
  assert.throws(() => store.resolve('open', '   '), /解决方法/);
  const done = store.resolve('open', '认真沟通');
  assert.equal(done.status, 'resolved');
  assert.equal(done.solution, '认真沟通');
  assert.ok(done.resolvedAt);
  assert.equal(store.pending().length, 0);
});

test('filters resolved records by color', () => {
  const rows = [
    { status: 'resolved', color: 'pink' },
    { status: 'resolved', color: 'blue' },
    { status: 'pending', color: 'pink' }
  ];
  assert.equal(filterResolved(rows, 'pink').length, 1);
  assert.equal(filterResolved(rows, 'all').length, 2);
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --test tests/star-store.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/star-store.js`.

- [ ] **Step 3: Implement the state model**

Create `package.json` with `"type": "module"` and `"test": "node --test tests/*.test.js"`. Implement `js/star-store.js` so it:

- reads and normalizes the existing `emotion-star-jar:v1` array;
- generates stable IDs and ISO timestamps;
- trims title, reason, and solution;
- restricts colors to `pink`, `yellow`, `blue`, `purple`, and `mint`;
- persists after `add` and `resolve`;
- selects random pending entries without changing state;
- sorts resolved entries newest first.

- [ ] **Step 4: Run model tests**

Run: `npm test`

Expected: all four tests PASS.

- [ ] **Step 5: Commit the model**

```powershell
git add package.json js/star-store.js tests/star-store.test.js
git commit -m "feat: add emotion star state model"
```

---

### Task 2: Desktop App Shell and Dynamic Home Bottle

**Files:**
- Replace: `index.html`
- Create: `styles.css`
- Create: `js/app.js`
- Reuse: `assets/hero-star-jar.png`
- Reuse: `assets/kitty-head.png`
- Reuse: `assets/kitty-companion.png`

**Interfaces:**
- Consumes: `createStarStore()` from Task 1.
- Produces: `createViewState(initialView)`, `navigate(viewName)`, `renderHome()`, and semantic view elements with IDs `view-home`, `view-write`, `view-open`, and `view-archive`.

- [ ] **Step 1: Add a failing view-state behavior test**

Create `tests/view-state.test.js` to verify that only declared views can become active and subscribers receive the new view:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createViewState } from '../js/view-state.js';

test('navigation publishes one valid active view', () => {
  const router = createViewState('home');
  const visited = [];
  router.subscribe((view) => visited.push(view));
  assert.equal(router.navigate('write'), 'write');
  assert.equal(router.current(), 'write');
  assert.deepEqual(visited, ['write']);
  assert.throws(() => router.navigate('missing'), /未知界面/);
  assert.equal(router.current(), 'write');
});
```

- [ ] **Step 2: Run the shell contract test and verify failure**

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/view-state.js`.

- [ ] **Step 3: Build semantic multi-view markup**

Create `js/view-state.js` with a four-value view whitelist and subscriber notification, then replace `index.html` with a document containing:

- a shared starfield background;
- four sibling `<section class="view">` elements;
- home header, dynamic bottle stage, pending count, and three navigation controls;
- write form and fold stage;
- random-open paper detail, return control, solution form, and resolve control;
- archive filters and expandable record grid;
- one global live region;
- `<script type="module" src="./js/app.js"></script>`.

Remove manifest, service-worker registration, install buttons, mobile fixed CTA, and the old inline application script.

- [ ] **Step 4: Build the desktop visual system and home renderer**

Implement `styles.css` for a 1180 px desktop canvas with:

- deep navy starfield and cloud glow;
- a centered 560–620 px bottle stage;
- layered real star buttons positioned in the lower bottle area, colored from store data;
- title and cat companion at top left;
- archive button at top right;
- two large home action buttons below the bottle;
- view transition classes `.is-active`, `.is-entering`, and `.is-leaving`;
- focus-visible and reduced-motion rules.

Implement `js/app.js` startup, `navigate`, and `renderHome`. The bottle layer must render one button per pending record and set the count from `store.pending().length`.

- [ ] **Step 5: Run automated and browser shell checks**

Run: `npm test`

Expected: all tests PASS.

Open the page at a 1194 × 900 desktop viewport. Verify that only the home view is visible, the form/archive are not on the home screen, all three home actions are reachable, and there is no horizontal scrollbar.

- [ ] **Step 6: Commit the shell**

```powershell
git add index.html styles.css js/app.js tests/star-store.test.js
git commit -m "feat: rebuild desktop star jar home"
```

---

### Task 3: Write, Fold, and Fly-In Flow

**Files:**
- Modify: `js/app.js`
- Modify: `styles.css`
- Modify: `index.html`
- Reuse: `assets/fold-strip.png`

**Interfaces:**
- Consumes: `store.add(input)` and `navigate(viewName)`.
- Produces: `startFold()`, `commitFoldedStar()`, and write-view stages `form`, `folding`, and `success`.

- [ ] **Step 1: Add failing validation tests**

Extend the model tests to assert that `store.add` rejects whitespace-only reasons and clamps intensity into `0..100`:

```js
test('add rejects empty reason and clamps intensity', () => {
  const store = createStarStore(memoryStorage(), () => 0);
  assert.throws(() => store.add({ reason: '   ' }), /生气原因/);
  const star = store.add({ reason: '压力很大', intensity: 160, color: 'blue' });
  assert.equal(star.intensity, 100);
});
```

- [ ] **Step 2: Run validation test and verify failure**

Run: `npm test`

Expected: FAIL until validation and clamping exist.

- [ ] **Step 3: Implement validation and the three-stage write flow**

Update the model validation, then implement:

- form submission to the folding stage without persisting yet;
- a staged paper-to-star animation using the fold-strip asset and a real star element;
- a “放进瓶子” action that calls `store.add` exactly once;
- a curved fly-to-bottle animation clone;
- success copy and return-home action;
- reset of form and animation state after completion;
- inline error text and focus restoration when reason is empty;
- an interaction lock while folding or flying.

- [ ] **Step 4: Verify the write journey in browser**

At 1194 × 900:

1. Enter the write view.
2. Submit an empty reason and confirm the view remains open with an inline message.
3. Fill all fields and start folding.
4. Confirm the form hides and the folding stage appears.
5. Put the star in the bottle and confirm one persistence write, one success state, and count +1 on home.
6. Reload and confirm the star remains.

Run `npm test` and confirm all tests PASS.

- [ ] **Step 5: Commit the write flow**

```powershell
git add js/star-store.js js/app.js styles.css index.html tests/star-store.test.js
git commit -m "feat: add write and fold star journey"
```

---

### Task 4: Random Open, Return, Resolve, and Archive

**Files:**
- Modify: `js/app.js`
- Modify: `styles.css`
- Modify: `index.html`
- Modify: `tests/star-store.test.js`

**Interfaces:**
- Consumes: `store.pickRandomPending()`, `store.resolve(id, solution)`, `filterResolved(stars, color)`, and `navigate(viewName)`.
- Produces: `openRandomStar()`, `returnOpenedStar()`, `resolveOpenedStar()`, and `renderArchive(filter)`.

- [ ] **Step 1: Add failing archive ordering test**

Add a test proving `filterResolved` sorts newest `resolvedAt` first without mutating input:

```js
test('resolved archive is newest first without mutating source', () => {
  const source = [
    { id: 'old', status: 'resolved', color: 'pink', resolvedAt: '2026-08-13T10:00:00.000Z' },
    { id: 'new', status: 'resolved', color: 'pink', resolvedAt: '2026-08-14T10:00:00.000Z' }
  ];
  const result = filterResolved(source, 'all');
  assert.deepEqual(result.map((item) => item.id), ['new', 'old']);
  assert.deepEqual(source.map((item) => item.id), ['old', 'new']);
});
```

- [ ] **Step 2: Run the archive test and verify failure**

Run: `npm test`

Expected: FAIL until newest-first immutable sorting is implemented.

- [ ] **Step 3: Implement random-open and return behavior**

Implement `openRandomStar()` so it:

- disables itself when no pending entries exist;
- chooses from pending entries only;
- animates bottle shake and star flight;
- renders the unfolded paper with the complete original record;
- offers return and resolve choices.

Implement return so the paper folds and flies back without any store mutation, then navigates home.

- [ ] **Step 4: Implement resolution and archive behavior**

Implement:

- a hidden-until-selected solution form;
- non-empty solution validation that keeps the open view active;
- resolve animation followed by `store.resolve` exactly once;
- archive count, color filter controls, newest-first cards, and expandable solution details;
- archive empty state using the companion asset;
- clear back-to-home navigation.

- [ ] **Step 5: Verify the full journey in browser**

At 1194 × 900:

1. Open a random pending star and record its title.
2. Return it and confirm pending count is unchanged.
3. Open a random star, choose resolved, submit whitespace, and confirm no state change.
4. Submit a valid solution and confirm pending count decreases by one.
5. Open archive and confirm the record, solution, original reason, and timestamps are present.
6. Reload and confirm the resolved record persists.
7. Test color filtering and card expand/collapse.

Run `npm test` and confirm all tests PASS.

- [ ] **Step 6: Commit the resolution flow**

```powershell
git add js/star-store.js js/app.js styles.css index.html tests/star-store.test.js
git commit -m "feat: add random resolve and growth archive"
```

---

### Task 5: Desktop Visual QA and Cleanup

**Files:**
- Modify: `styles.css`
- Modify: `js/app.js`
- Modify: `design-qa.md`
- Remove from application references: `responsive.css`, `app-enhancements.js`, `manifest.webmanifest`, `sw.js`

**Interfaces:**
- Consumes: completed four-view app from Tasks 1–4.
- Produces: final desktop screenshots and `design-qa.md` with `final result: passed` only after P0/P1/P2 issues are fixed.

- [ ] **Step 1: Capture all four views**

At the exact desktop viewport used for QA, capture home, write form, unfolded random star, and archive. Capture both empty and populated home states if practical.

- [ ] **Step 2: Compare reference and home in one canvas**

Place the reference and current home capture side by side at equal height. Check bottle material, scale, title hierarchy, star palette, panel depth, background atmosphere, character quality, clipping, and spacing.

- [ ] **Step 3: Fix all P0/P1/P2 findings**

Adjust only evidence-backed issues. Repeat capture and comparison after each correction batch. Do not mark the QA passed while a primary action is obscured, a view clips, the bottle is static relative to data, or the reference material treatment is visibly absent.

- [ ] **Step 4: Run final verification**

Run:

```powershell
npm test
node --check js/app.js
node --check js/star-store.js
git diff --check
```

Expected: all commands succeed. In browser, verify all primary journeys, keyboard focus, reduced-motion mode, reload persistence, and zero console errors.

- [ ] **Step 5: Commit final QA changes**

```powershell
git add index.html styles.css js app tests package.json design-qa.md
git commit -m "feat: complete desktop multi-view emotion star jar"
```
