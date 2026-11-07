import { forwardRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { KEYWORDS, fontById } from '../data/keywords';
import { Paper } from './Paper';
import { IconDownload, IconCheck } from './Icons';

export const Moodboard = forwardRef(function Moodboard({ mb, nickname, dateText }, ref) {
  const font = fontById(mb.font);
  const collage = (mb.items || []).slice(0, 4);
  return (
    <div className="moodboard" ref={ref}>
      <header className="mb-head">
        <p className="mb-eyebrow">YOUR TEXT TASTE</p>
        <h2 className="mb-title">‘{mb.title}’</h2>
        <p className="mb-by">{nickname} · {dateText}</p>
      </header>

      <section className="mb-cell mb-keywords">
        <h3>KEYWORDS</h3>
        <div className="mb-labels">
          {mb.keywords.map((k, i) => (
            <span key={k} className="torn" style={{ '--c': KEYWORDS[k]?.color, '--r': `${(i % 2 ? 1 : -1) * (2 + i)}deg` }}>#{k}</span>
          ))}
        </div>
      </section>

      <section className="mb-cell mb-summary">
        <h3>TASTE NOTE</h3>
        <p>“{mb.summary}”</p>
      </section>

      <section className="mb-cell mb-color">
        <h3>COLOR</h3>
        <div className="mb-swatches">
          {mb.palette.map((c) => (
            <div key={c.hex} className="mb-swatch">
              <i style={{ background: c.hex }} />
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-cell mb-mood">
        <h3>MOOD</h3>
        <div className="mb-bar" role="img" aria-label={mb.moods.map((m) => `${m.k} ${m.pct}%`).join(', ')}>
          {mb.moods.map((m) => (
            <span key={m.k} style={{ flexGrow: m.pct, background: KEYWORDS[m.k]?.color }} />
          ))}
        </div>
        <ul className="mb-legend">
          {mb.moods.map((m) => (
            <li key={m.k}><i style={{ background: KEYWORDS[m.k]?.color }} />{m.k} <b>{m.pct}%</b></li>
          ))}
        </ul>
      </section>

      <section className="mb-cell mb-type">
        <h3>TYPOGRAPHY</h3>
        <div className="mb-type-body">
          <span className="mb-ga" style={{ fontFamily: font.family }}>가</span>
          <div>
            <b>{font.label}체</b>
            <p style={{ fontFamily: font.family }}>가나다라마바사<br />ABCDEFG 1234567</p>
          </div>
        </div>
      </section>

      <section className="mb-cell mb-texture">
        <span className={`mb-tex-fill tex-${mb.texture}`} aria-hidden />
        <h3>TEXTURE</h3>
        <span className="mb-tex-name">{mb.textureLabel}</span>
      </section>

      <section className="mb-cell mb-collage">
        <h3>MY UNDERLINES</h3>
        <div className="fan">
          {collage.map((u, i) => (
            <div key={u.id || i} className="fan-item" style={{ '--i': i, '--n': collage.length }}>
              <Paper u={u} variant="mini" />
            </div>
          ))}
        </div>
      </section>

      <footer className="mb-foot">
        <span>밑줄상점</span>
        <span>문장 {mb.count}개 · 책 {mb.bookCount}권{mb.classicCount ? ` · 고전 ${mb.classicCount}` : ''}</span>
      </footer>
    </div>
  );
});

export function SaveImageButton({ targetRef, filename }) {
  const [state, setState] = useState('idle');
  const save = async () => {
    if (!targetRef.current || state === 'busy') return;
    setState('busy');
    try {
      await document.fonts?.ready;
      const url = await toPng(targetRef.current, { pixelRatio: 2, backgroundColor: '#f5f0e6', preferredFontFormat: 'woff2' });
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setState('done');
      setTimeout(() => setState('idle'), 2200);
    } catch (e) {
      console.error(e);
      setState('error');
      setTimeout(() => setState('idle'), 2500);
    }
  };
  return (
    <button className={`btn-primary save-btn ${state}`} onClick={save} disabled={state === 'busy'}>
      {state === 'done' ? <IconCheck /> : <IconDownload />}
      {state === 'busy' ? '이미지 만드는 중…' : state === 'done' ? '저장했어요' : state === 'error' ? '다시 시도해 주세요' : '이미지로 저장'}
      {state === 'busy' && <span className="save-progress" aria-hidden />}
    </button>
  );
}
