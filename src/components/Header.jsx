import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { IconBag, IconSearch } from './Icons';

export const MENU = [
  { to: '/', label: '추천', end: true },
  { to: '/top', label: '랭킹' },
  { to: '/new', label: '신상' },
  { to: '/explore', label: '탐색' },
  { to: '/mood', label: '내 무드보드' },
  { to: '/boards', label: '무드보드 갤러리' },
  { to: '/drawer', label: '내 서랍' },
];
// 모바일에서 전체 헤더(검색·메뉴 탭)를 보여 줄 화면
const TAB_PAGES = ['/', '/top', '/new', '/explore', '/mood', '/boards', '/drawer'];

export default function Header() {
  const { member, cart, signOutMember } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const isTabPage = TAB_PAGES.includes(loc.pathname);

  useEffect(() => {
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  useEffect(() => setMenu(false), [loc.pathname]);

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <header className={`hd ${isTabPage ? 'hd-tab' : 'hd-sub'}`}>
        <div className="hd-in">
          <Link to="/" className="logo" aria-label="밑줄상점 홈">밑줄상점</Link>
          <form className="hsearch" onSubmit={search} role="search">
            <IconSearch />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="책 제목 · 작가 · 문장 · 키워드 검색" aria-label="검색어" enterKeyHint="search" />
            {q && <button type="button" className="clr" onClick={() => setQ('')} aria-label="검색어 지우기">✕</button>}
          </form>
          <div className="hutil">
            <Link to="/post" className="postbtn">＋ 문장 올리기</Link>
            <Link to="/cart" id="hdr-cart" className="ico" aria-label={`장바구니 ${cart.length}개`}>
              <IconBag />
              {cart.length > 0 && <span className="bd">{cart.length}</span>}
            </Link>
            <div className="prof-wrap" ref={menuRef}>
              <button className="prof" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="내 계정">
                <span className="pa">{member.nickname.slice(0, 1)}</span>
                <span className="pn">{member.nickname}</span>
              </button>
              {menu && (
                <div className="menu profile-menu" role="menu">
                  <p className="pm-name"><b>{member.nickname}</b><span>#{member.tag}</span></p>
                  <Link role="menuitem" to="/mood">내 무드보드</Link>
                  <Link role="menuitem" to="/board">무드보드 꾸미기</Link>
                  <Link role="menuitem" to="/drawer">내 서랍</Link>
                  <button role="menuitem" onClick={signOutMember}>로그아웃</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <nav className={`mtabs ${isTabPage ? 'hd-tab' : 'hd-sub'}`} aria-label="주요 메뉴">
        <div className="in">
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => (isActive ? 'on' : '')}>{m.label}</NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
