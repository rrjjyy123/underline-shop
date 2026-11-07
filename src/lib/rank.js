import { todayKey } from './db';

// 오늘의 TOP 100: 오늘(한국 시간) 처음 담긴 횟수 기준.
// 오늘 기록이 부족하면 순위를 지어내지 않고, 누적 담기 순 / 큐레이션(데모)으로 구분해서 채운다.
export function buildTop(feed, max = 100) {
  if (!feed) return { items: null, todayCount: 0 };
  const today = todayKey();
  const todayList = feed
    .filter((u) => u.dayKey === today && (u.dayCount || 0) > 0)
    .sort((a, b) => b.dayCount - a.dayCount || (b.cartCount || 0) - (a.cartCount || 0));
  const items = todayList.map((u, i) => ({ u, rank: i + 1, basis: 'today', count: u.dayCount }));
  const used = new Set(todayList.map((u) => u.id));

  if (items.length < max) {
    feed
      .filter((u) => !used.has(u.id) && (u.cartCount || 0) > 0)
      .sort((a, b) => b.cartCount - a.cartCount)
      .forEach((u) => { if (items.length < max) { items.push({ u, rank: null, basis: 'total', count: u.cartCount }); used.add(u.id); } });
  }
  if (items.length < max) {
    feed
      .filter((u) => !used.has(u.id))
      .forEach((u) => { if (items.length < max) items.push({ u, rank: null, basis: 'demo', count: 0 }); });
  }
  return { items, todayCount: todayList.length };
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// 오늘의 추천 배너: 날짜마다 바뀌는 6개 (같은 책이 겹치지 않게)
export function heroPicks(feed, n = 9) {
  if (!feed?.length) return [];
  const day = todayKey();
  const sorted = [...feed].sort((a, b) => hash(a.id + day) - hash(b.id + day));
  const books = new Set();
  const out = [];
  for (const u of sorted) {
    if (books.has(u.bookId)) continue;
    if (u.sentence.length > 90) continue;
    books.add(u.bookId);
    out.push(u);
    if (out.length === n) break;
  }
  return out;
}
