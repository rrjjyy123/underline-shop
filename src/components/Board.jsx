import { forwardRef, useEffect, useRef, useState } from 'react';
import { BW, BH, BASE_W, bgById } from '../lib/board';
import { fontById } from '../data/keywords';
import { Paper } from './Paper';

// ── 스티커 모양 (직접 그린 SVG) ──
export function Sticker({ shape, color = '#e3a83c' }) {
  const c = color;
  const common = { viewBox: '0 0 100 100', width: '100%', height: '100%', 'aria-hidden': true };
  switch (shape) {
    case 'star': return <svg {...common}><path d="M50 6 61 37h33L67 56l10 32-27-19-27 19 10-32L6 37h33z" fill={c} stroke="#00000022" strokeWidth="2" /></svg>;
    case 'heart': return <svg {...common}><path d="M50 88S10 62 10 35c0-13 10-23 22-23 8 0 14 4 18 11 4-7 10-11 18-11 12 0 22 10 22 23 0 27-40 53-40 53z" fill={c} /></svg>;
    case 'flower': return <svg {...common}>{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="50" cy="27" rx="15" ry="23" fill={c} transform={`rotate(${r} 50 50)`} opacity=".9" />)}<circle cx="50" cy="50" r="12" fill="#f6d77a" /></svg>;
    case 'moon': return <svg {...common}><path d="M68 10a42 42 0 1 0 22 62A34 34 0 0 1 68 10z" fill={c} /></svg>;
    case 'sparkle': return <svg {...common}><path d="M50 4c4 28 18 42 46 46-28 4-42 18-46 46-4-28-18-42-46-46 28-4 42-18 46-46z" fill={c} /></svg>;
    case 'leaf': return <svg {...common}><path d="M14 86C14 40 44 12 90 12c0 46-28 76-76 74z" fill={c} /><path d="M18 82 70 30" stroke="#00000033" strokeWidth="3" /></svg>;
    case 'cloud': return <svg {...common}><path d="M26 76a18 18 0 0 1-2-36 24 24 0 0 1 46-6 18 18 0 0 1 8 35z" fill={c} /></svg>;
    case 'arrow': return <svg {...common}><path d="M10 70C30 30 60 24 80 34" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round" /><path d="M66 20 84 35 64 46" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'stamp': return <svg {...common}><circle cx="50" cy="50" r="42" fill="none" stroke={c} strokeWidth="5" strokeDasharray="4 3" /><circle cx="50" cy="50" r="32" fill="none" stroke={c} strokeWidth="3" /><text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="700" fill={c} fontFamily="serif">MY</text><text x="50" y="64" textAnchor="middle" fontSize="15" fontWeight="700" fill={c} fontFamily="serif">PICK</text></svg>;
    case 'bookmark': return <svg {...common}><path d="M28 6h44v88L50 72 28 94z" fill={c} /></svg>;
    case 'sun': return <svg {...common}>{Array.from({ length: 12 }).map((_, i) => <rect key={i} x="48" y="4" width="4" height="16" rx="2" fill={c} transform={`rotate(${i * 30} 50 50)`} />)}<circle cx="50" cy="50" r="22" fill={c} /></svg>;
    case 'pin': return <svg {...common}><circle cx="50" cy="34" r="22" fill={c} /><circle cx="43" cy="27" r="6" fill="#ffffff66" /><path d="M50 56v36" stroke="#5a5048" strokeWidth="4" strokeLinecap="round" /></svg>;
    default: return null;
  }
}

// ── 요소 하나의 생김새 ──
export function ItemBody({ item }) {
  switch (item.type) {
    case 'sentence':
      return <div style={{ width: BASE_W.sentence }}><Paper u={item.u} variant="board" /></div>;
    case 'note': {
      const f = fontById(item.font);
      return (
        <p className={`b-note ${item.font === 'pen' ? 'is-pen' : ''}`} style={{ width: BASE_W.note, fontFamily: f.family, color: item.color }}>
          {item.text || '여기에 한 줄을 써 보세요'}
        </p>
      );
    }
    case 'title': {
      const f = fontById(item.font);
      return (
        <h2 className={`b-title ${item.font === 'pen' ? 'is-pen' : ''}`} style={{ width: BASE_W.title, fontFamily: f.family, color: item.color }}>
          {item.text || '무드보드 제목'}
        </h2>
      );
    }
    case 'keyword':
      return <span className="b-keyword" style={{ '--c': item.color }}>#{item.word}</span>;
    case 'swatch':
      return (
        <div className="b-swatch" style={{ width: BASE_W.swatch }}>
          <i style={{ background: item.color }} />
          <span>{item.name || item.color}</span>
        </div>
      );
    case 'sticker':
      return <div style={{ width: BASE_W.sticker, height: BASE_W.sticker }}><Sticker shape={item.shape} color={item.color} /></div>;
    case 'tape':
      return <div className="b-tape" style={{ width: BASE_W.tape, background: item.color }} />;
    case 'block':
      return <div className={`b-block tex-${item.texture || 'cream'}`} style={{ width: BASE_W.block, height: BASE_W.block * 1.2, background: item.color || undefined }} />;
    default:
      return null;
  }
}

// 부모 너비에 맞춰 보드를 줄이는 비율
export function useFitScale(ref) {
  const [s, setS] = useState(0.3);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setS(e.contentRect.width / BW));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return s;
}

// ── 보드 (읽기 전용 또는 편집) ──
export const BoardCanvas = forwardRef(function BoardCanvas(
  { board, editable = false, selected, onSelect, onChange, onItemClick, exportRef },
  _ref,
) {
  const wrapRef = useRef(null);
  const scale = useFitScale(wrapRef);
  const drag = useRef(null);
  const bg = bgById(board.bg);
  const items = [...(board.items || [])].sort((a, b) => a.z - b.z);

  const toLogical = (dx, dy) => [dx / scale, dy / scale];

  const startMove = (e, item) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect?.(item.id);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 캡처 불가 포인터 */ }
    drag.current = { mode: 'move', id: item.id, sx: e.clientX, sy: e.clientY, ox: item.x, oy: item.y, moved: false };
  };

  const startTransform = (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = rect.left + item.x * scale;
    const cy = rect.top + item.y * scale;
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    const d0 = Math.hypot(e.clientX - cx, e.clientY - cy);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 캡처 불가 포인터 */ }
    drag.current = { mode: 'xf', id: item.id, cx, cy, a0, d0, rot0: item.rot, sc0: item.scale };
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    if (d.mode === 'move') {
      const [dx, dy] = toLogical(e.clientX - d.sx, e.clientY - d.sy);
      if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
      onChange?.(d.id, {
        x: Math.round(Math.min(BW + 60, Math.max(-60, d.ox + dx))),
        y: Math.round(Math.min(BH + 60, Math.max(-60, d.oy + dy))),
      }, true);
    } else {
      const a = Math.atan2(e.clientY - d.cy, e.clientX - d.cx);
      const dist = Math.hypot(e.clientX - d.cx, e.clientY - d.cy);
      let rot = d.rot0 + ((a - d.a0) * 180) / Math.PI;
      // 0도 근처에서는 살짝 붙게
      const snap = Math.round(rot / 90) * 90;
      if (Math.abs(rot - snap) < 3) rot = snap;
      const sc = Math.min(4, Math.max(0.3, d.sc0 * (dist / Math.max(d.d0, 1))));
      onChange?.(d.id, { rot: Math.round(rot * 10) / 10, scale: Math.round(sc * 100) / 100 }, true);
    }
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d) onChange?.(d.id, {}, false); // 끝났을 때 저장
  };

  return (
    <div
      className={`board-fit ${editable ? 'editable' : ''}`}
      ref={wrapRef}
      style={{ height: BH * scale }}
      onPointerDown={() => editable && onSelect?.(null)}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        className={`board ${bg.css} ${bg.dark ? 'is-dark' : ''}`}
        ref={exportRef}
        style={{ width: BW, height: BH, transform: `scale(${scale})` }}
      >
        {items.map((it) => {
          const sel = editable && selected === it.id;
          return (
            <div
              key={it.id}
              className={`b-item t-${it.type} ${sel ? 'sel' : ''} ${onItemClick && it.type === 'sentence' ? 'clickable' : ''}`}
              style={{
                left: it.x, top: it.y, zIndex: it.z,
                transform: `translate(-50%, -50%) rotate(${it.rot}deg) scale(${it.scale})`,
                '--inv': 1 / (scale * it.scale),
              }}
              onPointerDown={(e) => startMove(e, it)}
              onClick={() => { if (!editable && onItemClick) onItemClick(it); }}
            >
              <ItemBody item={it} />
              {sel && (
                <>
                  <span className="b-outline" aria-hidden />
                  <button
                    type="button"
                    className="b-handle"
                    aria-label="돌리기·크기 조절"
                    onPointerDown={(e) => startTransform(e, it)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </>
              )}
            </div>
          );
        })}
        {board.showSign !== false && <span className="board-sign">밑줄상점</span>}
      </div>
    </div>
  );
});
