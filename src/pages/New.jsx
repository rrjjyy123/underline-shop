import { useState } from 'react';
import { useApp } from '../store';
import { EmptyState, Masonry } from '../components/UI';

export default function New() {
  const { feed } = useApp();
  const [dense, setDense] = useState(true);
  return (
    <div className="page new-page">
      <div className="sec2 first">
        <h2>신상 문장</h2>
        <span className="sub">방금 진열된 순서 · {feed?.length ?? 0}개</span>
        <button className="viewtog only-m" onClick={() => setDense((d) => !d)}>{dense ? '1열로 보기' : '2열로 보기'}</button>
      </div>
      <Masonry items={feed} dense={dense} empty={<EmptyState title="아직 진열된 문장이 없어요" />} />
    </div>
  );
}
