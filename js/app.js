import { createStarStore } from './star-store.js';
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

router.subscribe((activeView) => {
  views.forEach((view, name) => {
    const isActive = name === activeView;
    view.hidden = !isActive;
    view.classList.toggle('is-active', isActive);
  });
  if (activeView === 'home') renderHome();
  if (activeView === 'write') resetWriteView();
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

renderHome();
