import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../store';
import { Masonry, Segmented, TopBar, EmptyState } from '../components/UI';
import { sortFeed } from './Home';

const SORTS = [
  { value: 'new', label: '최신순' },
  { value: 'hot', label: '많이 담긴 순' },
];

// 레퍼런스(상품 상세 → 스타일 피드)에 대응하는 화면: 책 한 권의 밑줄 피드
export default function Book() {
  const { id } = useParams();
  const { feed, books, allBooks, cartItems } = useApp();
  const [sort, setSort] = useState('new');
  const [similar, setSimilar] = useState(false);
  const book = books.find((b) => b.id === id) || { ...allBooks.find((b) => b.id === id), underlineCount: 0 };

  const myKeys = useMemo(() => new Set(cartItems.flatMap((u) => u.keywords || [])), [cartItems]);
  const list = useMemo(() => {
    if (!feed) return null;
    let l = feed.filter((u) => u.bookId === id);
    if (similar) l = l.filter((u) => u.keywords?.some((k) => myKeys.has(k)));
    return sortFeed(l, sort);
  }, [feed, id, sort, similar, myKeys]);

  return (
    <div className="page">
      <TopBar title="밑줄" />
      <div className="book-bar">
        <span className="book-cover" style={{ '--c': book?.coverColor || '#2f3e46' }} aria-hidden>
          <span>{book?.title?.slice(0, 4)}</span>
        </span>
        <div>
          <h2>{book?.title || '…'}</h2>
          <p>{book?.author} · 밑줄 {book?.underlineCount ?? 0}개{book?.isClassic ? ' · 고전' : ''}</p>
        </div>
      </div>
      <div className="filter-row">
        <label className={`check ${myKeys.size === 0 ? 'disabled' : ''}`} title={myKeys.size === 0 ? '장바구니에 문장을 담으면 쓸 수 있어요' : ''}>
          <input type="checkbox" checked={similar} disabled={myKeys.size === 0} onChange={(e) => setSimilar(e.target.checked)} />
          <span className="box" aria-hidden />
          나와 비슷한 취향
        </label>
        <Segmented value={sort} options={SORTS} onChange={setSort} label="정렬" />
      </div>
      <Masonry
        items={list}
        empty={
          <EmptyState
            title={similar ? '비슷한 취향의 밑줄이 아직 없어요' : '아직 밑줄이 없어요'}
            desc="이 책의 첫 밑줄을 올려 볼까요?"
            action={<Link className="btn-primary" to={`/post?book=${id}`}>밑줄 올리기</Link>}
          />
        }
      />
      <Link to={`/post?book=${id}`} className="float-post">
        <span>＋</span> 밑줄 올리기
      </Link>
    </div>
  );
}
