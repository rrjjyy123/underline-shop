import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import {
  BACKGROUNDS, MAX_ITEMS, NOTE_COLORS, STICKERS, autoBoard, emptyBoard, makeItem,
  saveBoard, slimUnderline, subscribeBoard,
} from '../lib/board';
import { analyzeTaste } from '../lib/taste';
import { FONTS, KEYWORDS, KEYWORD_LIST } from '../data/keywords';
import { checkText } from '../lib/guard';
import { BoardCanvas, Sticker } from '../components/Board';
import { SaveImageButton } from '../components/Moodboard';
import { Paper } from '../components/Paper';
import { TopBar } from '../components/UI';
import { IconTrash, IconCopy } from '../components/Icons';

const TABS = [
  { id: 'sentence', label: '문장' },
  { id: 'text', label: '글' },
  { id: 'keyword', label: '키워드' },
  { id: 'color', label: '색' },
  { id: 'sticker', label: '스티커' },
  { id: 'bg', label: '배경' },
];
const STICKER_COLORS = ['#e3a83c', '#b5525c', '#7f9bb3', '#6f8f5e', '#9c8fb5', '#c0583a', '#1d1b18', '#fffaf0'];

export default function BoardEdit() {
  const { user, member, cartItems, drawer, byId, moodboard, toast } = useApp();
  const [board, setBoard] = useState(undefined); // undefined: 불러오는 중, null: 아직 없음
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('sentence');
  const [saveState, setSaveState] = useState('saved');
  const [stickerColor, setStickerColor] = useState(STICKER_COLORS[0]);
  const [draftText, setDraftText] = useState('');
  const exportRef = useRef(null);
  const loaded = useRef(false);
  const saveTimer = useRef(null);
  const latest = useRef(null);

  // 처음 한 번만 서버 값을 가져온다 (편집 중 덮어쓰기 방지)
  useEffect(() => {
    if (!user) return;
    return subscribeBoard(user.uid, (b) => {
      if (loaded.current) return;
      loaded.current = true;
      setBoard(b);
    }, () => { loaded.current = true; setBoard(null); });
  }, [user]);

  const persist = useCallback((b) => {
    latest.current = b;
    setSaveState('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveBoard(user.uid, member, latest.current);
        setSaveState('saved');
      } catch (e) {
        console.error(e);
        setSaveState('error');
      }
    }, 700);
  }, [user, member]);

  useEffect(() => () => {
    // 화면을 떠날 때 저장 대기 중인 것은 바로 저장
    if (saveTimer.current && latest.current && user) {
      clearTimeout(saveTimer.current);
      saveBoard(user.uid, member, latest.current).catch(() => {});
    }
  }, [user, member]);

  const update = useCallback((fn, save = true) => {
    setBoard((b) => {
      const next = fn(b);
      if (save) persist(next);
      return next;
    });
  }, [persist]);

  const start = (mode) => {
    const pool = cartItems.length ? cartItems : collected;
    const base = mode === 'auto'
      ? autoBoard({ analysis: pool.length ? analyzeTaste(pool) : moodboard, items: pool, nickname: member.nickname })
      : emptyBoard(member.nickname);
    const b = { ...base, intro: '', published: false };
    setBoard(b);
    persist(b);
  };

  const collected = useMemo(
    () => [...drawer].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).map((d) => byId.get(d.id)).filter(Boolean),
    [drawer, byId],
  );
  const sentencePool = useMemo(() => {
    const seen = new Set();
    return [...cartItems, ...collected].filter((u) => (seen.has(u.id) ? false : seen.add(u.id)));
  }, [cartItems, collected]);

  const topZ = () => Math.max(0, ...(board?.items || []).map((i) => i.z)) + 1;
  const add = (type, payload, at = {}) => {
    if ((board?.items || []).length >= MAX_ITEMS) return toast(`요소는 ${MAX_ITEMS}개까지 붙일 수 있어요`);
    const it = makeItem(type, payload, { z: topZ(), ...at });
    update((b) => ({ ...b, items: [...b.items, it] }));
    setSelected(it.id);
    if (type === 'note' || type === 'title') setTab('text');
  };

  const sel = board?.items?.find((i) => i.id === selected);
  useEffect(() => { setDraftText(sel && (sel.type === 'note' || sel.type === 'title') ? sel.text : ''); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchItem = (id, patch, save = true) => update((b) => ({ ...b, items: b.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }), save);
  const onCanvasChange = (id, patch, dragging) => {
    if (dragging) patchItem(id, patch, false);
    else update((b) => b, true); // 드래그 끝: 저장
  };
  const remove = () => { update((b) => ({ ...b, items: b.items.filter((i) => i.id !== selected) })); setSelected(null); };
  const duplicate = () => {
    if (!sel) return;
    const { id: _id, type, x, y, rot, scale, z: _z, ...payload } = sel;
    add(type, payload, { x: x + 40, y: y + 40, rot, scale });
  };
  const layer = (dir) => {
    if (!sel) return;
    const zs = board.items.map((i) => i.z);
    patchItem(sel.id, { z: dir > 0 ? Math.max(...zs) + 1 : Math.min(...zs) - 1 });
  };
  const nudge = (patch) => sel && patchItem(sel.id, patch(sel));

  const applyText = () => {
    if (!sel) return;
    const bad = checkText(draftText);
    if (bad) return toast(bad);
    patchItem(sel.id, { text: draftText.slice(0, sel.type === 'title' ? 30 : 80) });
  };

  if (board === undefined) return <div className="page"><TopBar title="내 무드보드" /><p className="muted center-pad">보드를 펼치는 중…</p></div>;

  if (board === null) {
    return (
      <div className="page board-start">
        <TopBar title="내 무드보드" />
        <div className="start-card">
          <p className="eyebrow">MY MOODBOARD</p>
          <h1>나를 표현하는 무드보드</h1>
          <p className="lead">담은 문장, 내가 쓴 한 줄, 좋아하는 색과 분위기를 한 장에 붙여 보세요. 완성하면 친구들에게 보여 줄 수 있어요.</p>
          <div className="start-options">
            <button className="start-opt" onClick={() => start('auto')} disabled={!sentencePool.length}>
              <b>내 취향으로 시작</b>
              <span>{sentencePool.length ? `담은 문장 ${Math.min(4, sentencePool.length)}개와 취향 분석으로 초안을 붙여 줘요` : '문장을 하나 이상 담으면 쓸 수 있어요'}</span>
            </button>
            <button className="start-opt" onClick={() => start('empty')}>
              <b>빈 보드에서 시작</b>
              <span>제목만 붙은 빈 보드에 하나씩 직접 붙여요</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page board-edit">
      <TopBar
        title="내 무드보드"
        sub={saveState === 'saving' ? '저장 중…' : saveState === 'error' ? '저장하지 못했어요' : '자동 저장됨'}
        right={user && <Link to={`/b/${user.uid}`} className="btn-ghost small">미리 보기</Link>}
      />

      <div className="be-layout">
        <div className="be-stage">
          <BoardCanvas
            board={board}
            editable
            selected={selected}
            onSelect={setSelected}
            onChange={onCanvasChange}
            exportRef={exportRef}
          />
          {sel ? (
            <div className="sel-bar" role="toolbar" aria-label="선택한 요소">
              <button onClick={() => nudge((s) => ({ scale: Math.max(0.3, +(s.scale - 0.1).toFixed(2)) }))} aria-label="작게">－</button>
              <button onClick={() => nudge((s) => ({ scale: Math.min(4, +(s.scale + 0.1).toFixed(2)) }))} aria-label="크게">＋</button>
              <button onClick={() => nudge((s) => ({ rot: s.rot - 5 }))} aria-label="왼쪽으로 돌리기">↺</button>
              <button onClick={() => nudge((s) => ({ rot: s.rot + 5 }))} aria-label="오른쪽으로 돌리기">↻</button>
              <button onClick={() => layer(1)}>맨 앞</button>
              <button onClick={() => layer(-1)}>맨 뒤</button>
              <button onClick={duplicate} aria-label="복제"><IconCopy /></button>
              <button className="danger" onClick={remove} aria-label="삭제"><IconTrash /></button>
            </div>
          ) : (
            <p className="be-hint">요소를 눌러 고르고, 끌어서 옮기고, 모서리 손잡이로 돌리거나 크기를 바꿔요.</p>
          )}

          <div className="be-meta">
            <label className="area">
              <textarea
                rows={2}
                maxLength={60}
                value={board.intro || ''}
                placeholder="나를 소개하는 한 줄 (갤러리에 함께 보여요)"
                onChange={(e) => { const v = e.target.value; update((b) => ({ ...b, intro: v })); }}
                onBlur={(e) => { const bad = checkText(e.target.value); if (bad) { toast(bad); update((b) => ({ ...b, intro: '' })); } }}
              />
              <span className="counter">{(board.intro || '').length}/60</span>
            </label>
            <div className="publish-row">
              <label className="switch">
                <input type="checkbox" checked={!!board.published} onChange={(e) => { const v = e.target.checked; update((b) => ({ ...b, published: v })); toast(v ? '갤러리에 공개했어요' : '나만 보기로 바꿨어요'); }} />
                <span className="track" aria-hidden><span /></span>
                <span>{board.published ? '갤러리에 공개 중' : '나만 보기'}</span>
              </label>
              <SaveImageButton targetRef={exportRef} filename={`밑줄상점-무드보드-${member.nickname}.png`} />
            </div>
          </div>
        </div>

        <aside className="be-tray">
          <div className="tray-tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>

          <div className="tray-body">
            {tab === 'sentence' && (
              sentencePool.length === 0 ? (
                <p className="muted">아직 담은 문장이 없어요. <Link to="/">문장을 담으러 가 볼까요?</Link></p>
              ) : (
                <>
                  <p className="tray-help">눌러서 보드에 붙여요. 장바구니와 서랍에 담은 문장이에요.</p>
                  <div className="tray-sentences">
                    {sentencePool.map((u) => (
                      <button key={u.id} className="tray-sentence" onClick={() => add('sentence', { u: slimUnderline(u) })}>
                        <Paper u={u} variant="mini" />
                      </button>
                    ))}
                  </div>
                </>
              )
            )}

            {tab === 'text' && (
              <div className="tray-text">
                <div className="row-gap">
                  <button className="btn-ghost small" onClick={() => add('note', { text: '나는 오늘도 밑줄을 긋는다.', font: 'pen', color: '#1d1b18' })}>＋ 한 줄 쓰기</button>
                  <button className="btn-ghost small" onClick={() => add('title', { text: '나의 문장들', font: 'myeongjo', color: '#1d1b18' }, { x: 500, y: 140, rot: 0 })}>＋ 제목</button>
                </div>
                {sel && (sel.type === 'note' || sel.type === 'title') ? (
                  <div className="text-edit">
                    <label className="area">
                      <textarea rows={3} value={draftText} maxLength={sel.type === 'title' ? 30 : 80} onChange={(e) => setDraftText(e.target.value)} onBlur={applyText} />
                      <span className="counter">{draftText.length}/{sel.type === 'title' ? 30 : 80}</span>
                    </label>
                    <button className="btn-primary small-btn" onClick={applyText}>글 바꾸기</button>
                    <p className="tray-label">글꼴</p>
                    <div className="pill-row">
                      {FONTS.map((f) => (
                        <button key={f.id} className={`pill ${sel.font === f.id ? 'on' : ''}`} style={{ fontFamily: f.family }} onClick={() => patchItem(sel.id, { font: f.id })}>{f.label}</button>
                      ))}
                    </div>
                    <p className="tray-label">글자색</p>
                    <div className="dot-row">
                      {NOTE_COLORS.map((c) => (
                        <button key={c} className={`color-dot ${sel.color === c ? 'on' : ''}`} style={{ background: c }} aria-label={c} onClick={() => patchItem(sel.id, { color: c })} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="tray-help">보드에 붙인 글을 누르면 여기서 고칠 수 있어요.</p>
                )}
              </div>
            )}

            {tab === 'keyword' && (
              <>
                <p className="tray-help">나를 설명하는 분위기를 붙여 보세요.</p>
                <div className="mood-grid">
                  {KEYWORD_LIST.map((k) => (
                    <button key={k} className="mood-chip" style={{ '--c': KEYWORDS[k].color }} onClick={() => add('keyword', { word: k, color: KEYWORDS[k].color })}>
                      <i aria-hidden />#{k}
                    </button>
                  ))}
                </div>
              </>
            )}

            {tab === 'color' && (
              <>
                <p className="tray-help">색 견본은 이름과 함께, 색 블록은 콜라주 바탕으로 써요.</p>
                <div className="swatch-tray">
                  {KEYWORD_LIST.map((k) => (
                    <div key={k} className="swatch-cell">
                      <button className="sw-chip" style={{ background: KEYWORDS[k].color }} aria-label={`${KEYWORDS[k].name} 견본 붙이기`} onClick={() => add('swatch', { color: KEYWORDS[k].color, name: KEYWORDS[k].name }, { scale: 0.8 })} />
                      <button className="sw-block" onClick={() => add('block', { color: KEYWORDS[k].color }, { scale: 0.9 })}>블록</button>
                      <span>{KEYWORDS[k].name}</span>
                    </div>
                  ))}
                </div>
                <p className="tray-label">종이 블록</p>
                <div className="row-gap">
                  {['cream', 'grid', 'manuscript', 'crumpled', 'vintage'].map((t) => (
                    <button key={t} className={`tex-chip tex-${t}`} onClick={() => add('block', { texture: t, color: null }, { scale: 0.9 })} aria-label={`${t} 종이 붙이기`} />
                  ))}
                  <button className="btn-ghost small" onClick={() => add('tape', { color: 'rgba(206,192,160,.85)' })}>마스킹테이프</button>
                </div>
              </>
            )}

            {tab === 'sticker' && (
              <>
                <div className="dot-row">
                  {STICKER_COLORS.map((c) => (
                    <button key={c} className={`color-dot ${stickerColor === c ? 'on' : ''}`} style={{ background: c }} aria-label={`스티커 색 ${c}`} onClick={() => { setStickerColor(c); if (sel?.type === 'sticker') patchItem(sel.id, { color: c }); }} />
                  ))}
                </div>
                <div className="sticker-grid">
                  {STICKERS.map((s) => (
                    <button key={s} className="sticker-btn" onClick={() => add('sticker', { shape: s, color: stickerColor }, { scale: 0.9 })} aria-label={`${s} 스티커`}>
                      <Sticker shape={s} color={stickerColor} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {tab === 'bg' && (
              <div className="bg-options">
                {BACKGROUNDS.map((b) => (
                  <button key={b.id} className={`bg-opt ${b.css} ${board.bg === b.id ? 'on' : ''}`} onClick={() => update((x) => ({ ...x, bg: b.id }))}>
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
