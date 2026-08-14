export function createStarLayout(total) {
  const count = Math.max(0, Math.min(42, Number(total) || 0));
  if (!count) return [];
  let seed = (0x9e3779b9 ^ count) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const minimumGap = count > 30 ? 9 : count > 18 ? 11 : 14;
  const placed = [];

  for (let index = 0; index < count; index += 1) {
    let best = null;
    let bestDistance = -1;
    for (let attempt = 0; attempt < 420; attempt += 1) {
      const candidate = {
        x: 9 + random() * 82,
        y: index === 0 ? 8 + random() * 7 : index === 1 ? 70 + random() * 8 : 8 + random() * 70
      };
      const nearest = placed.length
        ? Math.min(...placed.map((star) => Math.hypot(candidate.x - star.x, candidate.y - star.y)))
        : Infinity;
      if (nearest > bestDistance) {
        best = candidate;
        bestDistance = nearest;
      }
      if (nearest >= minimumGap) break;
    }
    placed.push({
      ...best,
      size: (count > 24 ? 40 : 48) + Math.round(random() * 13),
      rotate: -22 + Math.round(random() * 44),
      duration: 3 + random() * 1.8,
      depth: 10 + Math.round(random() * 28)
    });
  }

  return placed;
}
