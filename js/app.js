import { createStarStore, filterResolved } from './star-store.js';
import { createViewState } from './view-state.js';

const store = createStarStore();
const router = createViewState('home');
const views = new Map([...document.querySelectorAll('[data-view]')].map((view) => [view.dataset.view, view]));
const pendingCount = document.querySelector('#pending-count');
const resolvedCount = document.querySelector('#resolved-count');
const archiveCount = document.querySelector('#archive-count');
const starLayer = document.querySelector('#star-layer');
const homeEmpty = document.querySelector('#home-empty');
const openAction = document.querySelector('#action-open');
const form = document.querySelector('#star-form');
const titleInput = document.querySelector('#star-title');
const reasonInput = document.querySelector('#star-reason');
const reasonError = document.querySelector('#reason-error');
const reasonCount = document.querySelector('#reason-count');
const intensityInput = document.querySelector('#star-intensity');
const intensityOutput = document.querySelector('#intensity-output');
const foldStage = document.querySelector('#fold-stage');
const foldedStar = document.querySelector('#folded-star');
const foldTargetJar = document.querySelector('#fold-target-jar');
const commitStarButton = document.querySelector('#commit-star');
const writeSuccess = document.querySelector('#write-success');
const toast = document.querySelector('#toast');
let draftStar = null;
let interactionLocked = false;
const openEmpty = document.querySelector('#open-empty');
const openStage = document.querySelector('#open-stage');
const openedStarArt = document.querySelector('#opened-star-art');
const openColor = document.querySelector('#open-color');
const openStarTitle = document.querySelector('#open-star-title');
const openStarReason = document.querySelector('#open-star-reason');
const openStarIntensity = document.querySelector('#open-star-intensity');
const openStarCreated = document.querySelector('#open-star-created');
const openActions = document.querySelector('#open-actions');
const returnStarButton = document.querySelector('#return-star');
const showSolutionButton = document.querySelector('#show-solution');
const solutionPanel = document.querySelector('#solution-panel');
const solutionText = document.querySelector('#solution-text');
const solutionError = document.querySelector('#solution-error');
const resolveStarButton = document.querySelector('#resolve-star');
const archiveGrid = document.querySelector('#archive-grid');
const archiveEmpty = document.querySelector('#archive-empty');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
let openedStar = null;
let archiveFilter = 'all';
const colorLabels = { pink: '粉色', yellow: '黄色', blue: '蓝色', purple: '紫色', mint: '薄荷色' };
const formatDate = (value) => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const starPosition = (index) => ({
  x: 14 + ((index * 37) % 72),
  y: 10 + Math.floor(index / 7) * 12 + ((index * 11) % 9),
  size: 48 + (index % 4) * 8,
  rotate: -18 + ((index * 29) % 38),
  duration: 3.2 + (index % 5) * .35
});

export function renderHome() {
  const pending = store.pending();
  const resolved = store.resolved();
  pendingCount.textContent = pending.length;
  resolvedCount.textContent = resolved.length;
  archiveCount.textContent = resolved.length;
  homeEmpty.hidden = pending.length !== 0;
  openAction.disabled = pending.length === 0;
  starLayer.replaceChildren(...pending.slice(0, 42).map((star, index) => {
    const position = starPosition(index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `bottle-star ${star.color}`;
    button.style.left = `${position.x}%`;
    button.style.bottom = `${position.y}%`;
    button.style.setProperty('--star-size', `${position.size}px`);
    button.style.setProperty('--star-rotate', `${position.rotate}deg`);
    button.style.setProperty('--star-duration', `${position.duration}s`);
    button.setAttribute('aria-label', `待解决星星：${star.title || star.reason}`);
    const image = document.createElement('img');
    image.src = './assets/origami-star.png';
    image.alt = '';
    button.append(image);
    return button;
  }));
}

export function navigate(viewName) {
  return router.navigate(viewName);
}

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('is-visible'), 2200);
};

const resetWriteView = () => {
  draftStar = null;
  interactionLocked = false;
  form.hidden = false;
  foldStage.hidden = true;
  writeSuccess.hidden = true;
  foldStage.classList.remove('is-folding');
  reasonError.textContent = '';
};

const flyStarIntoJar = async () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const start = foldedStar.getBoundingClientRect();
  const target = foldTargetJar.getBoundingClientRect();
  const clone = foldedStar.cloneNode(true);
  clone.removeAttribute('id');
  clone.className = 'flying-star';
  Object.assign(clone.style, { left: `${start.left}px`, top: `${start.top}px`, width: `${start.width}px`, height: `${start.height}px` });
  document.body.append(clone);
  await clone.animate([
    { transform: 'translate(0, 0) scale(1) rotate(0)', opacity: 1 },
    { transform: `translate(${(target.left - start.left) * .55}px, -90px) scale(.72) rotate(115deg)`, opacity: 1, offset: .55 },
    { transform: `translate(${target.left + target.width / 2 - start.left - start.width / 2}px, ${target.top + 42 - start.top}px) scale(.16) rotate(250deg)`, opacity: 0 }
  ], { duration: 820, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).finished;
  clone.remove();
};

export function startFold() {
  const reason = reasonInput.value.trim();
  if (!reason) {
    reasonError.textContent = '请先写下生气的原因';
    reasonInput.focus();
    return false;
  }
  draftStar = {
    title: titleInput.value.trim(),
    reason,
    intensity: Number(intensityInput.value),
    color: new FormData(form).get('color')
  };
  form.hidden = true;
  foldStage.hidden = false;
  foldStage.classList.add('is-folding');
  commitStarButton.disabled = false;
  return true;
}

export async function commitFoldedStar() {
  if (!draftStar || interactionLocked) return null;
  interactionLocked = true;
  commitStarButton.disabled = true;
  const saved = store.add(draftStar);
  await flyStarIntoJar();
  foldStage.hidden = true;
  writeSuccess.hidden = false;
  form.reset();
  intensityInput.value = '60';
  intensityOutput.textContent = '60';
  reasonCount.textContent = '0 / 120';
  draftStar = null;
  interactionLocked = false;
  showToast('星星已经飞进瓶子里了');
  return saved;
}

export function openRandomStar() {
  openedStar = store.pickRandomPending();
  solutionPanel.hidden = true;
  openActions.hidden = false;
  solutionText.value = '';
  solutionError.textContent = '';
  openStage.classList.remove('is-returning', 'is-dissolving');
  if (!openedStar) {
    openStage.hidden = true;
    openEmpty.hidden = false;
    return null;
  }
  openEmpty.hidden = true;
  openStage.hidden = false;
  openStage.classList.add('is-opening');
  setTimeout(() => openStage.classList.remove('is-opening'), 750);
  openedStarArt.className = openedStar.color;
  openColor.className = `color-swatch ${openedStar.color}`;
  openStarTitle.textContent = openedStar.title || '没有标题的这颗星星';
  openStarReason.textContent = openedStar.reason;
  openStarIntensity.textContent = `${openedStar.intensity} / 100`;
  openStarCreated.textContent = formatDate(openedStar.createdAt);
  return { ...openedStar };
}

export async function returnOpenedStar() {
  if (!openedStar || interactionLocked) return false;
  interactionLocked = true;
  openStage.classList.add('is-returning');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise((resolve) => setTimeout(resolve, 620));
  openedStar = null;
  interactionLocked = false;
  navigate('home');
  showToast('星星已经原样放回瓶子');
  return true;
}

export async function resolveOpenedStar() {
  if (!openedStar || interactionLocked) return null;
  const solution = solutionText.value.trim();
  if (!solution) {
    solutionError.textContent = '请写下你是怎么解决的';
    solutionText.focus();
    return null;
  }
  interactionLocked = true;
  resolveStarButton.disabled = true;
  openStage.classList.add('is-dissolving');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise((resolve) => setTimeout(resolve, 720));
  const resolved = store.resolve(openedStar.id, solution);
  openedStar = null;
  interactionLocked = false;
  resolveStarButton.disabled = false;
  renderHome();
  renderArchive();
  navigate('archive');
  showToast('这颗星星已经化成成长的星光');
  return resolved;
}

export function renderArchive(filter = archiveFilter) {
  archiveFilter = filter;
  const allResolved = store.resolved();
  const records = filterResolved(allResolved, archiveFilter);
  archiveCount.textContent = allResolved.length;
  resolvedCount.textContent = allResolved.length;
  archiveEmpty.hidden = allResolved.length !== 0;
  archiveGrid.hidden = allResolved.length === 0;
  filterButtons.forEach((button) => button.classList.toggle('is-selected', button.dataset.filter === archiveFilter));
  archiveGrid.replaceChildren(...records.map((star) => {
    const article = document.createElement('article');
    article.className = `archive-card ${star.color}`;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'archive-card-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    const starVisual = document.createElement('span');
    starVisual.className = 'archive-star';
    const starImage = document.createElement('img');
    starImage.src = './assets/origami-star.png';
    starImage.alt = '';
    starVisual.append(starImage);
    const summary = document.createElement('span');
    const summaryMeta = document.createElement('small');
    summaryMeta.textContent = `${colorLabels[star.color] || '情绪星星'} · ${formatDate(star.resolvedAt)}`;
    const summaryTitle = document.createElement('strong');
    summaryTitle.textContent = star.title || star.reason;
    const summaryReason = document.createElement('em');
    summaryReason.textContent = star.reason;
    summary.append(summaryMeta, summaryTitle, summaryReason);
    toggle.append(starVisual, summary);
    const detail = document.createElement('div');
    detail.className = 'archive-detail';
    detail.hidden = true;
    const label = document.createElement('b');
    label.textContent = '我是这样解决的';
    const copy = document.createElement('p');
    copy.textContent = star.solution;
    const time = document.createElement('span');
    time.textContent = `记录于 ${formatDate(star.createdAt)} · 解决于 ${formatDate(star.resolvedAt)}`;
    detail.append(label, copy, time);
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      detail.hidden = expanded;
    });
    article.append(toggle, detail);
    return article;
  }));
}

router.subscribe((activeView) => {
  views.forEach((view, name) => {
    const isActive = name === activeView;
    view.hidden = !isActive;
    view.classList.toggle('is-active', isActive);
  });
  if (activeView === 'home') renderHome();
  if (activeView === 'write') resetWriteView();
  if (activeView === 'open') openRandomStar();
  if (activeView === 'archive') renderArchive();
  document.querySelector(`#view-${activeView} h1, #view-${activeView} h2`)?.focus?.();
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-nav]');
  if (target && !target.disabled) navigate(target.dataset.nav);
});

reasonInput.addEventListener('input', () => {
  reasonCount.textContent = `${reasonInput.value.length} / 120`;
  if (reasonInput.value.trim()) reasonError.textContent = '';
});
intensityInput.addEventListener('input', () => { intensityOutput.textContent = intensityInput.value; });
form.addEventListener('submit', (event) => { event.preventDefault(); if (!interactionLocked) startFold(); });
commitStarButton.addEventListener('click', () => { void commitFoldedStar(); });
returnStarButton.addEventListener('click', () => { void returnOpenedStar(); });
showSolutionButton.addEventListener('click', () => {
  openActions.hidden = true;
  solutionPanel.hidden = false;
  solutionText.focus();
});
solutionText.addEventListener('input', () => { if (solutionText.value.trim()) solutionError.textContent = ''; });
resolveStarButton.addEventListener('click', () => { void resolveOpenedStar(); });
filterButtons.forEach((button) => button.addEventListener('click', () => renderArchive(button.dataset.filter)));

renderHome();
