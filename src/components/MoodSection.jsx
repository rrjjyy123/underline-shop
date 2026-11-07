import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { ANALYZE_AT, analyzeTaste } from '../lib/taste';
import { Moodboard, MoodboardEmpty, SaveImageButton } from './Moodboard';

const sig = (ids) => [...ids].sort().join(',');

// 장바구니 문장으로 만든 지금의 무드보드 (저장된 분석이 같으면 그대로, 다르면 바로 다시 계산)
export function useMyMood() {
  const { cartItems, moodboard } = useApp();
  return useMemo(() => {
    if (cartItems.length < ANALYZE_AT) return { items: cartItems, mb: null };
    const s = sig(cartItems.map((u) => u.id));
    if (moodboard && sig(moodboard.underlineIds || []) === s) return { items: cartItems, mb: moodboard };
    return { items: cartItems, mb: { ...analyzeTaste(cartItems), version: (moodboard?.version || 0) + 1 } };
  }, [cartItems, moodboard]);
}

export default function MoodSection({ full = false }) {
  const { member } = useApp();
  const { items, mb } = useMyMood();
  const ref = useRef(null);
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <section id="mymood" className="mood-section">
      <div className="sec2">
        <h2>내 무드보드</h2>
        <span className="sub">{full ? '장바구니 문장으로 만든 나의 취향 보드' : '담은 문장이 곧 나의 취향이에요'}</span>
        {!full && <Link className="more" to="/mood">크게 보기 ›</Link>}
      </div>
      {!mb ? (
        <MoodboardEmpty count={items.length} need={ANALYZE_AT} />
      ) : (
        <>
          <Moodboard ref={ref} mb={mb} items={[...items].reverse()} nickname={member.nickname} dateText={today} />
          <div className="mbacts">
            <SaveImageButton targetRef={ref} filename={`밑줄상점-무드보드-${member.nickname}.png`} />
            <Link className="btn-ghost" to="/cart">장바구니에서 수정</Link>
            <Link className="btn-ghost" to="/board">자유 배치로 꾸미기</Link>
          </div>
          <p className="note center">규칙 기반 취향 분석 · 담은 문장의 분위기 키워드로 만들어요</p>
        </>
      )}
    </section>
  );
}
