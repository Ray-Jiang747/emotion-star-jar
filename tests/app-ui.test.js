import test from 'node:test';
import assert from 'node:assert/strict';

class FakeClassList {
  constructor() { this.names = new Set(); }
  add(...names) { names.forEach((name) => this.names.add(name)); }
  remove(...names) { names.forEach((name) => this.names.delete(name)); }
  toggle(name, force) {
    const enabled = force ?? !this.names.has(name);
    if (enabled) this.names.add(name);
    else this.names.delete(name);
    return enabled;
  }
  contains(name) { return this.names.has(name); }
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.dataset = {};
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.textContent = '';
    this.className = '';
    this.children = [];
    this.attributes = new Map();
    this.classList = new FakeClassList();
    this.style = { setProperty(name, value) { this[name] = value; } };
  }
  addEventListener() {}
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  focus() { this.focused = true; }
  reset() {}
  querySelectorAll(selector) { return selector === 'input[name="emotion"]' ? this.emotionInputs ?? [] : []; }
  closest() { return null; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 10, height: 10 }; }
  cloneNode() { return new FakeElement(this.tagName); }
  animate() { return { finished: Promise.resolve() }; }
}

const queriedIds = [
  'pending-count', 'resolved-count', 'archive-count', 'star-layer', 'home-empty', 'action-open',
  'star-form', 'star-title', 'star-reason', 'custom-emotion-field', 'custom-emotion', 'reason-error',
  'custom-emotion-error', 'reason-count', 'star-intensity', 'intensity-output', 'fold-stage',
  'folded-star', 'fold-target-jar', 'commit-star', 'write-success', 'toast', 'open-empty', 'open-stage',
  'opened-star-art', 'open-color', 'open-star-title', 'open-star-emotion', 'open-star-reason',
  'open-star-intensity', 'open-star-created', 'open-actions', 'return-star', 'show-solution',
  'solution-panel', 'solution-text', 'solution-error', 'resolve-star', 'archive-grid', 'archive-empty'
  , 'open-picker', 'star-choice', 'open-selected-star', 'open-random-star'
];

function installBrowser(seed = []) {
  const elements = new Map(queriedIds.map((id) => [id, new FakeElement()]));
  const views = ['home', 'write', 'open', 'archive'].map((name) => {
    const view = new FakeElement('section');
    view.dataset.view = name;
    return view;
  });
  const filterButtons = ['all', 'happy', 'calm', 'sad', 'anxious', 'wronged', 'angry', 'other'].map((name) => {
    const button = new FakeElement('button');
    button.dataset.filter = name;
    return button;
  });
  const emotionInputs = ['happy', 'calm', 'sad', 'anxious', 'wronged', 'angry', 'other'].map((value, index) => {
    const input = new FakeElement('input');
    input.value = value;
    input.checked = index === 0;
    return input;
  });
  elements.get('star-form').emotionInputs = emotionInputs;
  elements.get('star-intensity').value = '60';

  let writes = 0;
  globalThis.localStorage = {
    getItem: () => JSON.stringify(seed),
    setItem: () => { writes += 1; throw new Error('storage unavailable'); }
  };
  globalThis.document = {
    body: new FakeElement('body'),
    querySelector(selector) {
      if (selector.startsWith('#') && !selector.includes(' ')) return elements.get(selector.slice(1));
      if (selector.startsWith('#view-')) return new FakeElement('h2');
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-view]') return views;
      if (selector === '[data-filter]') return filterButtons;
      return [];
    },
    createElement: (tagName) => new FakeElement(tagName),
    addEventListener() {}
  };
  globalThis.window = { scrollTo() {} };
  globalThis.matchMedia = () => ({ matches: true });
  globalThis.FormData = class {
    constructor(form) { this.form = form; }
    get(name) { return name === 'emotion' ? this.form.emotionInputs.find((input) => input.checked)?.value : null; }
  };

  return { elements, writes: () => writes };
}

async function loadApp(caseName) {
  return import(new URL(`../js/app.js?case=${caseName}`, import.meta.url));
}

test('commit recovers the controls and keeps the draft retryable when storage fails', async () => {
  const browser = installBrowser();
  const app = await loadApp('commit-failure');
  browser.elements.get('star-reason').value = '今天有点难过';
  assert.equal(app.startFold(), true);

  let result;
  await assert.doesNotReject(async () => { result = await app.commitFoldedStar(); });
  assert.equal(result, null);
  assert.equal(browser.elements.get('commit-star').disabled, false);
  assert.match(browser.elements.get('toast').textContent, /无法保存.*浏览器/);

  await app.commitFoldedStar();
  assert.equal(browser.writes(), 2);
});

test('resolve recovers the controls and open state when storage fails', async () => {
  const browser = installBrowser([{ id: 'open', reason: '仍需回应', status: 'pending', createdAt: '2026-08-14T10:00:00.000Z' }]);
  const app = await loadApp('resolve-failure');
  app.openRandomStar();
  browser.elements.get('solution-text').value = '先照顾好自己';

  let result;
  await assert.doesNotReject(async () => { result = await app.resolveOpenedStar(); });
  assert.equal(result, null);
  assert.equal(browser.elements.get('resolve-star').disabled, false);
  assert.equal(browser.elements.get('open-stage').classList.contains('is-dissolving'), false);
  assert.match(browser.elements.get('toast').textContent, /无法保存.*浏览器/);

  await app.resolveOpenedStar();
  assert.equal(browser.writes(), 2);
});

test('home bottle stars are decorative and cannot enter the tab order', async () => {
  const browser = installBrowser([{ id: 'open', reason: '一颗星', status: 'pending' }]);
  await loadApp('decorative-stars');

  const [star] = browser.elements.get('star-layer').children;
  assert.equal(star.tagName, 'SPAN');
  assert.equal(star.getAttribute('aria-hidden'), 'true');
  assert.equal(star.getAttribute('tabindex'), null);
});

test('custom emotion validation reports the error beside the custom field', async () => {
  const browser = installBrowser();
  const app = await loadApp('custom-emotion-error');
  browser.elements.get('star-reason').value = '一种说不清的感受';
  browser.elements.get('star-form').emotionInputs.forEach((input) => { input.checked = input.value === 'other'; });

  assert.equal(app.startFold(), false);
  assert.equal(browser.elements.get('reason-error').textContent, '');
  assert.equal(browser.elements.get('custom-emotion-error').textContent, '请填写情绪名称');
  assert.equal(browser.elements.get('custom-emotion').focused, true);
});

test('opening a star with an invalid stored date uses a safe fallback', async () => {
  const browser = installBrowser([{ id: 'open', reason: '旧记录', status: 'pending', createdAt: 'not-a-date' }]);
  const app = await loadApp('invalid-date');

  assert.doesNotThrow(() => app.openRandomStar());
  assert.equal(browser.elements.get('open-star-created').textContent, '日期未知');
});

test('opening view waits for a choice and lists only pending stars', async () => {
  const browser = installBrowser([
    { id: 'first', title: '第一颗', reason: '待回应一', status: 'pending', emotion: 'sad' },
    { id: 'second', title: '第二颗', reason: '待回应二', status: 'pending', emotion: 'happy' },
    { id: 'done', title: '已完成', reason: '不应出现', status: 'resolved', solution: '完成' }
  ]);
  const app = await loadApp('open-picker');

  app.navigate('open');

  assert.equal(browser.elements.get('open-stage').hidden, true);
  assert.equal(browser.elements.get('open-picker').hidden, false);
  assert.equal(browser.elements.get('star-choice').children.length, 2);
  assert.match(browser.elements.get('star-choice').children[0].textContent, /难过.*第一颗/);
});

test('opens the pending star selected by id', async () => {
  const browser = installBrowser([
    { id: 'first', title: '第一颗', reason: '待回应一', status: 'pending' },
    { id: 'second', title: '第二颗', reason: '待回应二', status: 'pending' }
  ]);
  const app = await loadApp('open-selected');
  app.prepareOpenView();
  browser.elements.get('star-choice').value = 'second';

  const selected = app.openSelectedStar();

  assert.equal(selected.id, 'second');
  assert.equal(browser.elements.get('open-star-title').textContent, '第二颗');
  assert.equal(browser.elements.get('open-stage').hidden, false);
  assert.equal(browser.elements.get('open-picker').hidden, true);
});
