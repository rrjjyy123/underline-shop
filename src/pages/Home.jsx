import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { HOME_TAGS } from '../data/keywords';
import { todaysPick } from '../lib/taste';
import { Paper } from '../components/Paper';
import { ChipBar, EmptyState, Masonry, Segmented } from '../components/UI';
import { IconClose, IconSearch } from '../components/Icons';

const SORTS = [
  { value: 'new', label: '최신순' },
  { value: 'hot', label: '많이 담긴 순' },
];

export function sortFeed(list, sort) {
  const arr = [...list];
  if (sort === 'hot') arr.sort((a, b) => (b.cartCount || 0) - (a.cartCount || 0) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return arr;
}

export default function Home() {
  const { feed, books, member } = useApp();
  const loc = useLocation();
  const [tag, setTag] = useState(loc.state?.tag || null);
  const [sort, setSort] = useState('new');
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const pick = useMemo(() => (feed ? todaysPick(feed) : null), [feed]);
  const hot = useMemo(() => (feed ? sortFeed(feed, 'hot').filter((u) => (u.cartCount || 0) > 0).slice(0, 8) : []), [feed]);
  const shelf = useMemo(() => [...books].sort((a, b) => (b.underlineCount || 0) - (a.underlineCount || 0)).slice(0, 12), [books]);

  const list = useMemo(() => {
    if (!feed) return null;
    let l = feed;
    if (tag) l = l.filter((u) => u.keywords?.includes(tag));
    const s = q.trim();
    if (s) l = l.filter((u) => `${u.sentence} ${u.bookTitle} ${u.author} ${u.nickname}`.includes(s));
    return sortFeed(l, sort);
  }, [feed, tag, sort, q]);

  const filtering = !!tag || !!q.trim();

  return (
    <div className="page home">
      <header className="home-head">
        <div className="brand">
          <h1 className="logo">밑줄<span>상점</span></h1>
          <p className="hello">{member.nickname}님, 오늘은 어떤 문장을 담을까요?</p>
        </div>
        <button className="icon-btn" aria-label={searchOpen ? '검색 닫기' : '검색 열기'} onClick={() => { setSearchOpen((o) => !o); setQ(''); }}>
          {searchOpen ? <IconClose /> : <IconSearch />}
        </button>
      </header>

      {searchOpen && (
        <div className="search-row">
          <IconSearch />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="문장, 책 제목, 저자로 찾기" aria-label="검색어" />
        </div>
      )}

      <ChipBar tags={HOME_TAGS} active={tag} onToggle={(t) => setTag((cur) => (cur === t ? null : t))} />

      {!filtering && pick && (
        <section className="today">
          <div className="section-head">
            <h2>오늘의 추천 문장</h2>
            <span className="date">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
          </div>
          <Link to={`/u/${pick.id}`} className="today-card">
            <Paper u={pick} variant="hero" />
          </Link>
        </section>
      )}

      {!filtering && hot.length > 0 && (
        <section>
          <div className="section-head"><h2>지금 많이 담기는 밑줄</h2></div>
          <div className="hscroll">
            {hot.map((u, i) => (
              <Link key={u.id} to={`/u/${u.id}`} className="rank-card">
                <span className="rank">{i + 1}</span>
                <Paper u={u} variant="mini" />
                <span className="rank-meta">담김 {u.cartCount}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!filtering && shelf.length > 0 && (
        <section>
          <div className="section-head">
            <h2>책 진열대</h2>
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

      <section>
        <div className="section-head feed-head">
          <h2>{tag ? `#${tag}` : q.trim() ? `"${q.trim()}" 검색 결과` : '모든 밑줄'}</h2>
          <Segmented value={sort} options={SORTS} onChange={setSort} label="정렬" />
        </div>
        <Masonry
          items={list}
          empty={
            <EmptyState
              title="맞는 문장이 없어요"
              desc="필터를 풀고 다시 둘러볼까요?"
              action={<button className="btn-ghost" onClick={() => { setTag(null); setQ(''); }}>필터 풀기</button>}
            />
          }
        />
      </section>
    </div>
  );
}
