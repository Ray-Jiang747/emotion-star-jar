export const EMOTIONS = Object.freeze([
  { id: 'happy', label: '开心', color: 'yellow' },
  { id: 'calm', label: '平静', color: 'mint' },
  { id: 'sad', label: '难过', color: 'blue' },
  { id: 'anxious', label: '焦虑', color: 'purple' },
  { id: 'wronged', label: '委屈', color: 'pink' },
  { id: 'angry', label: '生气', color: 'coral' },
  { id: 'other', label: '其他', color: 'lavender' }
]);

const emotionMap = new Map(EMOTIONS.map((emotion) => [emotion.id, emotion]));

export const getEmotion = (id) => emotionMap.get(id) || emotionMap.get('angry');
export const getEmotionLabel = (star = {}) => star.emotion === 'other' && String(star.customEmotion || '').trim()
  ? String(star.customEmotion).trim()
  : getEmotion(star.emotion).label;
