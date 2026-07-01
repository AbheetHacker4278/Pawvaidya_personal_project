import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const BACKEND = 'http://localhost:4000';

export default function DriverLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Enter credentials');
    setLoading(true);
    try {
      const { data } = await axios.post(`${BACKEND}/api/driver/login`, { username, password });
      if (data.success) {
        localStorage.setItem('dtoken', data.token);
        localStorage.setItem('driverInfo', JSON.stringify(data.driver));
        toast.success('Welcome back, ' + data.driver.fullName);
        onLogin(data.token, data.driver);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 60%)' }}>
      <div className="glass fade-up" style={{ width: '100%', maxWidth: 420, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '32px 32px 24px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--red-soft)', border: '1px solid var(--red-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🚑</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Mobile ICU Driver Portal</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PawVaidya Dispatch System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 32 }}>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Username</label>
            <input className="input" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-red" disabled={loading} style={{ width: '100%', padding: '13px 0', fontSize: 15 }}>
            {loading ? <span className="animate-spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> : '🔐 Sign In'}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 16 }}>
            Credentials provided by Admin. Contact your supervisor if locked out.
          </p>
        </form>
      </div>
    </div>
  );
}
