import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { fontById, TEXTURES } from '../data/keywords';
import { IconDownload, IconCheck } from './Icons';

// 사진 대신 팔레트 색으로 만든 '장면' 배경
function photoStyle(hex, i) {
  const light = [
    'radial-gradient(circle at 30% 30%, #ffffff99 0, transparent 40%)',
    'radial-gradient(ellipse at 70% 80%, #00000033, transparent 60%)',
    'linear-gradient(160deg, #ffffff66 0, transparent 50%)',
  ][i % 3];
  return { background: `${light}, linear-gradient(${120 + i * 40}deg, color-mix(in srgb, ${hex} 80%, #fff), color-mix(in srgb, ${hex} 55%, #3a2e22))` };
}
const cut = (s = '', n) => ([...s].length > n ? `${[...s].slice(0, n).join('')}…` : s);

// 나의 텍스트 무드보드 (IMAGE · COLOR · TYPOGRAPHY · TEXTURE · KEYWORD)
export const Moodboard = forwardRef(function Moodboard({ mb, items, nickname, dateText }, ref) {
  const font = fontById(mb.font);
  const pics = (items && items.length ? items : mb.items || []).slice(0, 3);
  const sample = pics[0]?.sentence || '';
  const pal = (mb.palette || []).slice(0, 5);
  return (
    <div className="mbx" ref={ref}>
      <i className="tp" style={{ top: -10, right: '14%', '--r': '4deg' }} aria-hidden />
      <header className="mbx-h">
        <div>
          <p className="mbx-k">MY TEXT MOODBOARD · v{mb.version || 1}</p>
          <h3 className="mbx-t">{mb.title}</h3>
        </div>
        <p className="mbx-d">
          {mb.summary}
          <span>{nickname} · 문장 {mb.count}개 · 책 {mb.bookCount}권 · {dateText}</span>
        </p>
      </header>

      <div className="mbx-g">
        <section className="bx bx-img">
          <p className="bl">IMAGE</p>
          <small>내가 고른 문장의 장면</small>
          <div className="phs">
            {pics.map((u, i) => {
              const body = (
                <>
                  <blockquote style={{ fontFamily: fontById(u.font).family }}>{cut(u.sentence, 38)}</blockquote>
                  <figcaption>「{u.bookTitle}」</figcaption>
                </>
              );
              const st = photoStyle(pal[i % Math.max(1, pal.length)]?.hex || '#c9a27e', i);
              return u.id ? (
                <Link key={u.id} to={`/u/${u.id}`} className={`ph ph${i}`} style={st}>{body}</Link>
              ) : (
                <figure key={i} className={`ph ph${i}`} style={st}>{body}</figure>
              );
            })}
            <i className="tp" style={{ left: '40%', top: '46%', '--r': '-8deg' }} aria-hidden />
          </div>
        </section>

        <section className="bx bx-col">
          <p className="bl">COLOR</p>
          <small>전체 인상을 결정하는 색</small>
          <div className="mbsw">
            {pal.map((p) => (
              <div key={p.hex}>
                <i style={{ background: p.hex }} />
                <b>{p.name}</b>
                <code>{p.hex}</code>
              </div>
            ))}
          </div>
          <div className="grad" style={{ background: `linear-gradient(90deg, ${pal.map((p) => p.hex).join(', ')})` }} />
        </section>

        <section className="bx bx-typo">
          <p className="bl">TYPOGRAPHY</p>
          <small>나의 문장에 어울리는 글꼴</small>
          <div className="ty">
            <p style={{ fontFamily: font.family }}>{cut(sample, 26)}</p>
            <div className="gl">
              <b style={{ fontFamily: font.family }}>가</b>
              <span style={{ fontFamily: font.family }}>가나다라마바사<br />ABCDEFG abcdefg<br />{font.label}체</span>
            </div>
          </div>
        </section>

        <section className="bx bx-tex">
          <p className="bl">TEXTURE</p>
          <small>질감과 패턴</small>
          <div className="txs">
            {TEXTURES.map((t) => (
              <div key={t.id} className={`tw tex-${t.id} ${mb.texture === t.id ? 'on' : ''}`}>
                <span>{t.label}{mb.texture === t.id ? ' ✓' : ''}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bx bx-kw">
          <p className="bl">KEYWORD</p>
          <small>나를 설명하는 단어</small>
          <div className="kws">
            {(mb.keywords || []).map((k, i) => <span key={k} style={{ '--r': `${[-4, 3, -2, 5, -3][i % 5]}deg` }}>#{k}</span>)}
          </div>
        </section>
      </div>

      <footer className="mbx-f">밑줄상점 · 패션을 쇼핑하듯, 문장을 쇼핑하다.</footer>
    </div>
  );
});

// 아직 5개를 못 모았을 때
export function MoodboardEmpty({ count, need = 5 }) {
  return (
    <div className="mbempty">
      <div className="mbe-l">
        <p className="mbe-k">MY MOODBOARD</p>
        <h3>문장 {need}개를 담으면<br />나만의 무드보드가 완성돼요</h3>
        <div className="mbe-bar"><i style={{ width: `${Math.min(100, (count / need) * 100)}%` }} /></div>
        <p>{count} / {need}개 담음</p>
        <div className="row-gap">
          <Link className="btn-primary" to="/top">문장 쇼핑하러 가기</Link>
          <Link className="btn-ghost" to="/explore">취향으로 둘러보기</Link>
        </div>
      </div>
      <div className="mbe-r" aria-hidden>
        {['IMAGE', 'COLOR', 'TYPOGRAPHY', 'TEXTURE', 'KEYWORD'].map((t) => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

export function SaveImageButton({ targetRef, filename, className = 'btn-primary' }) {
  const [state, setState] = useState('idle');
  const save = async () => {
    if (!targetRef.current || state === 'busy') return;
    setState('busy');
    try {
      await document.fonts?.ready;
      const url = await toPng(targetRef.current, { pixelRatio: 2, backgroundColor: '#ffffff', preferredFontFormat: 'woff2' });
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
    <button className={`${className} save-btn ${state}`} onClick={save} disabled={state === 'busy'}>
      {state === 'done' ? <IconCheck /> : <IconDownload />}
      {state === 'busy' ? '이미지 만드는 중…' : state === 'done' ? '저장했어요' : state === 'error' ? '다시 시도해 주세요' : '이미지로 저장'}
      {state === 'busy' && <span className="save-progress" aria-hidden />}
    </button>
  );
}
