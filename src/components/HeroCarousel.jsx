import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, prefersReducedMotion } from '../store';
import { KEYWORDS } from '../data/keywords';
import { Paper } from './Paper';
import { IconBag, IconBagFilled, IconBack } from './Icons';

const INTERVAL = 6000;

export default function HeroCarousel({ items }) {
  const { cartIds, toggleCart } = useApp();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(null);
  const paperRef = useRef(null);
  const n = items.length;

  const go = useCallback((d) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (paused || n < 2 || prefersReducedMotion()) return;
    const t = setTimeout(() => go(1), INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, n, go]);

  if (!n) return <div className="hero hero-skeleton" aria-hidden />;
  const u = items[i];
  const inCart = cartIds.has(u.id);
  const tone = KEYWORDS[u.keywords?.[0]]?.color || '#c9a27e';

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="오늘의 추천 문장"
      style={{ '--tone': tone }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setPaused(false);
      }}
    >
      <div className="hero-glow" aria-hidden />
      <div className="hero-inner">
        <div className="hero-paper" key={u.id} ref={paperRef}>
          <Link to={`/u/${u.id}`} aria-label="문장 자세히 보기">
            <Paper u={u} variant="hero" />
          </Link>
        </div>
        <div className="hero-meta" key={`m-${u.id}`}>
          <p className="hero-kicker">TODAY'S PICK <b>{String(i + 1).padStart(2, '0')}</b><span> / {String(n).padStart(2, '0')}</span></p>
          <h2 className="hero-book">「{u.bookTitle}」</h2>
          <p className="hero-author">{u.author}{u.isClassic ? ' · 고전' : ''}</p>
          {u.reason && <p className="hero-reason">“{u.reason}”</p>}
          <p className="hero-tags">{(u.keywords || []).map((k) => `#${k}`).join('  ')}</p>
          <div className="hero-actions">
            <button className={`btn-primary hero-cart ${inCart ? 'in' : ''}`} onClick={() => toggleCart(u, paperRef.current)} aria-pressed={inCart}>
              {inCart ? <IconBagFilled /> : <IconBag />}
              {inCart ? '담았어요' : '장바구니 담기'}
            </button>
            <Link to={`/u/${u.id}`} className="btn-ghost hero-more">자세히</Link>
          </div>
        </div>
      </div>

      <button className="hero-arrow prev" onClick={() => go(-1)} aria-label="이전 문장"><IconBack /></button>
      <button className="hero-arrow next" onClick={() => go(1)} aria-label="다음 문장"><IconBack /></button>
      <div className="hero-dots" role="tablist" aria-label="문장 선택">
        {items.map((x, k) => (
          <button key={x.id} role="tab" aria-selected={k === i} aria-label={`${k + 1}번째 문장`} onClick={() => setI(k)}>
            {k === i && !paused && <span className="dot-fill" style={{ animationDuration: `${INTERVAL}ms` }} />}
          </button>
        ))}
      </div>
    </section>
  );
}
