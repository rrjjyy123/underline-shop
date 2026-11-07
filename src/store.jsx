import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleAuthProvider, linkWithPopup, onAuthStateChanged, signInAnonymously, signInWithCredential, signInWithPopup, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import {
  ensureSeeds, saveMember, subscribeFeed, subscribeBooks, subscribeSub,
  subscribeMoodboard, addToCart, removeFromCart, restoreToCart,
} from './lib/db';
import { CART_MAX } from './lib/taste';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function AppProvider({ children }) {
  // user: 구글로 로그인한 사용자 또는 '데모로 둘러보기'로 들어온 익명 사용자
  const [authUser, setAuthUser] = useState(undefined);
  const [, setAuthTick] = useState(0); // 익명→구글 연결은 같은 객체가 바뀌므로 다시 그리게 한다
  const user = authUser || null;
  const isDemo = !!authUser?.isAnonymous;
  const authReady = authUser !== undefined;
  const [authError] = useState(null);
  const [member, setMemberState] = useState(undefined);
  const [feed, setFeed] = useState(null);
  const [feedError, setFeedError] = useState(null);
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [drawer, setDrawer] = useState([]);
  const [moodboard, setMoodboard] = useState(undefined);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => onAuthStateChanged(auth, (u) => setAuthUser(u || null)), []);

  // 내 회원 정보 (닉네임은 Firestore에 저장: 기기를 바꿔도 유지)
  useEffect(() => {
    if (!user) { setMemberState(user === null && authReady ? null : undefined); return; }
    setMemberState(undefined);
    return onSnapshot(doc(db, 'members', user.uid), (d) => {
      const data = d.data();
      setMemberState(data?.nickname ? { nickname: data.nickname, tag: data.tag } : null);
    }, () => setMemberState(null));
  }, [user?.uid, authReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const signInGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    // 예전 익명 사용자라면 구글 계정에 연결해서 장바구니·서랍 기록을 그대로 가져간다
    if (auth.currentUser?.isAnonymous) {
      try {
        const res = await linkWithPopup(auth.currentUser, provider);
        await res.user.reload();
        setAuthUser(auth.currentUser);
        setAuthTick((n) => n + 1);
        return;
      } catch (e) {
        if (e.code === 'auth/credential-already-in-use') {
          const cred = GoogleAuthProvider.credentialFromError(e);
          if (cred) { await signInWithCredential(auth, cred); return; }
        }
        if (e.code !== 'auth/provider-already-linked') throw e;
      }
    }
    await signInWithPopup(auth, provider);
  }, []);

  // 구글 로그인 없이 데모로 둘러보기: 익명 계정 + 자동 닉네임
  const startDemo = useCallback(async () => {
    const cred = auth.currentUser?.isAnonymous ? { user: auth.currentUser } : await signInAnonymously(auth);
    const tag = String(Math.floor(1000 + Math.random() * 9000));
    await saveMember(cred.user.uid, '데모손님', tag);
  }, []);

  useEffect(() => {
    if (!user) { setFeed(null); setCart([]); setDrawer([]); setMoodboard(undefined); return; }
    ensureSeeds().catch(() => {});
    const offs = [
      subscribeFeed(setFeed, (e) => setFeedError(e)),
      subscribeBooks(setBooks),
      subscribeSub(user.uid, 'cart', (list) => {
        list.sort((a, b) => (a.createdAt?.toMillis?.() ?? Date.now()) - (b.createdAt?.toMillis?.() ?? Date.now()));
        setCart(list);
      }),
      subscribeSub(user.uid, 'drawer', setDrawer),
      subscribeMoodboard(user.uid, setMoodboard),
    ];
    return () => offs.forEach((off) => off());
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const setMember = useCallback(async (nickname) => {
    if (!user) return;
    const tag = member?.tag || String(Math.floor(1000 + Math.random() * 9000));
    await saveMember(user.uid, nickname.trim(), tag);
  }, [user, member?.tag]);

  const signOutMember = useCallback(async () => {
    await signOut(auth);
  }, []);

  const toast = useCallback((text, action) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 5000 : 2600);
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const byId = useMemo(() => {
    const m = new Map();
    (feed || []).forEach((u) => m.set(u.id, u));
    return m;
  }, [feed]);

  // 책별 밑줄 수는 실제 피드에서 센다 (지워지거나 숨겨진 밑줄 제외, 밑줄이 없는 책은 진열하지 않음)
  const booksView = useMemo(() => {
    const counts = {};
    (feed || []).forEach((u) => { counts[u.bookId] = (counts[u.bookId] || 0) + 1; });
    return books.map((b) => ({ ...b, underlineCount: counts[b.id] || 0 })).filter((b) => b.underlineCount > 0);
  }, [books, feed]);

  const cartIds = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);
  const cartItems = useMemo(() => cart.map((c) => byId.get(c.id)).filter(Boolean), [cart, byId]);
  const collectedIds = useMemo(() => new Set(drawer.map((d) => d.id)), [drawer]);

  const flyToCart = useCallback((fromEl) => {
    const target = ['hdr-cart', 'nav-cart']
      .map((id) => document.getElementById(id))
      .find((el) => el && el.getBoundingClientRect().width > 0 && getComputedStyle(el).display !== 'none');
    if (!fromEl || !target || prefersReducedMotion()) return;
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'fly-ghost';
    const size = Math.min(a.width, 120);
    Object.assign(ghost.style, { left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`, width: `${size}px`, height: `${size * 0.7}px` });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = ghost.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.6) rotate(-8deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(.12) rotate(-14deg)`, opacity: 0.4 },
      ],
      { duration: 720, easing: 'cubic-bezier(.5,0,.3,1)' },
    );
    anim.onfinish = () => {
      ghost.remove();
      target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 320 });
    };
  }, []);

  const toggleCart = useCallback(async (u, fromEl) => {
    if (!user) return;
    if (cartIds.has(u.id)) {
      await removeFromCart(user.uid, u.id);
      toast('장바구니에서 뺐어요', { label: '되돌리기', run: () => restoreToCart(user.uid, u.id) });
      return;
    }
    if (cart.length >= CART_MAX) {
      toast(`장바구니는 ${CART_MAX}개까지예요. 하나를 빼고 담아 주세요.`);
      return;
    }
    flyToCart(fromEl);
    try {
      await addToCart(user.uid, u.id);
      const n = cart.length + 1;
      toast(n < 5 ? `담았어요 · 취향 분석까지 ${5 - n}개` : n === 5 ? '5개를 모았어요! 취향 분석이 열렸어요' : '담았어요 · 무드보드가 새로 그려져요');
    } catch (e) {
      console.error(e);
      toast('담지 못했어요. 잠시 뒤 다시 해 주세요.');
    }
  }, [user, cartIds, cart.length, toast, flyToCart]);

  const value = {
    user, isDemo, authReady, authError, member, setMember, signOutMember, signInGoogle, startDemo, feed, feedError, books: booksView, allBooks: books, byId,
    cart, cartIds, cartItems, drawer, collectedIds, moodboard,
    toggleCart, toast, toasts, dismissToast,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
