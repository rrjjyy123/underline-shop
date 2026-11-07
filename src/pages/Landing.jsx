import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../store';

// 첫 화면: 밤의 상점 외관 → 불이 켜지고 → 간판이 빛나고 → 밑줄 → 슬로건 → 들어가기
export default function Landing({ onEntered }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [phase, setPhase] = useState('dark'); // dark | slogan | ready | entering
  const [webgl, setWebgl] = useState(true);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    let disposed = false;
    let ro;
    const timers = [];
    (async () => {
      try {
        await Promise.race([
          document.fonts?.load("600 112px 'Noto Serif KR'", '밑줄상점'),
          new Promise((r) => setTimeout(r, 1200)),
        ]);
        const { createStorefront } = await import('../three/storefront.js');
        if (disposed) return;
        const s = createStorefront(canvasRef.current, { reducedMotion: reduced });
        sceneRef.current = s;
        const fit = () => s.resize(window.innerWidth, window.innerHeight);
        fit();
        ro = new ResizeObserver(fit);
        ro.observe(document.body);
        s.start();
      } catch (e) {
        console.warn('WebGL unavailable', e);
        setWebgl(false);
      }
      const d = reduced ? 0 : 1;
      timers.push(setTimeout(() => !disposed && setPhase('slogan'), 2300 * d));
      timers.push(setTimeout(() => !disposed && setPhase('ready'), 2900 * d));
    })();
    return () => {
      disposed = true;
      timers.forEach(clearTimeout);
      ro?.disconnect();
      sceneRef.current?.dispose();
    };
  }, [reduced]);

  const skip = () => {
    if (phase === 'dark' || phase === 'slogan') {
      sceneRef.current?.skipIntro();
      setPhase('ready');
    }
  };

  const enter = () => {
    if (phase === 'entering') return;
    setPhase('entering');
    sceneRef.current?.enter();
    setTimeout(onEntered, reduced ? 250 : 1250);
  };

  return (
    <div className={`landing phase-${phase} ${webgl ? '' : 'no-webgl'}`} onClick={skip}>
      <canvas ref={canvasRef} className="landing-canvas" aria-hidden />
      <div className="landing-overlay">
        <h1 className="sr-only">밑줄상점</h1>
        <p className="landing-slogan">
          <span>패션을 쇼핑하듯,</span>
          <span>문장을 쇼핑하다.</span>
        </p>
        <button
          className="enter-btn"
          onClick={(e) => { e.stopPropagation(); enter(); }}
          disabled={phase === 'entering'}
          tabIndex={phase === 'ready' || phase === 'slogan' ? 0 : -1}
        >
          <span className="enter-label">상점 들어가기</span>
        </button>
      </div>
      <div className="warm-flood" aria-hidden />
    </div>
  );
}
