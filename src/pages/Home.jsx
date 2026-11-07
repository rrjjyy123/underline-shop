import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { COLLECTIONS } from '../data/keywords';
import { buildTop, heroPicks } from '../lib/rank';
import { recommendSimilar } from '../lib/taste';
import HeroCarousel from '../components/HeroCarousel';
import { RankCard, TopNotice } from '../components/TopList';
import MoodSection from '../components/MoodSection';
import { EmptyState, Masonry } from '../components/UI';
import { BoardTile, useBoards } from './Boards';

export function sortFeed(list, sort) {
  const arr = [...list];
  if (sort === 'hot') arr.sort((a, b) => (b.cartCount || 0) - (a.cartCount || 0) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return arr;
}

// 분위기 바로가기 (조용한 동그라미 타일)
const TILES = [
  ['위로', '♡'], ['고요', '☾'], ['용기', '✦'], ['청춘', '✿'], ['고독', '☾'],
  ['자유', '✦'], ['사랑', '♡'], ['성장', '✿'], ['그리움', '☾'], ['희망', '✦'],
];

const FEED_TABS = [
  { id: 'new', label: '최신 문장' },
  { id: 'hot', label: '인기 문장' },
  { id: 'mood', label: '분위기별 추천' },
  { id: 'people', label: '다양한 사용자' },
];

export default function Home() {
  const { feed, books, cartItems, cartIds } = useApp();
  const loc = useLocation();
  const [tab, setTab] = useState('new');
  const [tag, setTag] = useState(loc.state?.tag || '');
  const [similar, setSimilar] = useState(false);
  const [dense, setDense] = useState(true);
  const boards = useBoards();

  const picks = useMemo(() => heroPicks(feed), [feed]);
  const top = useMemo(() => buildTop(feed, 10), [feed]);
  const shelf = useMemo(() => [...books].sort((a, b) => b.underlineCount - a.underlineCount).slice(0, 14), [books]);
  const filtering = !!tag || similar;

  const filtered = useMemo(() => {
    if (!feed) return null;
    let l = sortFeed(feed, tab === 'hot' ? 'hot' : 'new');
    if (tag) l = l.filter((u) => u.keywords?.includes(tag));
    if (similar) {
      const sim = new Set(recommendSimilar(feed, cartItems, cartIds, 200).map((u) => u.id));
      l = l.filter((u) => sim.has(u.id));
    }
    return l;
  }, [feed, tab, tag, similar, cartItems, cartIds]);

  // 다양한 사용자: 사람별로 묶은 뒤 한 장씩 번갈아 섞는다
  const people = useMemo(() => {
    if (!feed) return { strip: [], list: null };
    const by = new Map();
    feed.forEach((u) => {
      const key = u.authorId;
      if (!by.has(key)) by.set(key, { name: u.isSeed ? '큐레이션' : (u.nickname || '').split('#')[0], uid: u.isSeed ? null : u.authorId, items: [] });
      by.get(key).items.push(u);
    });
    const groups = [...by.values()].sort((a, b) => b.items.length - a.items.length);
    const out = [];
    const max = Math.max(0, ...groups.map((g) => g.items.length));
    for (let i = 0; i < max; i++) groups.forEach((g) => { if (g.items[i]) out.push(g.items[i]); });
    return { strip: groups, list: out };
  }, [feed]);

  const moodRows = useMemo(() => (feed ? COLLECTIONS.map((c) => ({
    c,
    items: sortFeed(feed.filter((u) => c.tags.some((t) => u.keywords?.includes(t))), 'hot').slice(0, 4),
  })).filter((r) => r.items.length) : []), [feed]);

  const pickTile = (t) => {
    setTag((cur) => (cur === t ? '' : t));
    setTimeout(() => document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' }), 30);
  };

  return (
    <div className="page home">
      <HeroCarousel items={picks} />

      <nav className="tiles" aria-label="분위기 바로가기">
        {TILES.map(([t, g]) => (
          <button key={t} className={`tile ${tag === t ? 'on' : ''}`} aria-pressed={tag === t} onClick={() => pickTile(t)}>
            <i aria-hidden>{g}</i>#{t}
          </button>
        ))}
      </nav>

      {!filtering && (
        <>
          <section className="top-section">
            <div className="sec2">
              <h2>오늘의 문장 TOP 100</h2>
              <span className="sub">오늘 처음 담긴 수 기준</span>
              <Link className="more" to="/top">전체 보기 ›</Link>
            </div>
            <TopNotice todayCount={top.todayCount} />
            <div className="ranks">
              {(top.items || []).map((it) => <RankCard key={it.u.id} item={it} />)}
            </div>
          </section>

          <MoodSection />

          <section className="boards-home">
            <div className="sec2">
              <h2>문장으로 나를 표현한 무드보드</h2>
              <span className="sub">친구들이 자유롭게 꾸민 보드</span>
              <Link to="/boards" className="more">갤러리 보기 ›</Link>
            </div>
            <div className="board-rail">
              <Link to="/board" className="board-cta">
                <span className="cta-plus" aria-hidden>＋</span>
                <b>내 무드보드 꾸미기</b>
                <span>담은 문장, 한 줄 소개, 색과 스티커로 나를 한 장에</span>
              </Link>
              {(boards || []).slice(0, 6).map((b) => <BoardTile key={b.id} b={b} />)}
            </div>
          </section>

          {shelf.length > 0 && (
            <section>
              <div className="sec2">
                <h2>책 진열대</h2>
                <span className="sub">밑줄이 많이 그어진 책</span>
                <Link to="/explore" className="more">전체 보기 ›</Link>
              </div>
              <div className="shelf">
                {shelf.map((b) => (
                  <Link key={b.id} to={`/book/${b.id}`} className="spine" style={{ '--c': b.coverColor }}>
                    <span className="spine-title">{b.title}</span>
                    <span className="spine-count">{b.underlineCount}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section id="feed" className="feed-section">
        <div className="sec2">
          <h2>추천 문장 피드</h2>
          <span className="sub">둘러보고, 마음에 들면 담아요</span>
        </div>
        <div className="feedbar">
          <div className="ftabs" role="tablist" aria-label="피드 보기">
            {FEED_TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <div className="fright">
            <label className={`check ${cartItems.length === 0 ? 'disabled' : ''}`} title={cartItems.length === 0 ? '장바구니에 문장을 담으면 쓸 수 있어요' : ''}>
              <input type="checkbox" checked={similar} disabled={cartItems.length === 0} onChange={(e) => setSimilar(e.target.checked)} />
              <span className="box" aria-hidden />
              나와 비슷한 취향
            </label>
            <button className="viewtog only-m" onClick={() => setDense((d) => !d)}>{dense ? '1열로 보기' : '2열로 보기'}</button>
          </div>
        </div>

        {filtering && (
          <p className="filt">
            <span><b>{filtered?.length ?? 0}</b>개 · {[tag && `#${tag}`, similar && '나와 비슷한 취향'].filter(Boolean).join(' · ')}</span>
            <button className="btn-ghost small" onClick={() => { setTag(''); setSimilar(false); }}>필터 해제 ✕</button>
          </p>
        )}

        {(filtering || tab === 'new' || tab === 'hot') && (
          <Masonry items={filtered} dense={dense} empty={<EmptyState title="조건에 맞는 문장이 아직 없어요" desc="첫 번째 밑줄을 올려 볼까요?" action={<Link to="/post" className="btn-primary">밑줄 올리기</Link>} />} />
        )}

        {!filtering && tab === 'mood' && moodRows.map(({ c, items }) => (
          <div className="moodrow" key={c.id}>
            <div className="mh">
              <h3>{c.title}</h3>
              <Link className="more" to={`/c/${c.id}`}>더 보기 ›</Link>
            </div>
            <Masonry items={items} dense={dense} />
          </div>
        ))}

        {!filtering && tab === 'people' && (
          <>
            <div className="ustrip">
              {people.strip.map((g) => {
                const body = (
                  <>
                    <span className="av2">{g.name.slice(0, 1)}</span>
                    <div><b>{g.name}</b><small>문장 {g.items.length}개</small></div>
                  </>
                );
                return g.uid ? <Link key={g.name + g.uid} to={`/b/${g.uid}`} className="ucard2">{body}</Link> : <div key="seed" className="ucard2">{body}</div>;
              })}
            </div>
            <Masonry items={people.list} dense={dense} />
          </>
        )}
      </section>

      <footer className="foot">
        밑줄상점 · 패션을 쇼핑하듯, 문장을 쇼핑하다.<br />
        큐레이션 문장은 저작권 보호 기간이 끝난 작품에서 골랐어요. 외국·한문 작품은 밑줄상점이 직접 옮겼어요.
      </footer>
    </div>
  );
}
