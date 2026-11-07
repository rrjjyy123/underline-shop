import { SentenceCard } from './UI';

const BASIS = { today: '오늘 집계', total: '누적 담기', demo: '데모' };

// 순위 숫자는 왼쪽, 카드는 오른쪽. 숫자는 오늘 실제로 담긴 문장에만 붙는다.
export function RankCard({ item }) {
  const { u, rank, basis } = item;
  return (
    <div className={`rk basis-${basis}`}>
      <div className={`rkn ${rank && rank <= 3 ? 't3' : ''} ${rank >= 10 ? 't10' : ''}`} aria-label={rank ? `${rank}위` : '순위 없음'}>
        {rank || '·'}
      </div>
      <div className="rkc">
        <span className={`basis-chip ${basis}`}>{basis === 'demo' && !u.isSeed ? '새 밑줄' : BASIS[basis]}</span>
        <SentenceCard u={u} />
      </div>
    </div>
  );
}

export function TopNotice({ todayCount }) {
  if (todayCount >= 10) return null;
  return (
    <p className="demobar" role="note">
      <span className="demo">{todayCount === 0 ? 'DEMO' : '집계 초기'}</span>
      <span>
        {todayCount === 0
          ? '오늘 담긴 문장이 아직 없어요. 지금 보이는 목록은 순위가 아니라 누적 담기 순과 큐레이션(데모) 문장이에요.'
          : `오늘 담긴 문장은 ${todayCount}개예요. 숫자가 붙은 문장만 오늘의 실제 순위이고, 나머지는 누적 담기 순과 큐레이션(데모) 문장이에요.`}
      </span>
    </p>
  );
}
