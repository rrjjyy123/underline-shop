import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../store';
import { COLLECTIONS } from '../data/keywords';
import { Masonry, TopBar, EmptyState } from '../components/UI';

export default function Collection() {
  const { id } = useParams();
  const { feed } = useApp();
  const c = COLLECTIONS.find((x) => x.id === id);
  const list = useMemo(() => {
    if (!feed || !c) return null;
    const score = (u) => c.tags.filter((t) => u.keywords?.includes(t)).length;
    return feed.filter((u) => score(u) > 0).sort((a, b) => score(b) - score(a) || (b.cartCount || 0) - (a.cartCount || 0));
  }, [feed, c]);
  if (!c) return <div className="page"><TopBar title="큐레이션" /><EmptyState title="없는 컬렉션이에요" /></div>;
  return (
    <div className="page">
      <TopBar title={c.title} sub={c.tags.map((t) => `#${t}`).join(' ')} />
      <p className="lead">{c.sub}</p>
      <Masonry items={list} empty={<EmptyState title="아직 문장이 없어요" />} />
    </div>
  );
}
