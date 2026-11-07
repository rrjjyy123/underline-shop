import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from './store';
import { BottomNav, Toasts } from './components/UI';
import Enter from './pages/Enter';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Collection from './pages/Collection';
import Book from './pages/Book';
import Detail from './pages/Detail';
import Post from './pages/Post';
import Cart from './pages/Cart';
import Drawer from './pages/Drawer';

export default function App() {
  const { member, authError, feedError } = useApp();
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);

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
  if (!member) return <Enter />;

  return (
    <>
      <main className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/c/:id" element={<Collection />} />
          <Route path="/book/:id" element={<Book />} />
          <Route path="/u/:id" element={<Detail />} />
          <Route path="/post" element={<Post />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/drawer" element={<Drawer />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!loc.pathname.startsWith('/post') && !loc.pathname.startsWith('/u/') && <BottomNav />}
      <Toasts />
    </>
  );
}
