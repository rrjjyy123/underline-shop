import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { subscribeSetlogs, deleteSetlog } from '../lib/db';
import { EmptyState, Masonry } from '../components/UI';
import { Moodboard, SaveImageButton } from '../components/Moodboard';
import { Paper } from '../components/Paper';

const TABS = [
  { id: 'posts', label: 'MY POSTS' },
  { id: 'collection', label: 'COLLECTION' },
  { id: 'setlogs', label: 'SETLOGS' },
];

export default function Drawer() {
  const { user, member, feed, byId, drawer, toast } = useApp();
  const [tab, setTab] = useState('posts');
  const [setlogs, setSetlogs] = useState(null);
  const [open, setOpen] = useState(null);
  const [view, setView] = useState('grid');
  const boardRef = useRef(null);

  useEffect(() => (user ? subscribeSetlogs(user.uid, setSetlogs) : undefined), [user]);

  const posts = useMemo(() => (feed ? feed.filter((u) => u.authorId === user?.uid) : null), [feed, user]);
  const collected = useMemo(() => {
    const list = [...drawer].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    return list.map((d) => byId.get(d.id)).filter(Boolean);
  }, [drawer, byId]);
  const totalCollected = posts ? posts.reduce((s, u) => s + (u.cartCount || 0), 0) : 0;
  const idx = TABS.findIndex((t) => t.id === tab);

  const fmt = (ts) => (ts?.toDate ? ts.toDate().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '방금');

  return (
    <div className="page drawer">
      <header className="page-head">
        <p className="eyebrow">MY DRAWER</p>
        <h1>{member.nickname}의 문장 서랍</h1>
        <p className="muted">#{member.tag} · 올린 밑줄 {posts?.length ?? 0} · 내 밑줄이 담긴 횟수 {totalCollected}</p>
      </header>

      <div className="drawer-board-links">
        <Link to="/board" className="btn-primary">내 무드보드 꾸미기</Link>
        {user && <Link to={`/b/${user.uid}`} className="btn-ghost">내 보드 페이지</Link>}
      </div>

      <div className="ul-tabs" role="tablist" style={{ '--i': idx, '--n': TABS.length }}>
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setOpen(null); }}>{t.label}</button>
        ))}
        <span className="ul-ink" aria-hidden />
      </div>

      {tab === 'posts' && (
        posts && posts.length === 0 ? (
          <EmptyState title="아직 올린 밑줄이 없어요" desc="읽다가 멈춘 문장이 있다면 진열해 보세요." action={<Link to="/post" className="btn-primary">밑줄 올리기</Link>} />
        ) : (
          <>
            {posts?.some((u) => u.cartCount > 0) && (
              <p className="notice">내 밑줄이 친구들 장바구니에 <b>{totalCollected}번</b> 담겼어요.</p>
            )}
            <Masonry items={posts} />
          </>
        )
      )}

      {tab === 'collection' && (
        collected.length === 0 ? (
          <EmptyState title="아직 담은 문장이 없어요" desc="한 번이라도 담은 문장은 장바구니에서 빼도 여기 남아요." action={<Link to="/" className="btn-primary">둘러보기</Link>} />
        ) : (
          <>
            <div className="row-between view-toggle">
              <span className="muted">지금까지 담은 문장 {collected.length}</span>
              <div className="mini-seg">
                <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>그리드</button>
                <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>목록</button>
              </div>
            </div>
            {view === 'grid' ? <Masonry items={collected} /> : (
              <ul className="cart-list">
                {collected.map((u) => (
                  <li key={u.id} className="cart-item">
                    <Link to={`/u/${u.id}`} className="ci-paper"><Paper u={u} variant="mini" /></Link>
                    <div className="ci-info">
                      <p className="ci-sentence">{u.sentence}</p>
                      <p className="ci-src">「{u.bookTitle}」 {u.author}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )
      )}

      {tab === 'setlogs' && (
        !setlogs ? null : setlogs.length === 0 ? (
          <EmptyState title="아직 셋로그가 없어요" desc="장바구니에 문장 5개를 담으면 첫 무드보드가 셋로그에 남아요." action={<Link to="/cart" className="btn-primary">장바구니로</Link>} />
        ) : (
          <ol className="timeline">
            {setlogs.map((s) => (
              <li key={s.id} className={open === s.id ? 'open' : ''}>
                <span className="tl-dot" aria-hidden style={{ background: s.snapshot?.palette?.[0]?.hex }} />
                <button className="tl-head" onClick={() => setOpen((o) => (o === s.id ? null : s.id))} aria-expanded={open === s.id}>
                  <span className="tl-date">{fmt(s.createdAt)}</span>
                  <span className="tl-title">‘{s.title}’</span>
                  <span className="tl-tags">{(s.snapshot?.keywords || []).slice(0, 3).map((k) => `#${k}`).join(' ')}</span>
                </button>
                {open === s.id && s.snapshot && (
                  <div className="tl-body">
                    <Moodboard ref={boardRef} mb={s.snapshot} nickname={member.nickname} dateText={fmt(s.createdAt)} />
                    <div className="board-actions">
                      <SaveImageButton targetRef={boardRef} filename={`밑줄상점-셋로그-${fmt(s.createdAt)}.png`} />
                      <button className="btn-ghost" onClick={async () => { await deleteSetlog(s.id); toast('셋로그를 지웠어요'); }}>지우기</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )
      )}
    </div>
  );
}
