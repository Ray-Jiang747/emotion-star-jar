import { EMOTIONS, getEmotion } from './emotion-catalog.js';

const STORAGE_KEY = 'emotion-star-jar:v1';
const COLORS = new Set(EMOTIONS.map(({ color }) => color));
const EMOTION_IDS = new Set(EMOTIONS.map(({ id }) => id));

const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function normalizeStar(raw = {}) {
  const requestedEmotion = String(raw.emotion || '').trim();
  const emotion = EMOTION_IDS.has(requestedEmotion) ? requestedEmotion : 'angry';
  const selectedEmotion = getEmotion(emotion);
  return {
    id: String(raw.id || createId()),
    title: String(raw.title || '').trim(),
    reason: String(raw.reason || '').trim(),
    intensity: Number.isFinite(Number(raw.intensity)) ? Math.min(100, Math.max(0, Number(raw.intensity))) : 60,
    emotion,
    customEmotion: String(raw.customEmotion || '').trim(),
    color: requestedEmotion ? selectedEmotion.color : COLORS.has(raw.color) ? raw.color : selectedEmotion.color,
    createdAt: raw.createdAt || new Date().toISOString(),
    status: raw.status === 'resolved' ? 'resolved' : 'pending',
    solution: String(raw.solution || '').trim(),
    resolvedAt: raw.resolvedAt || null
  };
}

export function filterResolved(stars, emotion = 'all') {
  return stars
    .filter((star) => star.status === 'resolved' && (emotion === 'all' || star.emotion === emotion))
    .sort((a, b) => new Date(b.resolvedAt || 0) - new Date(a.resolvedAt || 0));
}

export function createStarStore(storage = globalThis.localStorage, randomFn = Math.random) {
  let stars = [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    stars = Array.isArray(parsed) ? parsed.map(normalizeStar) : [];
  } catch {
    stars = [];
  }

  const save = (nextStars = stars) => {
    storage.setItem(STORAGE_KEY, JSON.stringify(nextStars));
    stars = nextStars;
    return stars;
  };

  const list = () => stars.map((star) => ({ ...star }));
  const pending = () => list().filter((star) => star.status === 'pending');
  const resolved = () => filterResolved(list(), 'all');

  const add = (input) => {
    const star = normalizeStar({ ...input, id: createId(), status: 'pending', createdAt: new Date().toISOString() });
    if (!star.reason) throw new Error('请先写下发生的事情');
    if (star.emotion === 'other' && !star.customEmotion) throw new Error('请填写情绪名称');
    star.color = getEmotion(star.emotion).color;
    save([...stars, star]);
    return { ...star };
  };

  const pickRandomPending = () => {
    const open = pending();
    if (!open.length) return null;
    return open[Math.floor(randomFn() * open.length)];
  };

  const resolve = (id, solution) => {
    const text = String(solution || '').trim();
    if (!text) throw new Error('请写下回应内容');
    const index = stars.findIndex((item) => item.id === id && item.status === 'pending');
    if (index === -1) throw new Error('没有找到待解决星星');
    const resolvedStar = {
      ...stars[index],
      status: 'resolved',
      solution: text,
      resolvedAt: new Date().toISOString()
    };
    save(stars.map((star, starIndex) => starIndex === index ? resolvedStar : star));
    return { ...resolvedStar };
  };

  return { list, pending, resolved, add, pickRandomPending, resolve, save };
}
