import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store';
import { sameMood } from '../lib/taste';
import { deleteUnderline, reportUnderline } from '../lib/db';
import { Paper } from '../components/Paper';
import { Masonry, TopBar, EmptyState } from '../components/UI';
import { IconBag, IconBagFilled, IconBook, IconCopy, IconMore } from '../components/Icons';

const REPORT_REASONS = ['욕설·비하 표현', '개인정보가 들어 있음', '출처가 틀림', '기타'];

export default function Detail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { feed, byId, user, cartIds, toggleCart, toast } = useApp();
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const cardRef = useRef(null);
  const u = byId.get(id);

  const sameBook = useMemo(() => (feed && u ? feed.filter((x) => x.bookId === u.bookId && x.id !== u.id).slice(0, 6) : []), [feed, u]);
  const similar = useMemo(() => (feed && u ? sameMood(feed, u, 6).filter((x) => x.bookId !== u.bookId) : []), [feed, u]);

  if (!feed) return <div className="page"><TopBar title="밑줄" /></div>;
  if (!u) {
    return (
      <div className="page">
        <TopBar title="밑줄" />
        <EmptyState title="문장을 찾을 수 없어요" desc="삭제되었거나 숨겨진 문장이에요." action={<Link to="/" className="btn-ghost">홈으로</Link>} />
      </div>
    );
  }

  const inCart = cartIds.has(u.id);
  const mine = u.authorId === user?.uid;

  const copy = async () => {
    setMenu(false);
    try {
      await navigator.clipboard.writeText(`${u.sentence}\n— ${u.author}, 「${u.bookTitle}」`);
      toast('문장을 복사했어요');
    } catch {
      toast('복사하지 못했어요');
    }
  };
  const report = async (reason) => {
    setReporting(false);
    try {
      await reportUnderline(user.uid, u.id, reason);
      toast('신고가 접수됐어요. 신고가 쌓이면 자동으로 숨겨져요.');
    } catch {
      toast('이미 신고한 문장이에요.');
    }
  };
  const remove = async () => {
    setMenu(false);
    if (!window.confirm('이 밑줄을 지울까요? 지우면 되돌릴 수 없어요.')) return;
    await deleteUnderline(u.id);
    toast('밑줄을 지웠어요');
    nav('/drawer');
  };

  return (
    <div className="page detail">
      <TopBar
        title={u.bookTitle}
        sub={u.author}
        right={
          <div className="menu-wrap">
            <button className="icon-btn" aria-label="더보기" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><IconMore /></button>
            {menu && (
              <div className="menu" role="menu">
                <button role="menuitem" onClick={copy}><IconCopy /> 문장 복사</button>
                {mine ? (
                  <button role="menuitem" className="danger" onClick={remove}>내 밑줄 지우기</button>
                ) : (
                  <button role="menuitem" className="danger" onClick={() => { setMenu(false); setReporting(true); }}>신고하기</button>
                )}
              </div>
            )}
          </div>
        }
      />

      <div className="detail-card" ref={cardRef}>
        <Paper u={u} variant="large" highlight />
      </div>

      <section className="detail-info">
        <Link to={`/book/${u.bookId}`} className="book-link">
          <IconBook />
          <span>
            <b>「{u.bookTitle}」</b> {u.author}{u.page ? ` · ${u.page}쪽` : ''}
          </span>
          <span className="arrow">이 책의 밑줄 보기 ›</span>
        </Link>

        {u.reason && (
          <div className="memo">
            <p className="memo-label">{u.isSeed ? '큐레이터의 한마디' : `${u.nickname}의 한마디`}</p>
            <p className="memo-text">{u.reason}</p>
          </div>
        )}

        {u.keywords?.length > 0 && (
          <div className="tag-row">
            {u.keywords.map((k) => <Link key={k} to="/" state={{ tag: k }} className="torn">#{k}</Link>)}
          </div>
        )}
      </section>

      {sameBook.length > 0 && (
        <section>
          <div className="section-head"><h2>같은 책의 다른 밑줄</h2></div>
          <Masonry items={sameBook} />
        </section>
      )}
      {similar.length > 0 && (
        <section>
          <div className="section-head"><h2>비슷한 분위기의 문장</h2></div>
          <Masonry items={similar} />
        </section>
      )}

      <div className="buy-bar">
        <div className="buy-count">
          <b>{u.cartCount || 0}</b>
          <span>명이 담았어요</span>
        </div>
        <button className={`btn-primary buy ${inCart ? 'in' : ''}`} onClick={() => toggleCart(u, cardRef.current)} aria-pressed={inCart}>
          {inCart ? <IconBagFilled /> : <IconBag />}
          {inCart ? '장바구니에 있어요' : '장바구니 담기'}
        </button>
      </div>

      {reporting && (
        <div className="sheet-backdrop" onClick={() => setReporting(false)}>
          <div className="sheet" role="dialog" aria-label="신고 사유" onClick={(e) => e.stopPropagation()}>
            <h3>왜 신고하나요?</h3>
            {REPORT_REASONS.map((r) => <button key={r} className="sheet-item" onClick={() => report(r)}>{r}</button>)}
            <button className="btn-ghost wide" onClick={() => setReporting(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
