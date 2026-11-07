import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from './store';
import { BottomNav, Toasts } from './components/UI';
import Header from './components/Header';
import Landing from './pages/Landing';
import Enter from './pages/Enter';
import Home from './pages/Home';
import Top from './pages/Top';
import Search from './pages/Search';
import Explore from './pages/Explore';
import Collection from './pages/Collection';
import Book from './pages/Book';
import Detail from './pages/Detail';
import Post from './pages/Post';
import Cart from './pages/Cart';
import Drawer from './pages/Drawer';
import BoardEdit from './pages/BoardEdit';
import BoardView from './pages/BoardView';
import Boards from './pages/Boards';
import Mood from './pages/Mood';
import New from './pages/New';

const SS_KEY = 'underline-shop:entered';
const seenLanding = () => {
  try { return sessionStorage.getItem(SS_KEY) === '1'; } catch { return false; }
};

export default function App() {
  const { user, member, authReady, authError, feedError } = useApp();
  const loc = useLocation();
  const [entered, setEntered] = useState(seenLanding);
  const [arriving, setArriving] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);

  const finishLanding = () => {
    try { sessionStorage.setItem(SS_KEY, '1'); } catch { /* 저장 못 해도 진행 */ }
    setArriving(true);
    setEntered(true);
    setTimeout(() => setArriving(false), 900);
  };

  const err = authError || feedError;
  if (err) {
    return (
      <div className="fatal">
        <h1>밑줄상점</h1>
        <p>서버에 연결하지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.</p>
        <code>{err.code || err.message}</code>
      </div>
    );
  }
  if (!entered) return <Landing onEntered={finishLanding} />;
  if (!authReady || (user && member === undefined)) {
    return <div className="enter"><p className="loading-line">불을 켜는 중…</p></div>;
  }
  if (!user || !member) return <div className={arriving ? 'arrive' : ''}><Enter /></div>;

  const hideBottom = loc.pathname.startsWith('/post') || loc.pathname.startsWith('/u/') || loc.pathname === '/board';
  return (
    <div className={arriving ? 'arrive' : ''}>
      <Header />
      <main className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/top" element={<Top />} />
          <Route path="/new" element={<New />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/search" element={<Search />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/c/:id" element={<Collection />} />
          <Route path="/book/:id" element={<Book />} />
          <Route path="/u/:id" element={<Detail />} />
          <Route path="/post" element={<Post />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/drawer" element={<Drawer />} />
          <Route path="/board" element={<BoardEdit />} />
          <Route path="/boards" element={<Boards />} />
          <Route path="/b/:uid" element={<BoardView />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!hideBottom && <BottomNav />}
      <Toasts />
    </div>
  );
}
