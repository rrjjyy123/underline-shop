import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, prefersReducedMotion } from '../store';
import { Paper } from './Paper';
import { IconBag, IconBagFilled } from './Icons';

const INTERVAL = 5000;
const PER = 3;

function BannerCard({ u, no }) {
  const { cartIds, toggleCart } = useApp();
  const ref = useRef(null);
  const inCart = cartIds.has(u.id);
  return (
    <article className="bn-card" ref={ref}>
      <div className="bn-no">NO.{String(no).padStart(2, '0')}</div>
      <Link to={`/u/${u.id}`} className="bn-paper" aria-label={`「${u.bookTitle}」 문장 자세히 보기`}>
        <Paper u={u} variant="hero" />
      </Link>
      <div className="bn-foot">
        <div className="bn-kw">{(u.keywords || []).map((k) => <span key={k}>#{k}</span>)}</div>
        <button className={`cartbtn ${inCart ? 'on' : ''}`} onClick={() => toggleCart(u, ref.current)} aria-pressed={inCart}>
          {inCart ? <IconBagFilled /> : <IconBag />}
          <span>{inCart ? '담음' : '장바구니 담기'}</span>
        </button>
      </div>
    </article>
  );
}

// 오늘의 추천 문장: 데스크톱은 한 번에 3장씩 5초마다, 모바일은 옆으로 넘겨 보기
export default function HeroCarousel({ items }) {
  const [page, setPage] = useState(0);
  const pause = useRef(0);
  const pages = [];
  for (let i = 0; i < items.length; i += PER) pages.push(items.slice(i, i + PER));
  const n = pages.length;

  const go = useCallback((d) => { setPage((p) => (p + d + n) % n); pause.current = Date.now() + 9000; }, [n]);

  useEffect(() => {
    if (n < 2 || prefersReducedMotion()) return;
    const t = setInterval(() => {
      if (document.hidden || pause.current > Date.now()) return;
      setPage((p) => (p + 1) % n);
    }, INTERVAL);
    return () => clearInterval(t);
  }, [n]);

  if (!items.length) return <div className="banner banner-skeleton" aria-hidden />;

  return (
    <section
      className="banner"
      aria-roledescription="carousel"
      aria-label="오늘의 추천 문장"
      onMouseEnter={() => { pause.current = Date.now() + 60000; }}
      onMouseLeave={() => { pause.current = 0; }}
      onFocus={() => { pause.current = Date.now() + 60000; }}
    >
      <div className="bn-head">
        <div>
          <p className="bn-kick">TODAY'S PICK</p>
          <h2>오늘의 추천 문장</h2>
        </div>
        <span className="bn-count"><b>{page + 1}</b> / {n}</span>
      </div>

      {/* 데스크톱: 페이지 단위로 3장씩 */}
      <div className="bn-track">
        {pages.map((pg, i) => (
          <div key={i} className={`bn-slide ${i === page ? 'on' : ''}`} aria-hidden={i !== page}>
            {pg.map((u, k) => <BannerCard key={u.id} u={u} no={i * PER + k + 1} />)}
          </div>
        ))}
      </div>

      {/* 모바일: 한 줄로 옆으로 넘기기 */}
      <div className="bn-scroll">
        {items.map((u, k) => <BannerCard key={u.id} u={u} no={k + 1} />)}
      </div>

      <div className="bn-ctrl">
        <div className="bn-dots" role="tablist" aria-label="추천 묶음">
          {pages.map((_, i) => (
            <button key={i} role="tab" aria-selected={i === page} aria-label={`${i + 1}번째 묶음`} className={i === page ? 'on' : ''} onClick={() => { setPage(i); pause.current = Date.now() + 9000; }} />
          ))}
        </div>
        <div className="bn-arrows">
          <button className="bn-arrow" onClick={() => go(-1)} aria-label="이전 추천">‹</button>
          <button className="bn-arrow" onClick={() => go(1)} aria-label="다음 추천">›</button>
        </div>
      </div>
    </section>
  );
}
