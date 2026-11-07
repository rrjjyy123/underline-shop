import { useEffect, useState } from 'react';
import { useApp, prefersReducedMotion } from '../store';
import { checkNickname } from '../lib/guard';

const WORDS = ['옷을', '음악을', '향수를', '문장을'];

export default function Enter() {
  const { setMember, user } = useApp();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [wi, setWi] = useState(prefersReducedMotion() ? 3 : 0);

  useEffect(() => {
    if (wi >= WORDS.length - 1) return;
    const t = setTimeout(() => setWi((i) => i + 1), 900);
    return () => clearTimeout(t);
  }, [wi]);

  const submit = (e) => {
    e.preventDefault();
    const msg = checkNickname(name);
    if (msg) return setErr(msg);
    setMember(name);
  };

  return (
    <div className="enter">
      <div className="enter-inner">
        <p className="eyebrow">TEXT SELECT SHOP</p>
        <h1 className="logo-big">
          밑줄<span>상점</span>
        </h1>
        <p className="slogan">
          <span className="swap" key={wi}>{WORDS[wi]}</span> 쇼핑하듯,
          <br />
          문장을 쇼핑하다.
        </p>
        <p className="slogan-en">Shop texts. Show yourself.</p>

        <div className="enter-steps" aria-label="이용 순서">
          <div><b>01</b><span>문장 구경</span></div>
          <div><b>02</b><span>장바구니에 담기</span></div>
          <div><b>03</b><span>5개면 취향 무드보드</span></div>
        </div>

        <form onSubmit={submit} className="enter-form">
          <label className={`float-field ${name ? 'filled' : ''} ${err ? 'has-err' : ''}`}>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(''); }}
              maxLength={12}
              autoComplete="off"
              aria-describedby="nick-help"
            />
            <span>닉네임</span>
          </label>
          <p id="nick-help" className={err ? 'field-err' : 'field-help'}>
            {err || '실명 대신 닉네임을 써 주세요. 기록은 이 기기에 저장돼요.'}
          </p>
          <button className="btn-primary wide" disabled={!user}>
            {user ? '상점 들어가기' : '여는 중…'}
          </button>
        </form>
      </div>
    </div>
  );
}
