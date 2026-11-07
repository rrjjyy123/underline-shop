import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { HOME_TAGS, KEYWORDS } from '../data/keywords';
import { buildTop, heroPicks } from '../lib/rank';
import HeroCarousel from '../components/HeroCarousel';
import { RankCard, TopNotice } from '../components/TopList';
import { EmptyState, Masonry } from '../components/UI';

export function sortFeed(list, sort) {
  const arr = [...list];
  if (sort === 'hot') arr.sort((a, b) => (b.cartCount || 0) - (a.cartCount || 0) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return arr;
}

const FEED_TABS = [
  { id: 'new', label: '최신 문장' },
  { id: 'hot', label: '인기 문장' },
  { id: 'mood', label: '분위기별' },
  { id: 'people', label: '친구들의 밑줄' },
];

export default function Home() {
  const { feed, books } = useApp();
  const loc = useLocation();
  const [tab, setTab] = useState(loc.state?.tag ? 'mood' : 'new');
  const [mood, setMood] = useState(loc.state?.tag || HOME_TAGS[0]);

  const picks = useMemo(() => heroPicks(feed), [feed]);
  const top = useMemo(() => buildTop(feed, 10), [feed]);
  const shelf = useMemo(() => [...books].sort((a, b) => b.underlineCount - a.underlineCount).slice(0, 14), [books]);

  const list = useMemo(() => {
    if (!feed) return null;
    if (tab === 'hot') return sortFeed(feed, 'hot');
    if (tab === 'mood') return feed.filter((u) => u.keywords?.includes(mood));
    if (tab === 'people') return feed.filter((u) => !u.isSeed);
    return feed;
  }, [feed, tab, mood]);

  return (
    <div className="page home">
      <HeroCarousel items={picks} />

      <section className="corner-row" aria-label="분위기 코너">
        {HOME_TAGS.map((t) => (
          <button key={t} className="corner" style={{ '--c': KEYWORDS[t].color }} onClick={() => { setTab('mood'); setMood(t); document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' }); }}>
            <span className="corner-dot">#{t}</span>
          </button>
        ))}
      </section>

      <section className="top-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">BEST SELLER</p>
            <h2>오늘의 문장 TOP 100</h2>
          </div>
          <Link to="/top" className="more">전체 보기</Link>
        </div>
        <TopNotice todayCount={top.todayCount} />
        <div className="top-rail">
          {(top.items || []).map((it) => <RankCard key={it.u.id} item={it} />)}
        </div>
      </section>

      {shelf.length > 0 && (
        <section>
          <div className="section-head">
            <div>
              <p className="eyebrow">BOOKSHELF</p>
              <h2>책 진열대</h2>
            </div>
            <Link to="/explore" className="more">전체 보기</Link>
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

      <section id="feed" className="feed-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">FOR YOU</p>
            <h2>추천 문장</h2>
          </div>
        </div>
        <div className="feed-tabs" role="tablist" aria-label="추천 문장 보기">
          {FEED_TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {tab === 'mood' && (
          <div className="chipbar" role="group" aria-label="분위기 고르기">
            {HOME_TAGS.map((t) => (
              <button key={t} className={`chip ${mood === t ? 'on' : ''}`} aria-pressed={mood === t} onClick={() => setMood(t)}>#{t}</button>
            ))}
          </div>
        )}
        <Masonry
          items={list}
          empty={
            <EmptyState
              title={tab === 'people' ? '아직 친구들이 올린 밑줄이 없어요' : '맞는 문장이 없어요'}
              desc={tab === 'people' ? '첫 번째 밑줄의 주인공이 되어 볼까요?' : '다른 분위기를 골라 보세요.'}
              action={tab === 'people' ? <Link to="/post" className="btn-primary">밑줄 올리기</Link> : null}
            />
          }
        />
      </section>
    </div>
  );
}
