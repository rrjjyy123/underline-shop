import { useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Paper } from './Paper';
import { IconBag, IconBagFilled, IconCompass, IconDrawer, IconHome, IconPlus, IconBack } from './Icons';

export function SentenceCard({ u }) {
  const { cartIds, toggleCart } = useApp();
  const ref = useRef(null);
  const inCart = cartIds.has(u.id);
  return (
    <article className="card" ref={ref}>
      <Link to={`/u/${u.id}`} className="card-link" aria-label={`${u.bookTitle} 문장 자세히 보기`}>
        <Paper u={u} />
      </Link>
      <div className="card-meta">
        <span className="nick" title={u.nickname}>{u.isSeed ? '큐레이션' : u.nickname}</span>
        <span className="count">담김 {u.cartCount || 0}</span>
        <button
          type="button"
          className={`bag-btn ${inCart ? 'on' : ''}`}
          aria-pressed={inCart}
          aria-label={inCart ? '장바구니에서 빼기' : '장바구니에 담기'}
          onClick={() => toggleCart(u, ref.current)}
        >
          {inCart ? <IconBagFilled /> : <IconBag />}
        </button>
      </div>
      {u.keywords?.[0] && <p className="card-tag">#{u.keywords.join(' #')}</p>}
    </article>
  );
}

export function Masonry({ items, empty }) {
  if (!items) return <SkeletonGrid />;
  if (!items.length) return empty || null;
  return (
    <div className="masonry">
      {items.map((u) => <SentenceCard key={u.id} u={u} />)}
    </div>
  );
}

export function SkeletonGrid({ n = 8 }) {
  const hs = [180, 240, 150, 210, 260, 170, 200, 230];
  return (
    <div className="masonry" aria-busy="true" aria-label="문장을 불러오는 중">
      {Array.from({ length: n }).map((_, i) => (
        <div className="card skeleton" key={i}>
          <div className="sk-paper" style={{ height: hs[i % hs.length] }}>
            <span /><span /><span className="short" />
          </div>
          <div className="sk-meta" />
        </div>
      ))}
    </div>
  );
}

export function Segmented({ value, options, onChange, label }) {
  const idx = options.findIndex((o) => o.value === value);
  return (
    <div className="segmented" role="tablist" aria-label={label} style={{ '--n': options.length, '--i': idx }}>
      <span className="seg-thumb" aria-hidden />
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ChipBar({ tags, active, onToggle, multi = false }) {
  return (
    <div className="chipbar" role="group" aria-label="분위기 해시태그">
      {tags.map((t) => {
        const on = multi ? active.includes(t) : active === t;
        return (
          <button key={t} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => onToggle(t)}>
            #{t}
          </button>
        );
      })}
    </div>
  );
}

export function BottomNav() {
  const { cart } = useApp();
  const tab = (to, label, Icon, end) => (
    <NavLink to={to} end={end} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
      <Icon />
      <span>{label}</span>
    </NavLink>
  );
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      <div className="nav-inner">
        {tab('/', 'HOME', IconHome, true)}
        {tab('/explore', 'EXPLORE', IconCompass)}
        <NavLink to="/post" className="tab post-tab" aria-label="문장 올리기">
          <span className="post-fab"><IconPlus /></span>
          <span>POST</span>
        </NavLink>
        <NavLink to="/cart" id="nav-cart" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <span className="bag-wrap">
            <IconBag />
            {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </span>
          <span>CART</span>
        </NavLink>
        {tab('/drawer', 'DRAWER', IconDrawer)}
      </div>
    </nav>
  );
}

export function TopBar({ title, right, sub }) {
  const nav = useNavigate();
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))} aria-label="뒤로">
        <IconBack />
      </button>
      <div className="topbar-title">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div className="topbar-right">{right}</div>
    </header>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <span>{t.text}</span>
          {t.action && (
            <button onClick={() => { t.action.run(); dismissToast(t.id); }}>{t.action.label}</button>
          )}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, desc, action }) {
  return (
    <div className="empty">
      <div className="empty-paper" aria-hidden>
        <span />
        <span />
        <span className="short" />
      </div>
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
      {action}
    </div>
  );
}
