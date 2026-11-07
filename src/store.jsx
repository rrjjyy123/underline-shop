import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  waitForUser, ensureSeeds, saveMember, subscribeFeed, subscribeBooks, subscribeSub,
  subscribeMoodboard, addToCart, removeFromCart, restoreToCart,
} from './lib/db';
import { CART_MAX } from './lib/taste';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const LS_KEY = 'underline-shop:member';
const readMember = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  } catch {
    return null;
  }
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [member, setMemberState] = useState(readMember);
  const [feed, setFeed] = useState(null);
  const [feedError, setFeedError] = useState(null);
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [drawer, setDrawer] = useState([]);
  const [moodboard, setMoodboard] = useState(undefined);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => {
    waitForUser().then(setUser).catch((e) => setAuthError(e));
  }, []);

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  const setMember = useCallback(async (nickname) => {
    const tag = String(Math.floor(1000 + Math.random() * 9000));
    const m = { nickname: nickname.trim(), tag };
    localStorage.setItem(LS_KEY, JSON.stringify(m));
    setMemberState(m);
    if (user) saveMember(user.uid, m.nickname, tag).catch(() => {});
  }, [user]);

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
    const target = document.getElementById('nav-cart');
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
    user, authError, member, setMember, feed, feedError, books: booksView, allBooks: books, byId,
    cart, cartIds, cartItems, drawer, collectedIds, moodboard,
    toggleCart, toast, toasts, dismissToast,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
