# 情绪折纸星星瓶 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, single-page emotion star jar that locally records unresolved anger and preserves resolved entries with their solutions.

**Architecture:** A dependency-free static `index.html` contains the semantic page structure, CSS hand-account visual system, and a small browser-side JavaScript module. State is a `StarEntry[]` read from and written to localStorage; UI rendering derives the bottle, pending list, resolved history, and counters from that array.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, browser localStorage.

## Global Constraints

- Create the product as a standalone static page at `C:\Users\CHAO\Desktop\web\index.html`; do not replace other files.
- Do not use accounts, a server, external APIs, analytics, or external assets.
- Store only the user's entries in localStorage under `emotion-star-jar:v1`.
- Use an original round-eared bow-cat sticker style rather than copying an existing character.
- Require a non-empty reason to create a star and a non-empty solution to resolve one.
- Respect `prefers-reduced-motion` and make all controls keyboard accessible.

---

### Task 1: Build the static shell and hand-account visual system

**Files:**
- Create: `C:\Users\CHAO\Desktop\web\index.html`
- Test: manual browser rendering at `file:///C:/Users/CHAO/Desktop/web/index.html`

**Interfaces:**
- Produces: named DOM elements `#reason-input`, `#color-picker`, `#create-star`, `#bottle-stars`, `#pending-list`, `#resolved-list`, `#star-dialog`, `#solution-input`, and `#resolve-star` for the interaction module.
- Consumes: no external files or services.

- [ ] **Step 1: Define a visual acceptance check**

Open the file in a browser and verify the first viewport contains the title “我的情绪星星瓶”, a paper-note writing area, a central glass bottle, and separate “还在瓶里的星星” and “已经解决啦” sections. At 375 px width, verify the regions stack in this order: writing area, bottle, pending, resolved.

- [ ] **Step 2: Create the semantic static page**

Create `index.html` with a `<main>` containing a `header`, reason form, color picker implemented as labeled radio buttons, bottle region, pending and resolved `section` elements, and a native `<dialog>` for solution entry. Give status changes an `aria-live="polite"` element and give every input a visible `<label>`.

- [ ] **Step 3: Add the visual implementation**

Embed CSS that defines cream paper, blush pink panels, ruled/grid-paper textures made with CSS gradients, a translucent rounded bottle, paper star shapes using rotated squares with clipped corners, and a small CSS-only original bow-cat sticker. Use CSS custom properties for the four star colors. Add a media query at `720px` to change the page from one column to a bottle-led two-column layout, and add a `prefers-reduced-motion: reduce` rule disabling transitions and keyframe animation.

- [ ] **Step 4: Run the visual acceptance check**

Open the page in a browser and verify the expected first viewport at both desktop and mobile widths. Confirm that empty-state messages are calm and instructive, not judgmental.

### Task 2: Implement validated local star storage and pending-star rendering

**Files:**
- Modify: `C:\Users\CHAO\Desktop\web\index.html`
- Test: browser console checks in the opened page

**Interfaces:**
- Consumes: `#reason-input`, radio inputs named `star-color`, `#create-star`, `#bottle-stars`, `#pending-list`, `#resolved-list`, and counter elements from Task 1.
- Produces: `loadStars(): StarEntry[]`, `saveStars(stars: StarEntry[]): boolean`, `createStar(reason: string, color: StarColor): StarEntry`, and `render(stars: StarEntry[]): void`.
- Data type: `StarEntry = { id: string; reason: string; color: 'pink' | 'yellow' | 'blue' | 'purple'; status: 'pending' | 'resolved'; createdAt: string; solution: string; resolvedAt: string | null }`.

- [ ] **Step 1: Define failing browser checks**

In the browser console, run:

```js
localStorage.removeItem('emotion-star-jar:v1');
document.querySelector('#reason-input').value = '';
document.querySelector('#create-star').click();
document.querySelector('#pending-list').textContent.includes('请先写下')
```

Expected: the last expression is `true`, and the bottle remains empty.

- [ ] **Step 2: Implement the data and validation functions**

Add a script that parses only an array of objects from `emotion-star-jar:v1`, rejects malformed storage by returning an empty array and announcing that past data could not be read, and saves with `JSON.stringify`. Create stars with `crypto.randomUUID()` when available, otherwise a time-and-random fallback. Trim reasons and reject empty values with the precise message “请先写下让你生气的原因，再折成星星。”

- [ ] **Step 3: Implement pending rendering**

Implement `render` so pending entries become focusable `<button class="star">` items in the bottle and reason cards in `#pending-list`. Each button has an `aria-label` containing “查看星星” and its creation date. Render resolved entries separately, count each status in the header, and show a friendly empty state when either list is empty.

- [ ] **Step 4: Run passing storage checks**

In the browser, enter “沟通时被误解了”, select pink, and create a star. Refresh the page. Verify that one bottle star, one pending card, and the same reason remain; verify `JSON.parse(localStorage.getItem('emotion-star-jar:v1'))[0].status === 'pending'` evaluates to `true`.

### Task 3: Resolve stars and preserve the solution history

**Files:**
- Modify: `C:\Users\CHAO\Desktop\web\index.html`
- Test: browser interaction and console checks in the opened page

**Interfaces:**
- Consumes: `StarEntry[]`, `render`, and dialog controls from Tasks 1–2.
- Produces: `openStar(id: string): void` and `resolveStar(id: string, solution: string): boolean`.

- [ ] **Step 1: Define a failing resolution check**

Select the pending star and open its dialog. Leave the solution field blank and click “问题解决啦”. Expected: the dialog stays open, the message “写下你是怎么解决的，再让这颗星星离开瓶子吧。” is announced, and the pending count stays at one.

- [ ] **Step 2: Implement selection and resolution**

On a bottle star or pending card click, store its id in `dialog.dataset.starId`, fill the dialog with the original reason, and call `showModal()`. Implement `resolveStar` to trim and validate its solution, replace only the matching pending entry with `{ ...entry, status: 'resolved', solution, resolvedAt: new Date().toISOString() }`, persist the complete array, close the dialog, and call `render`.

- [ ] **Step 3: Render resolved history**

Render resolved cards in descending `resolvedAt` order. Each card must show the original reason, the solution, creation date, and resolution date using `Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })`. Add a short departure animation only when reduced motion is not requested.

- [ ] **Step 4: Run passing resolution checks**

Enter “认真解释自己的感受”, resolve the pending star, then refresh. Verify zero pending stars, one resolved card, and both “沟通时被误解了” and “认真解释自己的感受” are still visible. In the console verify the stored entry has `status === 'resolved'` and a non-null `resolvedAt`.

### Task 4: Final accessibility and resilience pass

**Files:**
- Modify: `C:\Users\CHAO\Desktop\web\index.html`
- Test: keyboard-only browser pass and local syntax check

**Interfaces:**
- Consumes: complete static page and its localStorage key.
- Produces: a self-contained page that remains functional after invalid saved data and across responsive layouts.

- [ ] **Step 1: Run keyboard acceptance checks**

Starting from a page reload, use only Tab, Space, Enter, and Escape to choose a color, write a reason, create a star, open it, enter a solution, resolve it, and close the dialog. Expected: focus remains visible, the dialog traps normal native dialog focus, and Escape closes it without changing the record.

- [ ] **Step 2: Implement resilience refinements**

Wrap localStorage read/write operations in `try/catch`. If writing fails, keep the current in-memory state rendered and announce “这台设备暂时无法保存记录；请稍后重试。” If parsing fails, clear only the invalid key after successful user interaction and show an empty state. Ensure user-provided text is rendered with `textContent`, never HTML insertion.

- [ ] **Step 3: Run final checks**

Run a browser syntax check by opening the local page with developer tools and confirm there are no JavaScript errors after adding and resolving a star. Replace localStorage with `localStorage.setItem('emotion-star-jar:v1', '{bad json}')`, reload, and verify an empty, usable page is shown. Repeat the visual acceptance check at 375 px and 1280 px widths.

- [ ] **Step 4: Record the deliverable status**

Because `C:\Users\CHAO\Desktop\web` is not a Git repository, do not attempt a commit. Report the standalone `index.html` as the completed deliverable and state that all data stays in that browser's local storage.
