import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { BrandUnderline } from './Paper';
import { IconBag, IconSearch } from './Icons';

const NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/top', label: 'TOP 100' },
  { to: '/explore', label: '둘러보기' },
  { to: '/drawer', label: '내 서랍' },
];

export default function Header() {
  const { member, cart, signOutMember } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const isHome = loc.pathname === '/';

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
    <header className={`gh ${isHome ? 'gh-home' : 'gh-sub'}`}>
      <div className="gh-inner">
        <Link to="/" className="gh-logo" aria-label="밑줄상점 홈">
          <span className="gh-logo-text">밑줄상점</span>
          <BrandUnderline className="gh-logo-ul" />
        </Link>

        <nav className="gh-nav" aria-label="주요 메뉴">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}>{n.label}</NavLink>
          ))}
        </nav>

        <form className="gh-search" onSubmit={search} role="search">
          <IconSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="문장, 책, 작가를 찾아보세요" aria-label="검색어" />
        </form>

        <div className="gh-actions">
          <Link to="/search" className="icon-btn gh-search-btn" aria-label="검색"><IconSearch /></Link>
          <Link to="/post" className="gh-post">＋ 밑줄 올리기</Link>
          <Link to="/cart" id="hdr-cart" className="icon-btn gh-cart" aria-label={`장바구니 ${cart.length}개`}>
            <IconBag />
            {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </Link>
          <div className="gh-profile" ref={menuRef}>
            <button className="avatar" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="내 메뉴">
              {member.nickname.slice(0, 1)}
            </button>
            {menu && (
              <div className="menu profile-menu" role="menu">
                <p className="pm-name"><b>{member.nickname}</b><span>#{member.tag}</span></p>
                <Link role="menuitem" to="/drawer">내 서랍</Link>
                <Link role="menuitem" to="/cart">장바구니 · 무드보드</Link>
                <button role="menuitem" onClick={signOutMember}>로그아웃</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
