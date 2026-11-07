import { fontById, inkById } from '../data/keywords';

export function sizeClass(sentence = '') {
  const n = sentence.replace(/\s/g, '').length;
  if (n <= 28) return 'len-xl';
  if (n <= 48) return 'len-l';
  if (n <= 90) return 'len-m';
  return 'len-s';
}

// 브랜드 밑줄 규칙: 모든 카드는 문장 끝에 같은 꿀색 손그림 밑줄 하나를 가진다.
// '밑줄' 장식을 고르면 문장 전체에 같은 색 형광펜이 들어간다. (색·두께·모양은 바꾸지 않는다)
export function BrandUnderline({ className = '' }) {
  return (
    <svg className={`brand-ul ${className}`} viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden>
      <path d="M2 8.5 C 22 4.5, 44 10, 66 6.5 S 104 4, 118 6" />
    </svg>
  );
}

// 종이 위의 문장 한 장. 피드·배너·무드보드 어디서나 같은 모양으로 쓴다.
export function Paper({ u, variant = 'feed', highlight = false, className = '' }) {
  const font = fontById(u.font);
  const ink = inkById(u.ink);
  const tilt = ((u.id || u.sentence || '').length % 5) - 2;
  const marked = u.deco === 'underline' || highlight;
  return (
    <div
      className={`paper tex-${u.texture || 'cream'} deco-${u.deco || 'tape'} v-${variant} ${sizeClass(u.sentence)} ${className}`}
      style={{ '--ink': ink.hex, '--font': font.family, '--fw': font.weight, '--tilt': `${tilt}deg` }}
    >
      {u.deco === 'tape' && <span className="tape" aria-hidden />}
      {u.deco === 'sticker' && <span className="sticker" aria-hidden>✦</span>}
      <p className={`sentence ${font.id === 'pen' ? 'is-pen' : ''}`}>
        {marked ? <mark className={highlight ? 'hl' : 'ul'}>{u.sentence}</mark> : u.sentence}
      </p>
      <BrandUnderline />
      <p className="source">
        <b>{u.bookTitle || u.title || '책 제목'}</b>
        <span>{u.author || '저자'}{u.page ? ` · p.${u.page}` : ''}</span>
      </p>
      {u.deco === 'label' && (u.keywords || []).length > 0 && (
        <span className="torn-label">#{u.keywords[0]}</span>
      )}
    </div>
  );
}
