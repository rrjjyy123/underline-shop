import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { subscribePublishedBoards } from '../lib/board';
import { BoardCanvas } from '../components/Board';
import { EmptyState } from '../components/UI';

export function BoardTile({ b }) {
  const name = b.nickname?.split('#')[0] || '';
  return (
    <Link to={`/b/${b.memberId || b.id}`} className="board-tile">
      <div className="bt-board"><BoardCanvas board={{ ...b, showSign: false }} /></div>
      <div className="bt-meta">
        <span className="avatar sm">{name.slice(0, 1)}</span>
        <div>
          <b>{name}</b>
          {b.intro && <p>{b.intro}</p>}
        </div>
      </div>
    </Link>
  );
}

export function useBoards() {
  const [boards, setBoards] = useState(null);
  useEffect(() => subscribePublishedBoards(setBoards), []);
  return boards;
}

export default function Boards() {
  const { user } = useApp();
  const boards = useBoards();
  return (
    <div className="page boards-page">
      <header className="page-head row-between">
        <div>
          <p className="eyebrow">MOODBOARD GALLERY</p>
          <h1>무드보드 갤러리</h1>
          <p className="muted">문장으로 자기를 표현한 친구들의 보드예요.</p>
        </div>
        <Link to="/board" className="btn-primary">내 보드 꾸미기</Link>
      </header>
      {!boards ? <p className="muted center-pad">보드를 거는 중…</p> : boards.length === 0 ? (
        <EmptyState title="아직 공개된 무드보드가 없어요" desc="첫 번째 보드를 걸어 볼까요?" action={<Link to="/board" className="btn-primary">무드보드 만들기</Link>} />
      ) : (
        <div className="board-grid">
          {boards.map((b) => <BoardTile key={b.id} b={b} />)}
        </div>
      )}
      {user && boards && !boards.some((b) => b.id === user.uid) && boards.length > 0 && (
        <p className="muted center-pad">내 보드는 아직 갤러리에 없어요. 보드 화면에서 “갤러리에 공개”를 켜면 여기 걸려요.</p>
      )}
    </div>
  );
}
