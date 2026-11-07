// 게시 전 검사 (교사 숨김 기능 대신): 금칙어 + 개인정보 패턴
const BANNED = [
  '시발', '씨발', 'ㅅㅂ', 'ㅆㅂ', '병신', 'ㅂㅅ', '좆', '존나', 'ㅈㄴ', '개새', '새끼', '미친놈', '미친년',
  '닥쳐', '꺼져', '지랄', 'ㅈㄹ', '엿먹', '느금', '니애미', '애미', '애비', '창녀', '걸레', '찐따', '장애인새',
  '죽어라', '죽여', '자살', 'fuck', 'shit', 'bitch',
];

const PHONE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;

export function checkText(...texts) {
  const joined = texts.join(' ');
  const squeezed = joined.replace(/[\s.\-_*~!?]/g, '').toLowerCase();
  if (BANNED.some((w) => squeezed.includes(w))) {
    return '친구가 상처받을 수 있는 표현이 들어 있어요. 다른 말로 바꿔 주세요.';
  }
  if (PHONE.test(joined)) return '전화번호처럼 보이는 내용이 있어요. 개인정보는 올릴 수 없어요.';
  if (EMAIL.test(joined)) return '이메일 주소처럼 보이는 내용이 있어요. 개인정보는 올릴 수 없어요.';
  return null;
}

export function checkNickname(name) {
  const n = name.trim();
  if (n.length < 2) return '닉네임은 2글자 이상이에요.';
  if (n.length > 12) return '닉네임은 12글자까지예요.';
  return checkText(n);
}
