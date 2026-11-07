import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, prefersReducedMotion } from '../store';
import { ANALYZE_AT, CART_MAX, analyzeTaste, recommendSimilar } from '../lib/taste';
import { saveMoodboard, saveSetlog, removeFromCart, restoreToCart } from '../lib/db';
import { Paper } from '../components/Paper';
import { EmptyState, Masonry } from '../components/UI';
import { Moodboard, SaveImageButton } from '../components/Moodboard';
import { IconTrash } from '../components/Icons';

const sig = (ids) => [...ids].sort().join(',');
const slim = (u) => ({
  id: u.id, sentence: u.sentence, bookTitle: u.bookTitle, author: u.author, page: u.page,
  font: u.font, ink: u.ink, texture: u.texture, deco: u.deco, keywords: u.keywords,
});
const THINKING = ['담은 문장을 펼쳐 보는 중', '자주 고른 분위기를 세는 중', '어울리는 색을 고르는 중', '무드보드에 붙이는 중'];

export default function Cart() {
  const { user, member, feed, cart, cartItems, cartIds, moodboard, toast } = useApp();
  const [phase, setPhase] = useState('idle'); // idle | analyzing | done
  const [thinkI, setThinkI] = useState(0);
  const boardRef = useRef(null);
  const n = cartItems.length;
  const ready = n >= ANALYZE_AT;
  const currentSig = sig(cartItems.map((u) => u.id));
  const stale = ready && moodboard !== undefined && (!moodboard || sig(moodboard.underlineIds || []) !== currentSig);

  useEffect(() => {
    if (!stale || !user) return;
    const first = !moodboard;
    setPhase('analyzing');
    setThinkI(0);
    const delay = prefersReducedMotion() ? 200 : 2200;
    const tick = setInterval(() => setThinkI((i) => Math.min(i + 1, THINKING.length - 1)), delay / THINKING.length);
    const t = setTimeout(async () => {
      clearInterval(tick);
      const a = analyzeTaste(cartItems);
      const mb = { ...a, items: cartItems.slice(-4).reverse().map(slim), version: (moodboard?.version || 0) + 1 };
      try {
        await saveMoodboard(user.uid, mb);
        if (first) await saveSetlog(user.uid, mb);
      } catch (e) {
        console.error(e);
        toast('무드보드를 저장하지 못했어요');
      }
      setPhase('done');
      if (!first) toast('새로 담은 문장으로 무드보드를 다시 그렸어요');
    }, delay);
    return () => { clearTimeout(t); clearInterval(tick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale, currentSig, user]);

  const recs = useMemo(() => (feed && n ? recommendSimilar(feed, cartItems, cartIds, 6) : []), [feed, cartItems, cartIds, n]);

  const remove = async (u) => {
    await removeFromCart(user.uid, u.id);
    toast('장바구니에서 뺐어요', { label: '되돌리기', run: () => restoreToCart(user.uid, u.id) });
  };

  const keepLog = async () => {
    await saveSetlog(user.uid, moodboard);
    toast('지금의 무드보드를 셋로그에 남겼어요');
  };

  const pct = Math.min(100, (n / ANALYZE_AT) * 100);
  const showBoard = ready && moodboard && !stale && phase !== 'analyzing';
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page cart">
      <header className="page-head">
        <p className="eyebrow">CART</p>
        <h1>나의 문장 장바구니</h1>
      </header>

      <div className={`progress-drawer ${ready ? 'unlocked' : ''}`}>
        <div className="pd-text">
          {ready ? (
            <p><b>취향 분석이 열렸어요</b> · 담은 문장 {n}/{CART_MAX}</p>
          ) : (
            <p>취향 분석까지 <b>{ANALYZE_AT - n}개</b> 남았어요</p>
          )}
        </div>
        <div className="pd-track" role="progressbar" aria-valuemin={0} aria-valuemax={ANALYZE_AT} aria-valuenow={Math.min(n, ANALYZE_AT)}>
          <span className="pd-fill" style={{ width: `${pct}%` }} />
          {Array.from({ length: ANALYZE_AT - 1 }).map((_, i) => <i key={i} style={{ left: `${((i + 1) / ANALYZE_AT) * 100}%` }} />)}
        </div>
      </div>

      {cart.length === 0 && (
        <EmptyState
          title="장바구니가 비어 있어요"
          desc="마음에 드는 문장을 5개 담으면 나만의 취향 무드보드가 만들어져요."
          action={<Link to="/" className="btn-primary">문장 구경하러 가기</Link>}
        />
      )}

      {phase === 'analyzing' && (
        <div className="analyzing" role="status">
          <svg viewBox="0 0 80 80" className="ring" aria-hidden>
            <circle cx="40" cy="40" r="34" className="ring-bg" />
            <circle cx="40" cy="40" r="34" className="ring-fg" />
          </svg>
          <p className="thinking" key={thinkI}>{THINKING[thinkI]}…</p>
          <p className="muted">당신의 밑줄을 읽고 있어요</p>
        </div>
      )}

      {showBoard && (
        <section className="board-wrap">
          <Moodboard ref={boardRef} mb={moodboard} nickname={`${member.nickname}`} dateText={today} />
          <div className="board-actions">
            <SaveImageButton targetRef={boardRef} filename={`밑줄상점-${member.nickname}.png`} />
            <button className="btn-ghost" onClick={keepLog}>셋로그에 남기기</button>
            <Link to="/board" className="btn-ghost board-link">이 취향으로 내 무드보드 꾸미기 →</Link>
          </div>
        </section>
      )}

      {cartItems.length > 0 && (
        <section>
          <div className="section-head"><h2>담은 문장 {n}</h2><span className="date">최대 {CART_MAX}개</span></div>
          <ul className="cart-list">
            {[...cartItems].reverse().map((u) => (
              <li key={u.id} className="cart-item">
                <Link to={`/u/${u.id}`} className="ci-paper"><Paper u={u} variant="mini" /></Link>
                <div className="ci-info">
                  <p className="ci-sentence">{u.sentence}</p>
                  <p className="ci-src">「{u.bookTitle}」 {u.author}</p>
                  <p className="ci-tags">{(u.keywords || []).map((k) => `#${k}`).join(' ')}</p>
                </div>
                <button className="icon-btn" aria-label="장바구니에서 빼기" onClick={() => remove(u)}><IconTrash /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recs.length > 0 && (
        <section>
          <div className="section-head"><h2>{ready ? '이 취향이라면 이런 문장도' : '이런 문장은 어때요?'}</h2></div>
          <Masonry items={recs} />
        </section>
      )}
    </div>
  );
}
