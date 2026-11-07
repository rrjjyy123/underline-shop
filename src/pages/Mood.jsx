import { Link } from 'react-router-dom';
import { useApp } from '../store';
import MoodSection from '../components/MoodSection';
import { BoardTile, useBoards } from './Boards';

export default function Mood() {
  const { user } = useApp();
  const boards = useBoards();
  const mine = boards?.find((b) => b.id === user?.uid);
  return (
    <div className="page mood-page">
      <MoodSection full />
      <section>
        <div className="sec2">
          <h2>자유 배치 무드보드</h2>
          <span className="sub">문장·글·색·스티커를 마음대로 붙여 나를 표현해요</span>
          <Link className="more" to="/boards">갤러리 ›</Link>
        </div>
        <div className="board-rail">
          <Link to="/board" className="board-cta">
            <span className="cta-plus" aria-hidden>＋</span>
            <b>{mine ? '내 보드 이어서 꾸미기' : '내 무드보드 꾸미기'}</b>
            <span>담은 문장, 한 줄 소개, 색과 스티커로 나를 한 장에</span>
          </Link>
          {mine && <BoardTile b={mine} />}
        </div>
      </section>
    </div>
  );
}
