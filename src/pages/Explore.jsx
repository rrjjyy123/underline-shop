import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { COLLECTIONS, KEYWORDS, KEYWORD_LIST } from '../data/keywords';
import { recommendSimilar } from '../lib/taste';
import { ChipBar, Masonry, EmptyState } from '../components/UI';
import { Paper } from '../components/Paper';

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const FOLD = { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' };
export function initialOf(title = '') {
  const c = title.trim().charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) {
    const ch = CHO[Math.floor((c - 0xac00) / 588)];
    return FOLD[ch] || ch;
  }
  return 'A-Z';
}

export default function Explore() {
  const { feed, books, cartItems, cartIds } = useApp();
  const [moods, setMoods] = useState([]);
  const [initial, setInitial] = useState(null);

  const filtered = useMemo(() => {
    if (!feed || !moods.length) return null;
    return feed.filter((u) => moods.every((m) => u.keywords?.includes(m)));
  }, [feed, moods]);

  const forYou = useMemo(() => (feed && cartItems.length ? recommendSimilar(feed, cartItems, cartIds, 8) : []), [feed, cartItems, cartIds]);

  const bookGroups = useMemo(() => {
    const g = {};
    books.forEach((b) => { const k = initialOf(b.title); (g[k] = g[k] || []).push(b); });
    Object.values(g).forEach((l) => l.sort((a, b) => a.title.localeCompare(b.title, 'ko')));
    return g;
  }, [books]);
  const initials = Object.keys(bookGroups).sort((a, b) => a.localeCompare(b, 'ko'));
  const classics = feed ? feed.filter((u) => u.isClassic).slice(0, 10) : [];

  const toggleMood = (t) => setMoods((m) => (m.includes(t) ? m.filter((x) => x !== t) : [...m, t]));
  const countFor = (t) => (feed ? feed.filter((u) => u.keywords?.includes(t) && moods.every((m) => u.keywords?.includes(m))).length : 0);

  return (
    <div className="page explore">
      <header className="page-head">
        <p className="eyebrow">EXPLORE</p>
        <h1>취향으로 둘러보기</h1>
      </header>

      <section>
        <div className="section-head"><h2>분위기 섞어 보기</h2>{moods.length > 0 && <button className="more" onClick={() => setMoods([])}>초기화</button>}</div>
        <div className="mood-grid">
          {KEYWORD_LIST.map((t) => {
            const on = moods.includes(t);
            const n = countFor(t);
            return (
              <button key={t} className={`mood-chip ${on ? 'on' : ''}`} style={{ '--c': KEYWORDS[t].color }} aria-pressed={on} onClick={() => toggleMood(t)} disabled={!on && n === 0}>
                <i aria-hidden />#{t}<small>{on ? '✓' : n}</small>
              </button>
            );
          })}
        </div>
        {filtered && (
          <div className="mt">
            <Masonry items={filtered} empty={<EmptyState title="이 조합의 문장은 아직 없어요" desc="분위기를 하나 빼 볼까요?" />} />
          </div>
        )}
      </section>

      {!filtered && (
        <>
          <section>
            <div className="section-head"><h2>큐레이션</h2></div>
            <div className="collections">
              {COLLECTIONS.map((c, i) => {
                const sample = feed?.find((u) => c.tags.every((t) => u.keywords?.includes(t))) || feed?.find((u) => u.keywords?.includes(c.tags[0]));
                return (
                  <Link key={c.id} to={`/c/${c.id}`} className={`collection-card c${i % 3}`} style={{ '--c': c.tone }}>
                    <div className="col-text">
                      <span className="col-no">No.{String(i + 1).padStart(2, '0')}</span>
                      <h3>{c.title}</h3>
                      <p>{c.sub}</p>
                      <span className="col-tags">{c.tags.map((t) => `#${t}`).join(' ')}</span>
                    </div>
                    {sample && <div className="col-paper"><Paper u={sample} variant="mini" /></div>}
                  </Link>
                );
              })}
            </div>
          </section>

          {forYou.length > 0 && (
            <section>
              <div className="section-head"><h2>내 장바구니와 비슷한 문장</h2></div>
              <Masonry items={forYou} />
            </section>
          )}

          <section>
            <div className="section-head"><h2>고전 문학 컬렉션</h2></div>
            <div className="hscroll">
              {classics.map((u) => (
                <Link key={u.id} to={`/u/${u.id}`} className="rank-card"><Paper u={u} variant="mini" /></Link>
              ))}
            </div>
          </section>

          <section>
            <div className="section-head"><h2>책으로 찾기</h2><span className="date">{books.length}권</span></div>
            <div className="initial-index" role="group" aria-label="초성 색인">
              <button className={!initial ? 'on' : ''} onClick={() => setInitial(null)}>전체</button>
              {initials.map((k) => (
                <button key={k} className={initial === k ? 'on' : ''} onClick={() => setInitial(k)}>{k}</button>
              ))}
            </div>
            <ul className="book-list">
              {(initial ? initials.filter((k) => k === initial) : initials).flatMap((k) => bookGroups[k]).map((b) => (
                <li key={b.id}>
                  <Link to={`/book/${b.id}`}>
                    <span className="book-dot" style={{ background: b.coverColor }} />
                    <span className="bt">{b.title}</span>
                    <span className="ba">{b.author}</span>
                    <span className="bn">밑줄 {b.underlineCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
