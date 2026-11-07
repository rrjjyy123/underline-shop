import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where, limit,
  writeBatch, runTransaction, serverTimestamp, Timestamp, setDoc, deleteDoc, increment,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { SEEDS, SEED_VERSION } from '../data/seeds';

export function waitForUser() {
  return new Promise((resolve, reject) => {
    const off = onAuthStateChanged(auth, async (u) => {
      off();
      if (u) return resolve(u);
      try {
        const cred = await signInAnonymously(auth);
        resolve(cred.user);
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function bookIdOf(title, author) {
  const s = `${title.trim()}|${author.trim()}`.toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'b' + (h >>> 0).toString(36);
}

const BOOK_TONES = ['#2f3e46', '#6b1f2a', '#5a3a22', '#1f2f4f', '#2b4433', '#4a2a4f', '#8a7560', '#b08a4a'];
const toneOf = (id) => BOOK_TONES[parseInt(id.slice(1, 6), 36) % BOOK_TONES.length];

// 처음 쓰는 프로젝트라면 고전 시드 문장을 진열한다 (한 번만)
export async function ensureSeeds() {
  const metaRef = doc(db, 'meta', `seed-v${SEED_VERSION}`);
  const meta = await getDoc(metaRef);
  if (meta.exists()) return;
  const batch = writeBatch(db);
  const books = {};
  const now = Date.now();
  SEEDS.forEach((s, i) => {
    const bookId = bookIdOf(s.title, s.author);
    books[bookId] = books[bookId] || { title: s.title, author: s.author, count: 0 };
    books[bookId].count += 1;
    const id = `seed-${String(i + 1).padStart(2, '0')}`;
    batch.set(doc(db, 'underlines', id), {
      bookId, bookTitle: s.title, author: s.author,
      authorId: 'seed', nickname: '밑줄상점 큐레이션',
      sentence: s.sentence, page: null, reason: s.reason,
      font: s.font, ink: s.ink, texture: s.texture, deco: s.deco, keywords: s.keywords,
      cartCount: 0, reportCount: 0, hidden: false, isSeed: true, isClassic: true,
      createdAt: Timestamp.fromMillis(now - (SEEDS.length - i) * 37 * 60 * 1000),
    });
  });
  Object.entries(books).forEach(([id, b]) => {
    batch.set(doc(db, 'books', id), {
      title: b.title, author: b.author, isClassic: true, coverColor: toneOf(id), underlineCount: b.count,
    });
  });
  batch.set(metaRef, { at: serverTimestamp() });
  try {
    await batch.commit();
  } catch (e) {
    // 다른 사람이 먼저 진열했으면 규칙에 막힌다. 그대로 두면 된다.
    console.info('seed skipped', e.code);
  }
}

export async function saveMember(uid, nickname, tag) {
  await setDoc(doc(db, 'members', uid), { nickname, tag, joinedAt: serverTimestamp() }, { merge: true });
}

export function subscribeFeed(cb, onError) {
  const q = query(collection(db, 'underlines'), orderBy('createdAt', 'desc'), limit(400));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => !u.hidden));
  }, onError);
}

export function subscribeBooks(cb) {
  return onSnapshot(collection(db, 'books'), (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeSub(uid, name, cb) {
  return onSnapshot(collection(db, 'members', uid, name), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export async function addToCart(uid, underlineId) {
  const drawerRef = doc(db, 'members', uid, 'drawer', underlineId);
  const cartRef = doc(db, 'members', uid, 'cart', underlineId);
  const uRef = doc(db, 'underlines', underlineId);
  await runTransaction(db, async (tx) => {
    const drawer = await tx.get(drawerRef);
    tx.set(cartRef, { underlineId, createdAt: serverTimestamp() });
    if (!drawer.exists()) {
      tx.set(drawerRef, { underlineId, type: 'collected', createdAt: serverTimestamp() });
      tx.update(uRef, { cartCount: increment(1) });
    }
  });
}

export async function removeFromCart(uid, underlineId) {
  await deleteDoc(doc(db, 'members', uid, 'cart', underlineId));
}

export async function restoreToCart(uid, underlineId) {
  await setDoc(doc(db, 'members', uid, 'cart', underlineId), { underlineId, createdAt: serverTimestamp() });
}

export async function postUnderline(user, member, form) {
  const bookId = bookIdOf(form.title, form.author);
  const bookRef = doc(db, 'books', bookId);
  const uRef = doc(collection(db, 'underlines'));
  await runTransaction(db, async (tx) => {
    const book = await tx.get(bookRef);
    if (book.exists()) {
      tx.update(bookRef, { underlineCount: increment(1) });
    } else {
      tx.set(bookRef, {
        title: form.title.trim(), author: form.author.trim(), isClassic: false,
        coverColor: toneOf(bookId), underlineCount: 1,
      });
    }
    tx.set(uRef, {
      bookId, bookTitle: form.title.trim(), author: form.author.trim(),
      authorId: user.uid, nickname: `${member.nickname}#${member.tag}`,
      sentence: form.sentence.trim(), page: form.page ? Number(form.page) : null, reason: form.reason.trim(),
      font: form.font, ink: form.ink, texture: form.texture, deco: form.deco, keywords: form.keywords,
      cartCount: 0, reportCount: 0, hidden: false, isSeed: false, isClassic: false,
      createdAt: serverTimestamp(),
    });
  });
  return uRef.id;
}

export async function deleteUnderline(id) {
  await deleteDoc(doc(db, 'underlines', id));
}

export async function reportUnderline(uid, underlineId, reason) {
  const uRef = doc(db, 'underlines', underlineId);
  const rRef = doc(db, 'underlines', underlineId, 'reports', uid);
  await runTransaction(db, async (tx) => {
    const u = await tx.get(uRef);
    if (!u.exists()) return;
    const next = (u.data().reportCount || 0) + 1;
    tx.set(rRef, { reason, createdAt: serverTimestamp() });
    tx.update(uRef, { reportCount: next, hidden: next >= 3 });
  });
}

export function subscribeMoodboard(uid, cb) {
  return onSnapshot(doc(db, 'moodboards', uid), (d) => cb(d.exists() ? d.data() : null));
}

export async function saveMoodboard(uid, data) {
  await setDoc(doc(db, 'moodboards', uid), { ...data, memberId: uid, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveSetlog(uid, moodboard) {
  const ref = doc(collection(db, 'setlogs'));
  await setDoc(ref, {
    memberId: uid,
    title: moodboard.title,
    snapshot: moodboard,
    createdAt: serverTimestamp(),
  });
}

export function subscribeSetlogs(uid, cb) {
  const q = query(collection(db, 'setlogs'), where('memberId', '==', uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    cb(list);
  });
}

export async function deleteSetlog(id) {
  await deleteDoc(doc(db, 'setlogs', id));
}

export { getDocs };
