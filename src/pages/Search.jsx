import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../store';
import { HOME_TAGS } from '../data/keywords';
import { EmptyState, Masonry } from '../components/UI';
import { IconSearch } from '../components/Icons';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const { feed, books } = useApp();
  const [q, setQ] = useState(params.get('q') || '');
  const term = (params.get('q') || '').trim();

  const results = useMemo(() => {
    if (!feed || !term) return null;
    return feed.filter((u) => `${u.sentence} ${u.bookTitle} ${u.author} ${u.nickname} ${(u.keywords || []).join(' ')}`.includes(term));
  }, [feed, term]);
  const bookHits = useMemo(() => (term ? books.filter((b) => `${b.title} ${b.author}`.includes(term)).slice(0, 8) : []), [books, term]);

  const submit = (e) => {
    e.preventDefault();
    setParams(q.trim() ? { q: q.trim() } : {});
  };

  return (
    <div className="page search-page">
      <form className="search-row big" onSubmit={submit} role="search">
        <IconSearch />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="문장, 책 제목, 작가, #분위기" aria-label="검색어" />
        <button className="btn-primary small-btn">찾기</button>
      </form>

      {!term && (
        <section>
          <div className="section-head"><h2>이런 분위기는 어때요?</h2></div>
          <div className="chipbar wrap">
            {HOME_TAGS.map((t) => <button key={t} className="chip" onClick={() => { setQ(t); setParams({ q: t }); }}>#{t}</button>)}
          </div>
        </section>
      )}

      {bookHits.length > 0 && (
        <section>
          <div className="section-head"><h2>책</h2></div>
          <ul className="book-list">
            {bookHits.map((b) => (
              <li key={b.id}><Link to={`/book/${b.id}`}><span className="book-dot" style={{ background: b.coverColor }} /><span className="bt">{b.title}</span><span className="ba">{b.author}</span><span className="bn">밑줄 {b.underlineCount}</span></Link></li>
            ))}
          </ul>
        </section>
      )}

      {term && (
        <section>
          <div className="section-head"><h2>“{term}” 문장 {results?.length ?? ''}</h2></div>
          <Masonry items={results} empty={<EmptyState title="찾는 문장이 없어요" desc="다른 단어로 찾아보거나, 그 문장을 직접 진열해 보세요." action={<Link to="/post" className="btn-primary">밑줄 올리기</Link>} />} />
        </section>
      )}
    </div>
  );
}
