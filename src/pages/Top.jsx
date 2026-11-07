import { useMemo } from 'react';
import { useApp } from '../store';
import { buildTop } from '../lib/rank';
import { RankCard, TopNotice } from '../components/TopList';
import { SkeletonGrid } from '../components/UI';

export default function Top() {
  const { feed } = useApp();
  const top = useMemo(() => buildTop(feed, 100), [feed]);
  const date = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  return (
    <div className="page top-page">
      <header className="page-head">
        <p className="eyebrow">BEST SELLER · {date}</p>
        <h1>오늘의 문장 TOP 100</h1>
        <p className="muted">오늘(한국 시간) 처음 장바구니에 담긴 횟수로 순위를 매겨요. 자정에 새로 시작해요.</p>
      </header>
      <TopNotice todayCount={top.todayCount} />
      {!top.items ? <SkeletonGrid /> : (
        <div className="top-grid">
          {top.items.map((it) => <RankCard key={it.u.id} item={it} />)}
        </div>
      )}
    </div>
  );
}
