const STORAGE_KEY = 'emotion-star-jar:v1';
const COLORS = new Set(['pink', 'yellow', 'blue', 'purple', 'mint']);

const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function normalizeStar(raw = {}) {
  return {
    id: String(raw.id || createId()),
    title: String(raw.title || '').trim(),
    reason: String(raw.reason || '').trim(),
    intensity: Number.isFinite(Number(raw.intensity)) ? Math.min(100, Math.max(0, Number(raw.intensity))) : 60,
    color: COLORS.has(raw.color) ? raw.color : 'pink',
    createdAt: raw.createdAt || new Date().toISOString(),
    status: raw.status === 'resolved' ? 'resolved' : 'pending',
    solution: String(raw.solution || '').trim(),
    resolvedAt: raw.resolvedAt || null
  };
}

export function filterResolved(stars, color = 'all') {
  return stars
    .filter((star) => star.status === 'resolved' && (color === 'all' || star.color === color))
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

  const save = () => {
    storage.setItem(STORAGE_KEY, JSON.stringify(stars));
    return stars;
  };

  const list = () => stars.map((star) => ({ ...star }));
  const pending = () => list().filter((star) => star.status === 'pending');
  const resolved = () => filterResolved(list(), 'all');

  const add = (input) => {
    const star = normalizeStar({ ...input, id: createId(), status: 'pending', createdAt: new Date().toISOString() });
    if (!star.reason) throw new Error('请先写下生气原因');
    stars.push(star);
    save();
    return { ...star };
  };

  const pickRandomPending = () => {
    const open = pending();
    if (!open.length) return null;
    return open[Math.floor(randomFn() * open.length)];
  };

  const resolve = (id, solution) => {
    const text = String(solution || '').trim();
    if (!text) throw new Error('请写下解决方法');
    const star = stars.find((item) => item.id === id && item.status === 'pending');
    if (!star) throw new Error('没有找到待解决星星');
    star.status = 'resolved';
    star.solution = text;
    star.resolvedAt = new Date().toISOString();
    save();
    return { ...star };
  };

  return { list, pending, resolved, add, pickRandomPending, resolve, save };
}
