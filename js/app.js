import { createStarStore, filterResolved } from './star-store.js';
import { createViewState } from './view-state.js';
import { createStarLayout } from './star-layout.js';
import { EMOTIONS, getEmotion, getEmotionLabel } from './emotion-catalog.js';

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
const customEmotionField = document.querySelector('#custom-emotion-field');
const customEmotionInput = document.querySelector('#custom-emotion');
const reasonError = document.querySelector('#reason-error');
const customEmotionError = document.querySelector('#custom-emotion-error');
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
const openStarEmotion = document.querySelector('#open-star-emotion');
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
const archiveFilters = new Set(['all', ...EMOTIONS.map(({ id }) => id)]);
const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '日期未知';
  try {
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
  } catch {
    return '日期未知';
  }
};
const STORAGE_ERROR_MESSAGE = '无法保存到浏览器，请检查存储空间或隐私设置后重试';

export function renderHome() {
  const pending = store.pending();
  const resolved = store.resolved();
  const layout = createStarLayout(Math.min(pending.length, 42));
  pendingCount.textContent = pending.length;
  resolvedCount.textContent = resolved.length;
  archiveCount.textContent = resolved.length;
  homeEmpty.hidden = pending.length !== 0;
  openAction.disabled = pending.length === 0;
  starLayer.replaceChildren(...pending.slice(0, 42).map((star, index) => {
    const position = layout[index];
    const decoration = document.createElement('span');
    decoration.className = `bottle-star ${star.color}`;
    decoration.style.left = `${position.x}%`;
    decoration.style.bottom = `${position.y}%`;
    decoration.style.setProperty('--star-size', `${position.size}px`);
    decoration.style.setProperty('--star-rotate', `${position.rotate}deg`);
    decoration.style.setProperty('--star-duration', `${position.duration}s`);
    decoration.style.zIndex = position.depth;
    decoration.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = './assets/origami-star-cute.webp';
    image.alt = '';
    decoration.append(image);
    return decoration;
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
  customEmotionError.textContent = '';
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
    reasonError.textContent = '请先写下发生的事情';
    reasonInput.focus();
    return false;
  }
  reasonError.textContent = '';
  const emotion = new FormData(form).get('emotion');
  const customEmotion = customEmotionInput.value.trim();
  if (emotion === 'other' && !customEmotion) {
    customEmotionError.textContent = '请填写情绪名称';
    customEmotionInput.focus();
    return false;
  }
  customEmotionError.textContent = '';
  draftStar = {
    title: titleInput.value.trim(),
    reason,
    intensity: Number(intensityInput.value),
    emotion,
    customEmotion
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
  try {
    let saved;
    try {
      saved = store.add(draftStar);
    } catch {
      showToast(STORAGE_ERROR_MESSAGE);
      return null;
    }
    await flyStarIntoJar();
    foldStage.hidden = true;
    writeSuccess.hidden = false;
    form.reset();
    customEmotionField.hidden = true;
    customEmotionError.textContent = '';
    intensityInput.value = '60';
    intensityOutput.textContent = '60';
    reasonCount.textContent = '0 / 120';
    draftStar = null;
    showToast('情绪星星已经收进瓶子里了');
    return saved;
  } finally {
    interactionLocked = false;
    commitStarButton.disabled = false;
  }
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
  const emotion = getEmotion(openedStar.emotion);
  const starColor = openedStar.color || emotion.color;
  openedStarArt.className = starColor;
  openColor.className = `color-swatch ${starColor}`;
  openStarEmotion.textContent = getEmotionLabel(openedStar);
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
    solutionError.textContent = '请写下回应内容';
    solutionText.focus();
    return null;
  }
  interactionLocked = true;
  resolveStarButton.disabled = true;
  openStage.classList.add('is-dissolving');
  try {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise((resolve) => setTimeout(resolve, 720));
    let resolved;
    try {
      resolved = store.resolve(openedStar.id, solution);
    } catch {
      openStage.classList.remove('is-dissolving');
      showToast(STORAGE_ERROR_MESSAGE);
      return null;
    }
    openedStar = null;
    renderHome();
    renderArchive();
    navigate('archive');
    showToast('这份回应已经收入成长记录');
    return resolved;
  } finally {
    interactionLocked = false;
    resolveStarButton.disabled = false;
  }
}

export function renderArchive(filter = archiveFilter) {
  archiveFilter = archiveFilters.has(filter) ? filter : 'all';
  const allResolved = store.resolved();
  const records = filterResolved(allResolved, archiveFilter);
  archiveCount.textContent = allResolved.length;
  resolvedCount.textContent = allResolved.length;
  archiveEmpty.hidden = allResolved.length !== 0;
  archiveGrid.hidden = allResolved.length === 0;
  filterButtons.forEach((button) => button.classList.toggle('is-selected', button.dataset.filter === archiveFilter));
  archiveGrid.replaceChildren(...records.map((star) => {
    const article = document.createElement('article');
    const emotion = getEmotion(star.emotion);
    const starColor = star.color || emotion.color;
    article.className = `archive-card ${starColor}`;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'archive-card-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    const starVisual = document.createElement('span');
    starVisual.className = 'archive-star';
    const starImage = document.createElement('img');
    starImage.src = './assets/origami-star-cute.webp';
    starImage.alt = '';
    starVisual.append(starImage);
    const summary = document.createElement('span');
    const summaryMeta = document.createElement('small');
    summaryMeta.textContent = `${getEmotionLabel(star)} · ${formatDate(star.resolvedAt)}`;
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
    label.textContent = '我是这样回应的';
    const copy = document.createElement('p');
    copy.textContent = star.solution;
    const time = document.createElement('span');
    time.textContent = `记录于 ${formatDate(star.createdAt)} · 回应于 ${formatDate(star.resolvedAt)}`;
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
  window.scrollTo({ top: 0, behavior: 'auto' });
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
form.querySelectorAll('input[name="emotion"]').forEach((input) => input.addEventListener('change', () => {
  customEmotionField.hidden = input.value !== 'other' || !input.checked;
  if (customEmotionField.hidden) {
    customEmotionInput.value = '';
    customEmotionError.textContent = '';
  }
}));
customEmotionInput.addEventListener('input', () => { if (customEmotionInput.value.trim()) customEmotionError.textContent = ''; });
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
