// 분위기 키워드 사전: 색, 제목 문구, 요약 문장, 자동 추천용 단서 단어
export const KEYWORDS = {
  자유: {
    color: '#7f9bb3', name: 'Dusty Blue',
    adj: '자유로운', obj: '자유를',
    line: '정해진 길보다 스스로 고른 방향에 마음이 가는',
    cues: ['자유', '날', '날개', '바람', '길', '떠나', '하늘', '새', '깨뜨', '세계', '마음대로', '방식'],
  },
  위로: {
    color: '#c9a27e', name: 'Warm Sand',
    adj: '다정한', obj: '위로를',
    line: '지친 날 곁에 앉아 주는 말에 오래 머무는',
    cues: ['괜찮', '위로', '안아', '쉬', '눈물', '따뜻', '곁', '토닥', '다정'],
  },
  사랑: {
    color: '#b5525c', name: 'Rose Burgundy',
    adj: '애틋한', obj: '사랑을',
    line: '누군가를 향한 마음을 숨기지 않는 문장에 끌리는',
    cues: ['사랑', '님', '그대', '장미', '보고 싶', '마음', '만날', '연인'],
  },
  고독: {
    color: '#5b6470', name: 'Slate',
    adj: '혼자인', obj: '고독을',
    line: '혼자 있는 시간을 두려워하지 않고 오히려 아끼는',
    cues: ['홀로', '혼자', '고독', '외로', '쓸쓸', '침묵', '밤', '방'],
  },
  성장: {
    color: '#6f8f5e', name: 'Sage Green',
    adj: '자라나는', obj: '성장을',
    line: '어제보다 조금 더 나아가려는 마음을 응원하는',
    cues: ['배우', '익히', '자라', '알', '태어나', '투쟁', '새로운', '어제', '내일', '익어'],
  },
  청춘: {
    color: '#e0a458', name: 'Marigold',
    adj: '반짝이는', obj: '청춘을',
    line: '지금 이 순간의 흔들림까지 기록하고 싶은',
    cues: ['청춘', '젊', '봄', '꽃', '달려', '설레', '반짝'],
  },
  그리움: {
    color: '#9c8fb5', name: 'Lavender Haze',
    adj: '그리운', obj: '그리움을',
    line: '지나간 장소와 사람을 오래 품고 사는',
    cues: ['그리', '고향', '옛', '추억', '어머니', '잊힐', '엄마', '누나', '강변'],
  },
  고요: {
    color: '#a7b8a8', name: 'Mist',
    adj: '고요한', obj: '고요를',
    line: '소란 대신 조용한 풍경 속에서 숨을 고르는',
    cues: ['고요', '조용', '숲', '호수', '눈 감', '달빛', '하얀', '눈 나리'],
  },
  용기: {
    color: '#c0583a', name: 'Terracotta',
    adj: '단단한', obj: '용기를',
    line: '두려워도 한 걸음을 내딛는 사람의 말에 힘을 얻는',
    cues: ['두렵', '용기', '폭풍', '싸우', '부끄럼', '맞서', '배를 모는', '씨를 뿌'],
  },
  슬픔: {
    color: '#6d7f99', name: 'Rain Blue',
    adj: '먹먹한', obj: '슬픔을',
    line: '슬픔을 피하지 않고 끝까지 들여다보는',
    cues: ['슬', '울', '부서진', '이별', '갔습니다', '불행', '죽', '헤어진'],
  },
  희망: {
    color: '#e9c46a', name: 'Butter',
    adj: '빛나는', obj: '희망을',
    line: '어두운 장면 속에서도 다음 장을 기대하는',
    cues: ['희망', '빛', '별', '다시', '내일', '길이 된다', '돋아'],
  },
  사유: {
    color: '#8a7560', name: 'Walnut',
    adj: '생각이 깊은', obj: '질문을',
    line: '쉽게 답하지 않고 질문을 오래 붙드는',
    cues: ['문제', '진리', '생각', '중요한', '보이지 않', '왜', '삶', '인생', '의도적'],
  },
};

export const KEYWORD_LIST = Object.keys(KEYWORDS);

// 홈 화면 해시태그 줄에 먼저 보일 순서
export const HOME_TAGS = ['자유', '위로', '사랑', '고독', '성장', '청춘', '그리움', '고요', '용기', '희망', '슬픔', '사유'];

// EXPLORE 큐레이션 컬렉션
export const COLLECTIONS = [
  { id: 'busy-mind', title: '마음이 복잡한 날', sub: '조용히 숨 고르게 하는 문장', tags: ['고요', '위로'], tone: '#a7b8a8' },
  { id: 'dream-free', title: '자유를 꿈꾸는 사람', sub: '알을 깨고 나오려는 문장', tags: ['자유', '용기'], tone: '#7f9bb3' },
  { id: 'alone-time', title: '혼자 있는 시간이 좋은 사람', sub: '나만의 방에서 읽는 문장', tags: ['고독', '사유'], tone: '#5b6470' },
  { id: 'youth-log', title: '청춘을 기록하는 문장', sub: '흔들리며 자라는 문장', tags: ['청춘', '성장'], tone: '#e0a458' },
  { id: 'keep-long', title: '오래 기억하고 싶은 말', sub: '그리운 사람에게 보내고 싶은 문장', tags: ['그리움', '사랑'], tone: '#9c8fb5' },
];

// 사용자가 고르는 스타일 옵션
export const FONTS = [
  { id: 'myeongjo', label: '명조', family: "'Noto Serif KR', serif", weight: 500 },
  { id: 'batang', label: '바탕', family: "'Gowun Batang', serif", weight: 400 },
  { id: 'pen', label: '손글씨', family: "'Nanum Pen Script', cursive", weight: 400 },
  { id: 'gothic', label: '고딕', family: "'IBM Plex Sans KR', sans-serif", weight: 500 },
];

// 모든 질감 위에서 읽히도록 어두운 색만 둔다 (대비 4.5:1 이상)
export const INK_COLORS = [
  { id: 'black', label: '블랙', hex: '#1d1b18' },
  { id: 'brown', label: '브라운', hex: '#5a3a22' },
  { id: 'navy', label: '네이비', hex: '#1f2f4f' },
  { id: 'burgundy', label: '버건디', hex: '#6b1f2a' },
  { id: 'forest', label: '포레스트', hex: '#2b4433' },
  { id: 'plum', label: '플럼', hex: '#4a2a4f' },
];

export const TEXTURES = [
  { id: 'cream', label: '크림 종이' },
  { id: 'grid', label: '모눈종이' },
  { id: 'crumpled', label: '구겨진 종이' },
  { id: 'manuscript', label: '원고지' },
  { id: 'vintage', label: '빈티지 종이' },
];

export const DECOS = [
  { id: 'tape', label: '마스킹테이프' },
  { id: 'label', label: '찢어진 라벨' },
  { id: 'underline', label: '밑줄' },
  { id: 'sticker', label: '스티커' },
];

export const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
export const inkById = (id) => INK_COLORS.find((c) => c.id === id) || INK_COLORS[0];
export const textureLabel = (id) => (TEXTURES.find((t) => t.id === id) || TEXTURES[0]).label;

// 문장 내용으로 키워드 자동 추천 (규칙 기반)
export function suggestKeywords(sentence, max = 3) {
  const text = sentence || '';
  const scored = KEYWORD_LIST.map((k) => ({
    k,
    s: KEYWORDS[k].cues.reduce((acc, cue) => acc + (text.includes(cue) ? 1 : 0), 0),
  }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, max).map((x) => x.k);
}

// 키워드에 어울리는 글자색 추천
const INK_FOR = {
  자유: 'navy', 위로: 'brown', 사랑: 'burgundy', 고독: 'black', 성장: 'forest', 청춘: 'brown',
  그리움: 'plum', 고요: 'forest', 용기: 'burgundy', 슬픔: 'navy', 희망: 'brown', 사유: 'black',
};
const TEXTURE_FOR = {
  자유: 'grid', 위로: 'cream', 사랑: 'vintage', 고독: 'crumpled', 성장: 'grid', 청춘: 'cream',
  그리움: 'vintage', 고요: 'cream', 용기: 'manuscript', 슬픔: 'crumpled', 희망: 'cream', 사유: 'manuscript',
};
export function suggestStyle(keywords, seed = 0) {
  const k = keywords[0];
  if (!k) return null;
  const fonts = ['myeongjo', 'batang', 'pen', 'gothic'];
  return { ink: INK_FOR[k], texture: TEXTURE_FOR[k], font: fonts[seed % fonts.length] };
}
