import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { Paper } from './Paper';
import { IconBag, IconBagFilled } from './Icons';

const BASIS = { today: '오늘', total: '누적', demo: '데모' };

export function RankCard({ item, compact = false }) {
  const { cartIds, toggleCart } = useApp();
  const ref = useRef(null);
  const { u, rank, basis, count } = item;
  const inCart = cartIds.has(u.id);
  return (
    <article className={`rank-item basis-${basis} ${compact ? 'compact' : ''}`} ref={ref}>
      {rank && <div className="rank-no" aria-label={`${rank}위`}>{rank}</div>}
      <Link to={`/u/${u.id}`} className="rank-paper">
        <Paper u={u} variant="rank" />
      </Link>
      <div className="rank-foot">
        <span className={`basis-chip ${basis}`}>{basis === 'demo' && !u.isSeed ? '새 밑줄' : BASIS[basis]}</span>
        <span className="rank-count">{basis === 'demo' ? '아직 담김 없음' : `담김 ${count}`}</span>
        <button className={`bag-btn ${inCart ? 'on' : ''}`} aria-pressed={inCart} aria-label={inCart ? '장바구니에서 빼기' : '장바구니에 담기'} onClick={() => toggleCart(u, ref.current)}>
          {inCart ? <IconBagFilled /> : <IconBag />}
        </button>
      </div>
    </article>
  );
}

export function TopNotice({ todayCount }) {
  if (todayCount >= 10) return null;
  return (
    <p className="top-notice" role="note">
      <b>집계 초기</b>
      {todayCount === 0
        ? '오늘 담긴 문장이 아직 없어요. 지금 보이는 문장은 순위가 아니라 누적 담기 순과 큐레이션(데모) 문장이에요.'
        : `오늘 담긴 문장은 ${todayCount}개예요. 숫자가 붙은 문장만 오늘의 실제 순위이고, 나머지는 누적 담기 순과 큐레이션(데모) 문장이에요.`}
    </p>
  );
}
