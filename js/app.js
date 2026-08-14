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

router.subscribe((activeView) => {
  views.forEach((view, name) => {
    const isActive = name === activeView;
    view.hidden = !isActive;
    view.classList.toggle('is-active', isActive);
  });
  if (activeView === 'home') renderHome();
  document.querySelector(`#view-${activeView} h1, #view-${activeView} h2`)?.focus?.();
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-nav]');
  if (target && !target.disabled) navigate(target.dataset.nav);
});

renderHome();
