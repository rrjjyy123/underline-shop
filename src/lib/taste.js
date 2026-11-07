// 규칙 기반 취향 분석 (나중에 AI 호출로 바꿀 자리: analyzeTaste 한 함수만 교체하면 된다)
import { KEYWORDS, fontById, textureLabel } from '../data/keywords';

export const ANALYZE_AT = 5;
export const CART_MAX = 12;

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const mostCommon = (arr) => {
  const m = {};
  arr.forEach((x) => { if (x) m[x] = (m[x] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0];
};

const TITLE_FORMS = [
  (a, b) => `${KEYWORDS[b].adj} ${KEYWORDS[a].obj} 수집하는 사람`,
  (a, b) => `${KEYWORDS[a].obj} 밑줄 긋는 ${KEYWORDS[b].adj} 사람`,
  (a, b) => `${KEYWORDS[b].adj} 문장 사이에서 ${KEYWORDS[a].obj} 찾는 사람`,
];

export function analyzeTaste(items) {
  const weights = {};
  items.forEach((u, idx) => {
    (u.keywords || []).forEach((k, i) => {
      if (!KEYWORDS[k]) return;
      // 앞에 붙은 키워드일수록, 최근에 담은 문장일수록 조금 더 무겁게
      weights[k] = (weights[k] || 0) + (3 - i) + idx * 0.05;
    });
  });
  const ranked = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((s, [, w]) => s + w, 0) || 1;
  const top = ranked.map(([k]) => k);
  const k1 = top[0] || '사유';
  const k2 = top[1] || k1;
  const seed = hashStr(items.map((u) => u.id).sort().join(','));

  const classicCount = items.filter((u) => u.isClassic).length;
  const classicRatio = classicCount / items.length;
  const books = new Set(items.map((u) => u.bookId));

  let title = TITLE_FORMS[seed % TITLE_FORMS.length](k1, k2);
  if (k1 === k2) title = `${KEYWORDS[k1].obj} 오래 붙드는 사람`;
  if (classicRatio > 0.2 && classicRatio < 0.8 && seed % 4 === 0) title = '고전과 요즘 사이를 걷는 사람';

  let bookLine;
  if (classicRatio >= 0.8) bookLine = '오래된 책 속에서 지금의 나를 발견하는 편이에요.';
  else if (classicRatio <= 0.2) bookLine = '요즘의 언어로 쓰인 문장에 더 빨리 반응해요.';
  else bookLine = '고전과 요즘 책을 가리지 않고 마음 가는 대로 골라요.';

  const summary = `당신은 ${KEYWORDS[k1].line} 사람이에요. ${k2 !== k1 ? `${KEYWORDS[k2].adj} 문장도 자주 눈에 담고요. ` : ''}${bookLine}`;

  const font = mostCommon(items.map((u) => u.font)) || 'myeongjo';
  const texture = mostCommon(items.map((u) => u.texture)) || 'cream';

  const palette = top.slice(0, 3).map((k) => ({ hex: KEYWORDS[k].color, name: KEYWORDS[k].name }));
  palette.push({ hex: '#f3ecdc', name: 'Ivory' });

  return {
    title,
    keywords: top.slice(0, 5),
    summary,
    palette,
    moods: ranked.slice(0, 4).map(([k, w]) => ({ k, pct: Math.round((w / total) * 100) })),
    font,
    fontLabel: fontById(font).label,
    texture,
    textureLabel: textureLabel(texture),
    bookCount: books.size,
    classicCount,
    underlineIds: items.map((u) => u.id),
    count: items.length,
  };
}

// 담은 문장과 키워드가 겹치는(하지만 아직 안 담은) 문장 추천
export function recommendSimilar(feed, cartItems, excludeIds, n = 6) {
  const weight = {};
  cartItems.forEach((u) => (u.keywords || []).forEach((k, i) => { weight[k] = (weight[k] || 0) + (3 - i); }));
  const books = new Set(cartItems.map((u) => u.bookId));
  return feed
    .filter((u) => !excludeIds.has(u.id))
    .map((u) => ({
      u,
      s: (u.keywords || []).reduce((acc, k) => acc + (weight[k] || 0), 0) + (books.has(u.bookId) ? 0.5 : 0) + (u.cartCount || 0) * 0.05,
    }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.u);
}

// 같은 키워드(첫 키워드 우선)의 다른 문장
export function sameMood(feed, u, n = 6) {
  const ks = u.keywords || [];
  return feed
    .filter((x) => x.id !== u.id)
    .map((x) => ({ x, s: (x.keywords || []).reduce((a, k) => a + (ks.includes(k) ? (k === ks[0] ? 2 : 1) : 0), 0) }))
    .filter((o) => o.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((o) => o.x);
}

// 오늘의 추천 문장: 날짜로 고정
export function todaysPick(feed) {
  if (!feed.length) return null;
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  return feed[hashStr(key) % feed.length];
}
