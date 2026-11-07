import { useState } from 'react';
import { useApp } from '../store';
import { checkNickname } from '../lib/guard';

const GoogleMark = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const AUTH_MSG = {
  'auth/popup-closed-by-user': '로그인 창이 닫혔어요. 다시 눌러 주세요.',
  'auth/cancelled-popup-request': '로그인 창이 닫혔어요. 다시 눌러 주세요.',
  'auth/popup-blocked': '브라우저가 로그인 창을 막았어요. 팝업을 허용해 주세요.',
  'auth/unauthorized-domain': '이 주소에서는 아직 구글 로그인이 허용되지 않았어요. (Firebase 승인된 도메인 확인 필요)',
  'auth/operation-not-allowed': '구글 로그인이 아직 켜져 있지 않아요. (Firebase 콘솔에서 Google 사용 설정 필요)',
  'auth/network-request-failed': '인터넷 연결을 확인해 주세요.',
};

// 문을 열고 들어온 뒤: 구글로 로그인 → (처음 한 번) 닉네임 정하기
export default function Enter() {
  const { user, member, setMember, signInGoogle, signOutMember } = useApp();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const needNickname = !!user && member === null;

  const login = async () => {
    setErr('');
    setBusy(true);
    try {
      await signInGoogle();
    } catch (e) {
      console.error(e);
      setErr(AUTH_MSG[e.code] || `로그인하지 못했어요. (${e.code || e.message})`);
    } finally {
      setBusy(false);
    }
  };

  const saveName = async (e) => {
    e.preventDefault();
    const msg = checkNickname(name);
    if (msg) return setErr(msg);
    setBusy(true);
    try {
      await setMember(name);
    } catch {
      setErr('저장하지 못했어요. 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  return (
    <div className="enter">
      <div className="enter-card">
        <span className="enter-tape" aria-hidden />
        <p className="eyebrow">{needNickname ? 'GUEST BOOK' : 'WELCOME'}</p>
        <h1 className="enter-logo">밑줄<span>상점</span></h1>

        {!needNickname ? (
          <>
            <p className="enter-hi">어서 오세요. 구글 계정으로 들어오면<br />장바구니와 서랍이 어느 기기에서나 그대로예요.</p>
            <button className="google-btn" onClick={login} disabled={busy}>
              <GoogleMark />
              <span>{busy ? '로그인 창을 여는 중…' : 'Google로 시작하기'}</span>
            </button>
            {err && <p className="field-err mt8" role="alert">{err}</p>}
            <p className="field-help mt12">로그인하면 구글 계정의 이름·사진은 다른 사람에게 보이지 않아요. 상점에서는 직접 정한 닉네임만 보여요.</p>
          </>
        ) : (
          <form onSubmit={saveName} className="enter-form">
            <p className="enter-hi">방명록에 남길 닉네임을 정해 주세요.<br />친구들에게는 이 이름만 보여요.</p>
            <label className={`float-field ${name ? 'filled' : ''} ${err ? 'has-err' : ''}`}>
              <input value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} maxLength={12} autoComplete="off" autoFocus aria-describedby="nick-help" />
              <span>닉네임</span>
            </label>
            <p id="nick-help" className={err ? 'field-err' : 'field-help'}>{err || '실명 대신 닉네임을 써 주세요. (2~12자)'}</p>
            <button className="btn-primary wide" disabled={busy}>{busy ? '저장 중…' : '입장하기'}</button>
            <button type="button" className="link-btn" onClick={signOutMember}>다른 계정으로 로그인</button>
          </form>
        )}
      </div>
    </div>
  );
}
