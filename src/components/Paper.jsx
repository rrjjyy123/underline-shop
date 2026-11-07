import { fontById, inkById } from '../data/keywords';

export function sizeClass(sentence = '') {
  const n = sentence.replace(/\s/g, '').length;
  if (n <= 28) return 'len-xl';
  if (n <= 48) return 'len-l';
  if (n <= 90) return 'len-m';
  return 'len-s';
}

// 종이 위의 문장 한 장. 피드·미리보기·무드보드 어디서나 같은 모양으로 쓴다.
export function Paper({ u, variant = 'feed', highlight = false, className = '' }) {
  const font = fontById(u.font);
  const ink = inkById(u.ink);
  const tilt = ((u.id || u.sentence || '').length % 5) - 2;
  return (
    <div
      className={`paper tex-${u.texture || 'cream'} deco-${u.deco || 'tape'} v-${variant} ${sizeClass(u.sentence)} ${className}`}
      style={{ '--ink': ink.hex, '--font': font.family, '--fw': font.weight, '--tilt': `${tilt}deg` }}
    >
      {u.deco === 'tape' && <span className="tape" aria-hidden />}
      {u.deco === 'sticker' && <span className="sticker" aria-hidden>✦</span>}
      <p className={`sentence ${font.id === 'pen' ? 'is-pen' : ''}`}>
        {u.deco === 'underline' || highlight ? <mark className={highlight ? 'hl' : 'ul'}>{u.sentence}</mark> : u.sentence}
      </p>
      <p className="source">
        「{u.bookTitle || u.title || '책 제목'}」 {u.author || '저자'}
        {u.page ? ` · ${u.page}쪽` : ''}
      </p>
      {u.deco === 'label' && (u.keywords || []).length > 0 && (
        <span className="torn-label">#{u.keywords[0]}</span>
      )}
    </div>
  );
}
