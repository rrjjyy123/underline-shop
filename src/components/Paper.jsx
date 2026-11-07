import { fontById, inkById } from '../data/keywords';

export function sizeClass(sentence = '') {
  const n = sentence.replace(/\s/g, '').length;
  if (n <= 28) return 'len-xl';
  if (n <= 48) return 'len-l';
  if (n <= 90) return 'len-m';
  return 'len-s';
}

// 로고·제목 아래에 쓰는 주황 물결 밑줄 (브랜드 마크)
export function BrandUnderline({ className = '' }) {
  return <span className={`wave-ul ${className}`} aria-hidden />;
}

// 종이 위의 문장 한 장.
// 브랜드 밑줄 규칙: 모든 문장 아래에는 같은 주황 손밑줄(물결)이 그어진다.
// '밑줄' 장식을 고르면 같은 위치에 형광펜이 더해진다. 종이·글꼴·장식은 자유.
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
        <span className={`ul ${marked ? 'hl' : ''} ${highlight ? 'anim' : ''}`}>{u.sentence}</span>
      </p>
      <p className="source">
        <b>「{u.bookTitle || u.title || '책 제목'}」</b>
        <span>{u.author || '저자'}{u.page ? ` · p.${u.page}` : ''}</span>
      </p>
      {u.deco === 'label' && (u.keywords || []).length > 0 && (
        <span className="torn-label">#{u.keywords[0]}</span>
      )}
    </div>
  );
}
