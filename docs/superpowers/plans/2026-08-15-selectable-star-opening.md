# Selectable Star Opening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users either randomly open a pending emotion star or choose a specific pending star on mobile and desktop.

**Architecture:** Extend the store with a pending-only ID lookup. Replace automatic random opening on route entry with a picker-preparation step, then route both random and selected actions through one rendering function.

**Tech Stack:** Static HTML, mobile-first CSS, ES modules, Node test runner, GitHub Pages PWA.

## Global Constraints

- Existing `emotion-star-jar:v1` local records remain unchanged.
- No star is deleted or resolved merely by opening it.
- Controls remain within a 320px viewport and have at least 44px touch height.
- Random opening remains available alongside explicit selection.

---

### Task 1: Pending record lookup

**Files:**
- Modify: `js/star-store.js`
- Test: `tests/star-store.test.js`

**Interfaces:**
- Produces: `findPending(id: string): Star | null`

- [ ] **Step 1: Write the failing test**

```js
assert.equal(store.findPending('pending').id, 'pending');
assert.equal(store.findPending('resolved'), null);
assert.equal(store.findPending('missing'), null);
```

- [ ] **Step 2: Run the test and verify the missing method failure**

Run: `node --test tests/star-store.test.js`

- [ ] **Step 3: Implement the pending-only lookup**

```js
const findPending = (id) => pending().find((star) => star.id === String(id || '')) || null;
return { list, pending, resolved, add, pickRandomPending, findPending, resolve, save };
```

- [ ] **Step 4: Re-run the store test and verify it passes**

Run: `node --test tests/star-store.test.js`

### Task 2: Picker UI and shared opening flow

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `js/app.js`
- Modify: `sw.js`
- Test: `tests/app-ui.test.js`
- Test: `tests/ui-contract.test.js`

**Interfaces:**
- Produces: `prepareOpenView(): Star[]`
- Produces: `openSelectedStar(id?: string): Star | null`
- Keeps: `openRandomStar(): Star | null`

- [ ] **Step 1: Write failing tests for picker preparation and selected opening**

```js
const app = await loadApp('select-star');
app.prepareOpenView();
assert.equal(browser.elements.get('open-stage').hidden, true);
assert.equal(browser.elements.get('star-choice').children.length, 2);
browser.elements.get('star-choice').value = 'second';
assert.equal(app.openSelectedStar().id, 'second');
```

- [ ] **Step 2: Run focused UI tests and verify failure**

Run: `node --test tests/app-ui.test.js tests/ui-contract.test.js`

- [ ] **Step 3: Add the picker markup and mobile-first styles**

```html
<div id="open-picker" class="open-picker">
  <label for="star-choice">选择一颗待回应星星</label>
  <select id="star-choice"></select>
  <div class="open-picker-actions">
    <button id="open-selected-star">打开选择的星星</button>
    <button id="open-random-star">随机抽一颗</button>
  </div>
</div>
```

Use a one-column grid by default and two action columns at `min-width: 768px`; apply `min-width: 0`, `max-width: 100%`, and `min-height: 44px` to the controls.

- [ ] **Step 4: Implement picker preparation and one shared star renderer**

```js
export function prepareOpenView() {
  const pending = store.pending();
  openPicker.hidden = pending.length === 0;
  openEmpty.hidden = pending.length !== 0;
  openStage.hidden = true;
  starChoice.replaceChildren(...pending.map((star) => {
    const option = document.createElement('option');
    option.value = star.id;
    option.textContent = `${getEmotionLabel(star)} · ${star.title || star.reason.slice(0, 24)}`;
    return option;
  }));
  return pending.map((star) => ({ ...star }));
}

const displayOpenedStar = (star) => {
  if (!star) {
    prepareOpenView();
    showToast('这颗星星已经不在待回应列表里，请重新选择');
    return null;
  }
  openedStar = star;
  openPicker.hidden = true;
  openEmpty.hidden = true;
  openStage.hidden = false;
  openStarEmotion.textContent = getEmotionLabel(star);
  openStarTitle.textContent = star.title || '没有标题的这颗星星';
  openStarReason.textContent = star.reason;
  openStarIntensity.textContent = `${star.intensity} / 100`;
  openStarCreated.textContent = formatDate(star.createdAt);
  return { ...star };
};

export function openRandomStar() { return displayOpenedStar(store.pickRandomPending()); }
export function openSelectedStar(id = starChoice.value) { return displayOpenedStar(store.findPending(id)); }
```

Change the open-route subscriber from `openRandomStar()` to `prepareOpenView()`, bind both new buttons, bump application/cache query versions, and include the updated shell resources.

- [ ] **Step 5: Run all tests and syntax checks**

Run: `npm test`

Run: `node --check js/app.js; node --check js/star-store.js; node --check sw.js; git diff --check`

- [ ] **Step 6: Commit, push, deploy, and refresh the local package**

```powershell
git add index.html styles.css js/app.js js/star-store.js sw.js tests/app-ui.test.js tests/star-store.test.js tests/ui-contract.test.js
git commit -m "feat: allow choosing a star to open"
git push origin codex/desktop-multi-view
```

Verify the GitHub Pages build matches the commit, check the live picker resources, and copy the changed runtime files into `C:\Users\CHAO\Desktop\情绪星星瓶_本地发布包_2026-08-15`.
