import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store';
import { subscribeBoard } from '../lib/board';
import { BoardCanvas } from '../components/Board';
import { SaveImageButton } from '../components/Moodboard';
import { EmptyState, Masonry, TopBar } from '../components/UI';

// 한 사람의 무드보드 + 그 사람이 올린 밑줄 = 나를 보여 주는 페이지
export default function BoardView() {
  const { uid } = useParams();
  const nav = useNavigate();
  const { user, feed } = useApp();
  const [board, setBoard] = useState(undefined);
  const exportRef = useRef(null);
  const mine = user?.uid === uid;

  useEffect(() => subscribeBoard(uid, setBoard, () => setBoard(null)), [uid]);
  const posts = useMemo(() => (feed ? feed.filter((u) => u.authorId === uid) : null), [feed, uid]);
  const sentenceCount = (board?.items || []).filter((i) => i.type === 'sentence').length;

  if (board === undefined) return <div className="page"><TopBar title="무드보드" /><p className="muted center-pad">보드를 펼치는 중…</p></div>;
  if (!board || (!board.published && !mine)) {
    return (
      <div className="page">
        <TopBar title="무드보드" />
        <EmptyState
          title={mine ? '아직 무드보드가 없어요' : '볼 수 없는 무드보드예요'}
          desc={mine ? '담은 문장으로 나를 표현하는 보드를 만들어 보세요.' : '주인이 비공개로 바꿨거나 아직 만들지 않았어요.'}
          action={mine ? <Link to="/board" className="btn-primary">무드보드 만들기</Link> : <Link to="/boards" className="btn-ghost">갤러리로</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page board-view">
      <TopBar title={`${board.nickname?.split('#')[0] || ''}의 무드보드`} sub={board.published ? '갤러리 공개' : '나만 보기'} />
      <div className="bv-layout">
        <div className="bv-board">
          <BoardCanvas board={board} exportRef={exportRef} onItemClick={(it) => it.u?.id && nav(`/u/${it.u.id}`)} />
        </div>
        <aside className="bv-side">
          <p className="eyebrow">MOODBOARD</p>
          <h1 className="bv-name">{board.nickname?.split('#')[0]}<span>#{board.nickname?.split('#')[1]}</span></h1>
          {board.intro && <p className="bv-intro">“{board.intro}”</p>}
          <p className="muted">붙인 문장 {sentenceCount}개 · 올린 밑줄 {posts?.length ?? 0}개</p>
          <p className="bv-tip">보드의 문장 카드를 누르면 그 문장을 자세히 보고 담을 수 있어요.</p>
          <div className="bv-actions">
            {mine && <Link to="/board" className="btn-primary">보드 꾸미기</Link>}
            <SaveImageButton targetRef={exportRef} filename={`밑줄상점-무드보드-${board.nickname || ''}.png`} />
            <Link to="/boards" className="btn-ghost">다른 무드보드 구경</Link>
          </div>
        </aside>
      </div>

      <section>
        <div className="section-head"><h2>{mine ? '내가 올린 밑줄' : '이 사람이 올린 밑줄'}</h2></div>
        <Masonry items={posts} empty={<EmptyState title="아직 올린 밑줄이 없어요" />} />
      </section>
    </div>
  );
}
