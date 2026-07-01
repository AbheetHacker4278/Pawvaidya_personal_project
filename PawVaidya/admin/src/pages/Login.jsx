import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FaceAuth from '../components/FaceAuth';

const S = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.lr{height:100vh;max-height:100vh;display:flex;overflow:hidden;background:#060e06;font-family:'Inter',sans-serif;}
html,body{height:100%;overflow:hidden;}

/* LEFT */
.ll{display:none;flex:1;flex-direction:column;padding:2rem 2.5rem;height:100vh;overflow:hidden;
  background:
    radial-gradient(ellipse at 15% 20%, rgba(34,197,94,.18) 0%, transparent 45%),
    radial-gradient(ellipse at 80% 70%, rgba(212,175,55,.10) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 100%, rgba(22,163,74,.12) 0%, transparent 50%),
    linear-gradient(160deg,#071407 0%,#050e05 50%,#080a04 100%);
  position:relative;overflow:hidden;}
@media(min-width:1024px){.ll{display:flex;}}
.ll::before{content:'';position:absolute;top:-80px;right:-60px;width:380px;height:380px;border-radius:50%;
  background:radial-gradient(circle,rgba(34,197,94,.22) 0%,rgba(212,175,55,.06) 50%,transparent 70%);pointer-events:none;
  animation:glow-drift 6s ease-in-out infinite alternate;}
.ll::after{content:'';position:absolute;bottom:-60px;left:-60px;width:280px;height:280px;border-radius:50%;
  background:radial-gradient(circle,rgba(212,175,55,.12) 0%,rgba(34,197,94,.07) 50%,transparent 70%);pointer-events:none;}
.ll-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(34,197,94,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,.04) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;}
.ll-gold-ray{position:absolute;top:0;right:30%;width:2px;height:100%;background:linear-gradient(180deg,transparent,rgba(212,175,55,.15),transparent);pointer-events:none;transform:skewX(-20deg);}
@keyframes glow-drift{0%{transform:scale(1) translate(0,0);}100%{transform:scale(1.12) translate(20px,-20px);}}

.brand{display:flex;align-items:center;gap:.7rem;margin-bottom:1.8rem;}
.brand-icon{width:44px;height:44px;background:linear-gradient(135deg,#15803d,#22c55e,#d4af37);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;box-shadow:0 0 22px rgba(34,197,94,.5),0 0 8px rgba(212,175,55,.25);}
.brand-name{font-size:1.1rem;font-weight:800;color:#f1f5f9;line-height:1.1;}
.brand-sub{font-size:.6rem;font-weight:600;color:#86efac;letter-spacing:.15em;text-transform:uppercase;}

.welcome-badge{display:inline-flex;align-items:center;gap:.4rem;background:linear-gradient(90deg,rgba(34,197,94,.12),rgba(212,175,55,.08));border:1px solid rgba(34,197,94,.3);border-radius:20px;padding:.3rem .75rem;font-size:.72rem;font-weight:600;color:#4ade80;margin-bottom:1.2rem;box-shadow:0 0 12px rgba(34,197,94,.1);}
.welcome-badge span{width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block;animation:pulse 1.5s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}

.hl h1{font-size:2.4rem;font-weight:900;color:#f1f5f9;line-height:1.1;margin-bottom:.15rem;}
.hl .green{background:linear-gradient(90deg,#22c55e,#86efac,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.tagline{font-size:.82rem;color:#475569;line-height:1.6;margin-bottom:1.8rem;max-width:340px;}
.tagline span{color:#22c55e;}

/* 3D illustration area */
.illus{display:flex;justify-content:flex-end;align-items:center;position:absolute;top:60px;right:0;width:260px;height:260px;pointer-events:none;}
.illus-ring{width:220px;height:220px;border-radius:50%;background:radial-gradient(circle at 40% 40%,rgba(34,197,94,.2) 0%,rgba(212,175,55,.06) 50%,transparent 70%);display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 0 60px rgba(34,197,94,.12);}
.shield-main{width:100px;height:110px;background:linear-gradient(145deg,#1a2e1a,#0f1f0f);border:2px solid rgba(34,197,94,.5);border-radius:50% 50% 40% 40%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;box-shadow:0 0 40px rgba(34,197,94,.35),inset 0 1px 0 rgba(34,197,94,.2);position:relative;z-index:2;}
.float-card{position:absolute;background:rgba(20,30,20,.9);border:1px solid rgba(34,197,94,.25);border-radius:12px;padding:.5rem .7rem;display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 4px 20px rgba(0,0,0,.4);}
.fc1{top:10px;right:30px;width:44px;height:44px;background:rgba(30,20,50,.9);border-color:rgba(139,92,246,.3);}
.fc2{bottom:30px;right:10px;width:44px;height:44px;}
.fc3{bottom:20px;left:20px;width:44px;height:44px;background:rgba(20,20,30,.9);}
.platform{width:160px;height:18px;background:linear-gradient(90deg,rgba(34,197,94,.3),rgba(34,197,94,.1));border-radius:50%;position:absolute;bottom:10px;left:50%;transform:translateX(-50%);filter:blur(6px);}

/* Feature cards */
.feat-list{display:flex;flex-direction:column;gap:.65rem;margin-top:auto;}
.feat{display:flex;align-items:center;gap:.85rem;background:rgba(255,255,255,.03);border:1px solid rgba(34,197,94,.08);border-radius:14px;padding:.85rem 1rem;transition:border-color .25s,background .25s,box-shadow .25s;}
.feat:hover{border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.04);box-shadow:0 0 18px rgba(212,175,55,.07);}
.feat-ic{width:40px;height:40px;flex-shrink:0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;}
.fi-green{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.2);}
.fi-purple{background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.2);}
.fi-teal{background:rgba(20,184,166,.15);border:1px solid rgba(20,184,166,.2);}
.feat-body{flex:1;}
.feat-title{font-size:.82rem;font-weight:700;color:#e2e8f0;margin-bottom:.12rem;}
.feat-desc{font-size:.72rem;color:#64748b;line-height:1.4;}
.feat-badge{font-size:.65rem;font-weight:700;padding:.2rem .55rem;border-radius:20px;}
.live-badge{background:rgba(139,92,246,.2);color:#a78bfa;border:1px solid rgba(139,92,246,.3);display:flex;align-items:center;gap:.3rem;}
.live-dot{width:6px;height:6px;border-radius:50%;background:#a78bfa;animation:pulse 1.5s infinite;}

/* Trust bar */
.trust{display:flex;align-items:center;gap:.75rem;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:.7rem 1rem;margin-top:.65rem;}
.trust-text .t1{font-size:.78rem;font-weight:600;color:#e2e8f0;}
.trust-text .t2{font-size:.65rem;color:#64748b;}
.avatars{display:flex;margin-left:auto;}
.av{width:28px;height:28px;border-radius:50%;border:2px solid #0a0a0a;background:linear-gradient(135deg,#22c55e,#16a34a);display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700;color:#fff;margin-left:-8px;}
.av:first-child{margin-left:0;}
.av-count{font-size:.72rem;font-weight:700;color:#22c55e;margin-left:.5rem;white-space:nowrap;}

/* RIGHT */
.lr-right{width:100%;background:transparent;display:flex;align-items:center;justify-content:center;padding:1.25rem;position:relative;height:100vh;overflow-y:auto;}
@media(min-width:1024px){.lr-right{width:420px;flex-shrink:0;border-left:1px solid rgba(212,175,55,.10);}}

.form-card{width:100%;max-width:360px;background:transparent;border:none;padding:0;}

.av-wrap{width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,rgba(34,197,94,.15),rgba(212,175,55,.08));border:2px solid rgba(34,197,94,.4);display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin:0 auto .75rem;box-shadow:0 0 24px rgba(34,197,94,.25);}
.ft{font-size:1.4rem;font-weight:800;color:#f1f5f9;text-align:center;margin-bottom:.15rem;}
.fs{font-size:.6rem;color:#475569;text-align:center;letter-spacing:.13em;text-transform:uppercase;margin-bottom:1rem;}

.tabs{display:flex;background:transparent;border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:3px;margin-bottom:1rem;}
.tab{flex:1;padding:.38rem;font-size:.78rem;font-weight:600;border:none;background:transparent;color:#64748b;border-radius:7px;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;}
.tab.on{background:linear-gradient(135deg,#15803d,#22c55e);color:#fff;box-shadow:0 2px 10px rgba(34,197,94,.3);}

.fl{font-size:.6rem;font-weight:600;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.28rem;display:block;}
.iw{position:relative;margin-bottom:.75rem;}
.ii{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:.8rem;color:#475569;}
.ii-r{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:.8rem;color:#475569;cursor:pointer;background:none;border:none;}
.inp{width:100%;padding:.6rem .85rem .6rem 2.3rem;background:transparent;border:1px solid rgba(34,197,94,.3);border-radius:9px;color:#f1f5f9;font-size:.82rem;font-family:'Inter',sans-serif;outline:none;transition:border-color .2s,box-shadow .2s;}
.inp::placeholder{color:#4d6b55;}
.inp:focus{border-color:rgba(34,197,94,.7);box-shadow:0 0 0 3px rgba(34,197,94,.1);}

.opts{display:flex;align-items:center;justify-content:space-between;margin-bottom:.9rem;}
.rl{display:flex;align-items:center;gap:.4rem;font-size:.74rem;color:#64748b;cursor:pointer;}
.rl input{accent-color:#22c55e;width:13px;height:13px;}
.fp{font-size:.74rem;color:#22c55e;background:none;border:none;font-family:'Inter',sans-serif;cursor:pointer;}
.fp:hover{text-decoration:underline;}

.sbtn{width:100%;padding:.7rem;background:linear-gradient(135deg,#15803d,#22c55e);color:#fff;border:none;border-radius:9px;font-size:.84rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;font-family:'Inter',sans-serif;transition:opacity .2s,transform .1s;box-shadow:0 4px 18px rgba(34,197,94,.3);}
.sbtn:hover{opacity:.9;transform:translateY(-1px);}
.fbtn{width:100%;margin-top:.55rem;padding:.62rem;background:transparent;border:1px solid rgba(34,197,94,.25);color:#86efac;border-radius:9px;font-size:.8rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:border-color .2s,color .2s;display:flex;align-items:center;justify-content:center;gap:.5rem;}
.fbtn:hover{border-color:rgba(34,197,94,.6);color:#4ade80;}

.sec{margin-top:.9rem;text-align:center;font-size:.6rem;color:#334155;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:.35rem;}

/* Location gate */
.loc{text-align:center;background:transparent;border:1px solid rgba(34,197,94,.25);border-radius:14px;padding:1.6rem;}
.loc h3{font-size:1rem;font-weight:700;color:#f1f5f9;margin-bottom:.5rem;}
.loc p{font-size:.8rem;color:#64748b;margin-bottom:1.2rem;line-height:1.5;}
.loc-btn{width:100%;padding:.75rem;background:linear-gradient(135deg,#15803d,#22c55e);color:#fff;border:none;border-radius:10px;font-size:.85rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;}

/* OTP */
.otp-inp{width:100%;padding:.9rem;text-align:center;letter-spacing:.5em;font-size:1.8rem;font-weight:700;background:transparent;border:1px solid rgba(34,197,94,.3);border-radius:12px;color:#f1f5f9;outline:none;font-family:'Inter',sans-serif;transition:border-color .2s,box-shadow .2s;}
.otp-inp:focus{border-color:rgba(34,197,94,.7);box-shadow:0 0 0 3px rgba(34,197,94,.1);}
.otp-meta{display:flex;justify-content:space-between;align-items:center;margin:.8rem 0 1.2rem;font-size:.78rem;color:#64748b;}
.otp-exp{color:#f1f5f9;}
.otp-exp.d{color:#ef4444;}
.bk{background:none;border:none;font-size:.78rem;color:#22c55e;cursor:pointer;font-family:inherit;}
.bk:hover{text-decoration:underline;}
`;

function App() {
  const [state, setState] = useState('Admin');
  const [email, setemail] = useState('');
  const [password, setpassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(90);
  const [pendingEmail, setPendingEmail] = useState('');

  const backendurl = import.meta.env.VITE_BACKEND_URL;
  const { verifyAdminOTP, setatoken } = useContext(AdminContext);
  const { setdtoken } = useContext(DoctorContext);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      if (state === 'Admin') {
        const { data } = await axios.post(`${backendurl}/api/admin/login`, { email, password, secretCode });
        if (data.success) {
          if (data.requiresOTP) { setIsOtpSent(true); setPendingEmail(email); setTimer(90); toast.success(data.message); }
          else { localStorage.setItem('atoken', data.token); setatoken(data.token); toast.success(data.message || 'Login successful!'); }
        } else {
          data.pendingApproval ? toast.info(data.message, { autoClose: 10000 }) : toast.error(data.message || 'Admin login failed!');
        }
      } else {
        const { data } = await axios.post(`${backendurl}/api/doctor/login`, { email, password });
        if (data.success) { localStorage.setItem('dtoken', data.token); setdtoken(data.token); toast.success(data.message || 'Login successful!'); }
        else toast.error(data.message || 'Doctor login failed!');
      }
    } catch { toast.error('Something went wrong!'); }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Please enter a 6-digit OTP');
    const ok = await verifyAdminOTP(pendingEmail, otp, 'Email');
    if (ok) { setIsOtpSent(false); setOtp(''); }
  };

  React.useEffect(() => {
    if (!isOtpSent) return;
    if (timer === 0) { setIsOtpSent(false); toast.error('Security code expired.'); return; }
    const id = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [isOtpSent, timer]);

  const requestLoc = () => {
    if (!('geolocation' in navigator)) { setLocationError('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      () => { setLocationGranted(true); setLocationError(''); },
      (err) => {
        setLocationGranted(false);
        setLocationError(err.code === err.PERMISSION_DENIED ? 'You denied Geolocation. Enable it in browser settings.' : 'Location unavailable.');
      }
    );
  };

  React.useEffect(() => { if (state === 'Admin') requestLoc(); else setLocationGranted(true); }, [state]);

  return (
    <>
      <style>{S}</style>
      <div className="lr">

        {/* ── LEFT ── */}
        <div className="ll">
          {/* Texture overlays */}
          <div className="ll-grid" />
          <div className="ll-gold-ray" />
          {/* Brand */}
          <div className="brand">
            <div className="brand-icon">🐾</div>
            <div>
              <div className="brand-name">PawVaidya</div>
              <div className="brand-sub">Admin Portal</div>
            </div>
          </div>

          {/* 3D Illustration */}
          <div style={{ position: 'relative', height: '220px', marginBottom: '1rem' }}>
            <div className="illus">
              <div className="illus-ring">
                <div className="shield-main">🐾</div>
                <div className="float-card fc1">🔔</div>
                <div className="float-card fc2">👤</div>
                <div className="float-card fc3">📊</div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: '240px' }}>
              <div className="welcome-badge"><span></span>Welcome Back! 👋</div>
              <div className="hl">
                <h1>Welcome to<br />PawVaidya<br /><span className="green">{state === 'Admin' ? 'Admin Portal' : 'Doctor Portal'}</span></h1>
              </div>
            </div>
          </div>

          <p className="tagline">Connecting <span>veterinary care</span>, <span>animal welfare alerts</span>,<br />and customer compliance in real time.</p>

          {/* Feature cards */}
          <div className="feat-list">
            <div className="feat">
              <div className="feat-ic fi-green">🛡️</div>
              <div className="feat-body">
                <div className="feat-title">Enterprise-Grade Security</div>
                <div className="feat-desc">Your data is protected with advanced security and privacy controls.</div>
              </div>
              <span style={{ fontSize: '1.3rem' }}>🔒</span>
            </div>
            <div className="feat">
              <div className="feat-ic fi-purple">🔔</div>
              <div className="feat-body">
                <div className="feat-title">Real-time Alerts</div>
                <div className="feat-desc">Stay updated on animal welfare alerts and compliance activities.</div>
              </div>
              <span className="feat-badge live-badge"><span className="live-dot"></span>Live</span>
            </div>
            <div className="feat">
              <div className="feat-ic fi-teal">👥</div>
              <div className="feat-body">
                <div className="feat-title">Customer Focused</div>
                <div className="feat-desc">Better tools. Better support. Better care for every paw.</div>
              </div>
              <span style={{ fontSize: '1.3rem' }}>📈</span>
            </div>
          </div>

          {/* Trust bar */}
          <div className="trust">
            <span style={{ fontSize: '1rem' }}>🛡️</span>
            <div className="trust-text">
              <div className="t1">Trusted by veterinary professionals</div>
              <div className="t2">Secure • Reliable • Always Here</div>
            </div>
            <div className="avatars">
              <div className="av">A</div>
              <div className="av">B</div>
              <div className="av">C</div>
            </div>
            <div className="av-count">+2.5K<br /><span style={{ fontSize: '.6rem', fontWeight: 400, color: '#64748b' }}>Active Users</span></div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="lr-right">
          <div className="form-card">
            <div className="av-wrap">🛡️</div>
            <div className="ft">Welcome Back!</div>
            <div className="fs">{state === 'Admin' ? 'Admin Command Center' : 'Doctor Command Center'}</div>

            {/* Tabs */}
            <div className="tabs">
              <button className={`tab${state === 'Admin' ? ' on' : ''}`} onClick={() => setState('Admin')}>Admin</button>
              <button className={`tab${state === 'Doctor' ? ' on' : ''}`} onClick={() => setState('Doctor')}>Doctor</button>
            </div>

            {/* Location gate */}
            {!locationGranted && state === 'Admin' ? (
              <div className="loc">
                <h3>📍 Location Required</h3>
                <p>{locationError || 'Admin panel security requires your location before login.'}</p>
                <button className="loc-btn" onClick={() => locationError.includes('denied') ? window.location.reload() : requestLoc()}>
                  {locationError.includes('denied') ? 'Reload After Granting' : 'Grant Location Permission'}
                </button>
              </div>

            ) : !isOtpSent ? (
              <form onSubmit={onSubmitHandler}>
                {/* Email */}
                <label className="fl">Email Address</label>
                <div className="iw">
                  <span className="ii">✉️</span>
                  <input className="inp" type="email" required placeholder="you@example.com" value={email} onChange={e => setemail(e.target.value)} />
                </div>

                {/* Password */}
                <label className="fl">Password</label>
                <div className="iw">
                  <span className="ii">🔒</span>
                  <input className="inp" type={showPw ? 'text' : 'password'} required placeholder="••••••••••" value={password} onChange={e => setpassword(e.target.value)} style={{ paddingRight: '2.5rem' }} />
                  <button type="button" className="ii-r" onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁️'}</button>
                </div>

                {/* Secret code */}
                {state === 'Admin' && (<>
                  <label className="fl">Secret Code <span style={{ color: '#334155', textTransform: 'none', letterSpacing: 0 }}>(Optional)</span></label>
                  <div className="iw">
                    <span className="ii">🗝️</span>
                    <input className="inp" type="text" placeholder="Enter secret code" value={secretCode} onChange={e => setSecretCode(e.target.value)} />
                  </div>
                </>)}

                <div className="opts">
                  <label className="rl"><input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> Remember me</label>
                  <button type="button" className="fp">Forgot Password?</button>
                </div>

                <button type="submit" className="sbtn">SIGN IN &nbsp;→</button>

                {state === 'Admin' && (
                  <button type="button" className="fbtn" onClick={() => setShowFaceAuth(true)}>
                    🤳 Login with Face Recognition
                  </button>
                )}

                <div className="sec">🛡️ Protected by PawVaidya Security</div>
              </form>

            ) : (
              <form onSubmit={onVerifyOtp}>
                <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                  <div style={{ width: 52, height: 52, background: 'rgba(34,197,94,.12)', border: '2px solid rgba(34,197,94,.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto .8rem' }}>✉️</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '.2rem' }}>Verification Code</div>
                  <div style={{ fontSize: '.75rem', color: '#64748b' }}>Sent to {pendingEmail}</div>
                </div>
                <input className="otp-inp" type="text" maxLength="6" required autoFocus placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} />
                <div className="otp-meta">
                  <span>Expires in: <span className={`otp-exp${timer < 11 ? ' d' : ''}`}>{timer}s</span></span>
                  <button type="button" className="bk" onClick={() => { setIsOtpSent(false); setOtp(''); }}>Back to Login</button>
                </div>
                <button type="submit" className="sbtn">VERIFY &amp; LOGIN &nbsp;→</button>
                <div className="sec">🛡️ Protected by PawVaidya Security</div>
              </form>
            )}
          </div>
        </div>
      </div>

      {showFaceAuth && (
        <FaceAuth mode="login"
          onAuthSuccess={(data) => {
            if (data.requiresOTP) { setPendingEmail(data.email); setIsOtpSent(true); setTimer(90); setShowFaceAuth(false); toast.success(data.message); }
            else { localStorage.setItem('atoken', data.token); setatoken(data.token); setShowFaceAuth(false); toast.success('Face Login Successful!'); }
          }}
          onCancel={() => setShowFaceAuth(false)}
        />
      )}
    </>
  );
}

export default App;
