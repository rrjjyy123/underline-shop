// 나를 표현하는 무드보드: 자유 배치 보드의 데이터 모델과 저장
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { KEYWORDS } from '../data/keywords';

// 보드는 논리 좌표 1000 × 1250 (4:5, 인스타 세로 비율)에서 그리고 화면 너비에 맞춰 줄인다
export const BW = 1000;
export const BH = 1250;
export const MAX_ITEMS = 50;

export const BACKGROUNDS = [
  { id: 'ivory', label: '아이보리', css: 'bg-ivory' },
  { id: 'kraft', label: '크라프트', css: 'bg-kraft' },
  { id: 'grid', label: '모눈', css: 'bg-grid' },
  { id: 'cork', label: '코르크', css: 'bg-cork' },
  { id: 'night', label: '밤하늘', css: 'bg-night', dark: true },
  { id: 'sage', label: '세이지', css: 'bg-sage' },
  { id: 'rose', label: '로즈', css: 'bg-rose' },
  { id: 'linen', label: '리넨', css: 'bg-linen' },
];
export const bgById = (id) => BACKGROUNDS.find((b) => b.id === id) || BACKGROUNDS[0];

export const STICKERS = ['star', 'heart', 'flower', 'moon', 'sparkle', 'leaf', 'cloud', 'arrow', 'stamp', 'bookmark', 'sun', 'pin'];

export const NOTE_COLORS = ['#1d1b18', '#5a3a22', '#1f2f4f', '#6b1f2a', '#2b4433', '#fffaf0'];

// 요소별 기본 크기 (논리 px, scale 1 기준)
export const BASE_W = { sentence: 300, note: 320, title: 760, keyword: 0, swatch: 150, sticker: 110, tape: 200, block: 260 };

let seq = 0;
export const newId = () => `i${Date.now().toString(36)}${(seq++).toString(36)}`;

export function makeItem(type, payload = {}, at = {}) {
  return {
    id: newId(),
    type,
    x: at.x ?? BW / 2 + (Math.random() - 0.5) * 160,
    y: at.y ?? BH / 2 + (Math.random() - 0.5) * 200,
    rot: at.rot ?? Math.round((Math.random() - 0.5) * 8),
    scale: at.scale ?? 1,
    z: at.z ?? Date.now() % 100000,
    ...payload,
  };
}

export const slimUnderline = (u) => ({
  id: u.id, sentence: u.sentence, bookTitle: u.bookTitle, author: u.author, page: u.page || null,
  font: u.font, ink: u.ink, texture: u.texture, deco: u.deco, keywords: (u.keywords || []).slice(0, 3),
});

// 제목이 한 줄(760px)에 들어가도록 줄이는 비율
export const titleScale = (text = '') => Math.min(1, Math.round((11.5 / Math.max(1, text.replace(/\s/g, '').length)) * 100) / 100);

// 취향 분석 결과로 시작 배치를 만든다 (사용자가 바로 고쳐 쓰는 초안)
export function autoBoard({ analysis, items, nickname }) {
  const its = [];
  let z = 1;
  const kw = analysis?.keywords || [];
  const title = analysis?.title || `${nickname}의 문장들`;
  its.push(makeItem('title', { text: title, font: 'myeongjo', color: '#1d1b18' }, { x: 500, y: 120, rot: 0, z: z++, scale: titleScale(title) }));
  its.push(makeItem('note', { text: '나는 이런 문장에 밑줄을 긋는 사람이에요.', font: 'pen', color: '#5a3a22' }, { x: 500, y: 225, rot: -1, z: z++, scale: 0.9 }));
  const spots = [[260, 470, -4], [720, 430, 3], [300, 860, 2], [720, 850, -3]];
  items.slice(0, 4).forEach((u, i) => {
    const [x, y, rot] = spots[i];
    its.push(makeItem('sentence', { u: slimUnderline(u) }, { x, y, rot, z: z++, scale: 1.05 }));
  });
  (analysis?.palette || []).slice(0, 4).forEach((c, i) => {
    its.push(makeItem('swatch', { color: c.hex, name: c.name }, { x: 170 + i * 120, y: 1135, rot: (i % 2 ? 3 : -3), z: z++, scale: 0.72 }));
  });
  kw.slice(0, 3).forEach((k, i) => {
    its.push(makeItem('keyword', { word: k, color: KEYWORDS[k]?.color || '#c9a27e' }, { x: 720 + (i % 2) * 120, y: 1080 + i * 52, rot: i % 2 ? 4 : -3, z: z++ }));
  });
  its.push(makeItem('sticker', { shape: 'sparkle', color: '#e3a83c' }, { x: 935, y: 62, rot: 12, z: z++, scale: 0.6 }));
  its.push(makeItem('tape', { color: 'rgba(206,192,160,.85)' }, { x: 500, y: 640, rot: -2, z: z++, scale: 0.8 }));
  return { bg: 'ivory', items: its };
}

export function emptyBoard(nickname) {
  return {
    bg: 'ivory',
    items: [makeItem('title', { text: `${nickname}의 무드보드`, font: 'myeongjo', color: '#1d1b18' }, { x: 500, y: 130, rot: 0, z: 1 })],
  };
}

export function subscribeBoard(uid, cb, onErr) {
  return onSnapshot(doc(db, 'boards', uid), (d) => cb(d.exists() ? d.data() : null), onErr);
}

export async function saveBoard(uid, member, data) {
  await setDoc(doc(db, 'boards', uid), {
    ...data,
    memberId: uid,
    nickname: `${member.nickname}#${member.tag}`,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function subscribePublishedBoards(cb) {
  const q = query(collection(db, 'boards'), where('published', '==', true));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
    cb(list);
  }, () => cb([]));
}
