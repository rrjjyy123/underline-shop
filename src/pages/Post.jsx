import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../store';
import { DECOS, FONTS, INK_COLORS, KEYWORDS, KEYWORD_LIST, TEXTURES, suggestKeywords, suggestStyle } from '../data/keywords';
import { postUnderline } from '../lib/db';
import { checkText } from '../lib/guard';
import { Paper } from '../components/Paper';
import { TopBar } from '../components/UI';
import { IconSpark } from '../components/Icons';

const STEPS = ['책', '문장', '스타일', '키워드', '미리보기'];
const MAX = 150;
const EXAMPLES = [
  '본래 땅 위에는 길이 없다. 걷는 사람이 많아지면 그것이 곧 길이 된다.',
  '가장 중요한 것은 눈에 보이지 않아.',
  '나는 폭풍이 두렵지 않아. 내 배를 모는 법을 배우고 있으니까.',
];

export default function Post() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { books, user, member, toast } = useApp();
  const preset = books.find((b) => b.id === params.get('book'));
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [shuffle, setShuffle] = useState(0);
  const [form, setForm] = useState({
    title: preset?.title || '', author: preset?.author || '',
    sentence: '', page: '', reason: '',
    font: 'myeongjo', ink: 'black', texture: 'cream', deco: 'tape', keywords: [],
  });
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const [bookFocus, setBookFocus] = useState(false);
  const matches = useMemo(() => {
    const q = form.title.trim();
    if (!q) return [];
    return books.filter((b) => b.title.includes(q) || b.author.includes(q)).slice(0, 6);
  }, [books, form.title]);

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.title.trim()) e.title = '책 제목을 써 주세요.';
      if (!form.author.trim()) e.author = '저자를 써 주세요.';
      const bad = checkText(form.title, form.author);
      if (bad) e.title = bad;
    }
    if (s === 1) {
      if (!form.sentence.trim()) e.sentence = '마음에 든 문장을 써 주세요.';
      else if (form.sentence.length > MAX) e.sentence = `${MAX}자까지만 쓸 수 있어요.`;
      const bad = checkText(form.sentence, form.reason);
      if (bad) e.sentence = bad;
      if (form.page && !/^\d{1,4}$/.test(form.page)) e.page = '쪽수는 숫자로 써 주세요.';
    }
    if (s === 3 && form.keywords.length === 0) e.keywords = '키워드를 하나 이상 골라 주세요.';
    setErrors(e);
    if (Object.keys(e).length) {
      const first = document.querySelector(`[data-field="${Object.keys(e)[0]}"]`);
      first?.focus();
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validate(step)) return;
    if (step === 1 && form.keywords.length === 0) {
      const ks = suggestKeywords(form.sentence);
      if (ks.length) set('keywords', ks);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const recommendStyle = () => {
    const ks = form.keywords.length ? form.keywords : suggestKeywords(form.sentence);
    const st = suggestStyle(ks.length ? ks : ['사유'], shuffle);
    setShuffle((n) => n + 1);
    setForm((f) => ({ ...f, ...st, keywords: f.keywords.length ? f.keywords : ks }));
    toast('문장 분위기에 맞춰 스타일을 골랐어요');
  };

  const toggleKeyword = (k) => {
    setErrors((e) => ({ ...e, keywords: undefined }));
    setForm((f) => {
      if (f.keywords.includes(k)) return { ...f, keywords: f.keywords.filter((x) => x !== k) };
      if (f.keywords.length >= 3) return f;
      return { ...f, keywords: [...f.keywords, k] };
    });
  };

  const submit = async () => {
    for (let s = 0; s < 4; s++) {
      if (!validate(s)) { setStep(s); return; }
    }
    setBusy(true);
    try {
      const id = await postUnderline(user, member, form);
      toast('밑줄을 올렸어요');
      nav(`/u/${id}`, { replace: true });
    } catch (e) {
      console.error(e);
      toast('올리지 못했어요. 잠시 뒤 다시 해 주세요.');
      setBusy(false);
    }
  };

  const previewU = { ...form, bookTitle: form.title, id: 'preview' };

  return (
    <div className="page post">
      <TopBar title="밑줄 올리기" />
      <ol className="stepper" aria-label="진행 단계">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'now' : i < step ? 'done' : ''}>
            <button onClick={() => (i < step ? setStep(i) : null)} disabled={i > step} aria-current={i === step ? 'step' : undefined}>
              <b>{i + 1}</b><span>{s}</span>
            </button>
          </li>
        ))}
      </ol>

      {step >= 1 && (
        <div className={`live-preview ${step === 4 ? 'big' : ''}`}>
          <Paper u={{ ...previewU, sentence: form.sentence || '여기에 문장이 보여요' }} variant={step === 4 ? 'large' : 'feed'} />
        </div>
      )}

      <div className="step-body">
        {step === 0 && (
          <div className="fields">
            <h2>어떤 책에서 만난 문장인가요?</h2>
            <div className="ac">
              <label className={`float-field ${form.title ? 'filled' : ''} ${errors.title ? 'has-err' : ''}`}>
                <input data-field="title" value={form.title} maxLength={80} onFocus={() => setBookFocus(true)} onBlur={() => setTimeout(() => setBookFocus(false), 150)} onChange={(e) => set('title', e.target.value)} autoComplete="off" />
                <span>책 제목</span>
              </label>
              {bookFocus && matches.length > 0 && (
                <ul className="ac-list" role="listbox">
                  {matches.map((b) => (
                    <li key={b.id}>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setForm((f) => ({ ...f, title: b.title, author: b.author })); setBookFocus(false); }}>
                        <span className="book-dot" style={{ background: b.coverColor }} />
                        <b>{b.title}</b> <span>{b.author}</span> <small>밑줄 {b.underlineCount}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {errors.title && <p className="field-err">{errors.title}</p>}
            </div>
            <label className={`float-field ${form.author ? 'filled' : ''} ${errors.author ? 'has-err' : ''}`}>
              <input data-field="author" value={form.author} maxLength={40} onChange={(e) => set('author', e.target.value)} autoComplete="off" />
              <span>저자</span>
            </label>
            {errors.author && <p className="field-err">{errors.author}</p>}
            <p className="field-help">이미 올라온 책은 목록에서 고르면 같은 책으로 묶여요.</p>
          </div>
        )}

        {step === 1 && (
          <div className="fields">
            <h2>밑줄 친 문장을 옮겨 적어 주세요</h2>
            <label className={`area ${errors.sentence ? 'has-err' : ''}`}>
              <textarea
                data-field="sentence" rows={4} value={form.sentence}
                onChange={(e) => set('sentence', e.target.value.slice(0, MAX + 20))}
                placeholder={`예) ${EXAMPLES[form.title.length % EXAMPLES.length]}`}
              />
              <span className={`counter ${form.sentence.length > MAX ? 'over' : ''}`}>{form.sentence.length}/{MAX}</span>
            </label>
            {errors.sentence && <p className="field-err">{errors.sentence}</p>}
            <div className="two">
              <label className={`float-field ${form.page ? 'filled' : ''} ${errors.page ? 'has-err' : ''}`}>
                <input data-field="page" inputMode="numeric" value={form.page} onChange={(e) => set('page', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                <span>쪽수 (선택)</span>
              </label>
            </div>
            <label className="area">
              <textarea rows={2} value={form.reason} maxLength={80} onChange={(e) => set('reason', e.target.value)} placeholder="이 문장을 고른 이유 한 줄 (선택)" />
              <span className="counter">{form.reason.length}/80</span>
            </label>
            <p className="field-help">출처를 꼭 함께 적고, 짧게 인용해 주세요.</p>
          </div>
        )}

        {step === 2 && (
          <div className="fields">
            <div className="row-between">
              <h2>문장을 꾸며 볼까요?</h2>
              <button className="btn-ghost small" onClick={recommendStyle}><IconSpark /> 자동 추천</button>
            </div>
            <fieldset>
              <legend>TYPOGRAPHY</legend>
              <div className="font-grid">
                {FONTS.map((f) => (
                  <button key={f.id} className={`font-opt ${form.font === f.id ? 'on' : ''}`} aria-pressed={form.font === f.id} onClick={() => set('font', f.id)} style={{ fontFamily: f.family }}>
                    <span className="specimen">가</span>
                    <span className="fname">{f.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>COLOR</legend>
              <div className="swatches">
                {INK_COLORS.map((c) => (
                  <button key={c.id} className={`swatch ${form.ink === c.id ? 'on' : ''}`} aria-pressed={form.ink === c.id} aria-label={c.label} onClick={() => set('ink', c.id)}>
                    <i style={{ background: c.hex }} /><span>{c.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>TEXTURE</legend>
              <div className="texture-grid">
                {TEXTURES.map((t) => (
                  <button key={t.id} className={`texture-opt tex-${t.id} ${form.texture === t.id ? 'on' : ''}`} aria-pressed={form.texture === t.id} onClick={() => set('texture', t.id)}>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>DECORATION</legend>
              <div className="pill-row">
                {DECOS.map((d) => (
                  <button key={d.id} className={`pill ${form.deco === d.id ? 'on' : ''}`} aria-pressed={form.deco === d.id} onClick={() => set('deco', d.id)}>{d.label}</button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div className="fields">
            <div className="row-between">
              <h2>어떤 분위기의 문장인가요?</h2>
              <span className="muted">{form.keywords.length}/3</span>
            </div>
            <div className="picked" data-field="keywords" tabIndex={-1}>
              {form.keywords.length === 0 && <span className="muted">아래에서 최대 3개를 골라 주세요</span>}
              {form.keywords.map((k) => (
                <button key={k} className="torn removable" style={{ '--c': KEYWORDS[k].color }} onClick={() => toggleKeyword(k)} aria-label={`${k} 빼기`}>#{k} ×</button>
              ))}
            </div>
            {errors.keywords && <p className="field-err">{errors.keywords}</p>}
            <div className="mood-grid">
              {KEYWORD_LIST.map((k) => {
                const on = form.keywords.includes(k);
                return (
                  <button key={k} className={`mood-chip ${on ? 'on' : ''}`} style={{ '--c': KEYWORDS[k].color }} aria-pressed={on} disabled={!on && form.keywords.length >= 3} onClick={() => toggleKeyword(k)}>
                    <i aria-hidden />#{k}
                  </button>
                );
              })}
            </div>
            {suggestKeywords(form.sentence).length > 0 && (
              <p className="field-help">문장에서 찾은 추천: {suggestKeywords(form.sentence).map((k) => `#${k}`).join(' ')}</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="fields center">
            <h2>이렇게 진열돼요</h2>
            <p className="muted">올린 뒤에는 친구들이 이 카드를 장바구니에 담을 수 있어요.</p>
          </div>
        )}
      </div>

      <div className="wizard-bar">
        {step > 0 && <button className="btn-ghost" onClick={() => setStep((s) => s - 1)}>이전</button>}
        {step < STEPS.length - 1 ? (
          <button className="btn-primary grow" onClick={next}>다음</button>
        ) : (
          <button className="btn-primary grow" onClick={submit} disabled={busy}>{busy ? '올리는 중…' : '진열하기'}</button>
        )}
      </div>
    </div>
  );
}
