import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db } from "../firebase"; // Ensure your firebase configuration path is correct

const Login = ({ onNavigate }) => {
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Dynamic Routing and User Storage Handler
  const checkUserRoleAndNavigate = async (email) => {
    // Admin check
    if (email.trim().toLowerCase() === "admin@wellmind.com") {
      onNavigate('adminpanel');
      return;
    }

    // Regular user → main dashboard
    onNavigate('dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalEmail = emailOrId.trim();

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const hfToken = import.meta.env.VITE_HF_TOKEN;

      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hfToken}`
        },
        body: JSON.stringify({ email: finalEmail, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userEmail', data.email);

        Swal.fire({
          title: 'Welcome!',
          text: 'Login Successful!',
          icon: 'success',
          confirmButtonColor: '#0D7289',
          background: '#331B3F',
          color: '#F0EAF8',
          width: '400px',
          padding: '2rem',
        }).then(() => {
          checkUserRoleAndNavigate(data.email);
        });
      } else {
        Swal.fire({
          title: 'Error!',
          text: data.detail || "Invalid Credentials!",
          icon: 'error',
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#8A1C37',
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Login Failed',
        text: error.message || 'Could not reach server.',
        icon: 'warning',
        confirmButtonColor: '#C0854A',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      localStorage.setItem('userEmail', user.email);

      Swal.fire({
        title: `Welcome, ${user.displayName?.split(' ')[0] || 'User'}!`,
        text: 'Google Login Successful!',
        icon: 'success',
        confirmButtonColor: '#0D7289',
        background: '#331B3F',
        color: '#F0EAF8',
        width: '400px',
        padding: '2rem',
      }).then(() => {
        checkUserRoleAndNavigate(user.email);
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'Google Login Failed',
        text: 'Google sign-in failed. Please try again.',
        icon: 'error',
        confirmButtonColor: '#8A1C37',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.circle1}></div>
      <div style={styles.circle2}></div>
      <div style={styles.circle3}></div>

      <div style={styles.loginCard}>
        <div style={styles.headerSection}>
          <div style={styles.logoIcon}>
            <img
              src="./hero.png"
              alt="WellMind Data Solutions"
              style={{ height: '40px', width: 'auto', objectFit: 'contain', backgroundColor: '#FFFFFF', padding: '4px', borderRadius: '4px' }}
            />
          </div>
          <h1 style={styles.brandTitle}>WellMind</h1>
          <p style={styles.brandSub}>Data Solutions</p>
          <p style={styles.subTitle}>Management Portal</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputWrapper}>
            <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              type="text"
              placeholder="Email Address"
              required
              value={emailOrId}
              onChange={(e) => setEmailOrId(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputWrapper}>
            <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading || googleLoading} style={{ ...styles.button, opacity: loading ? 0.75 : 1 }}>
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <div style={styles.dividerRow}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine}></div>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading || googleLoading} style={styles.googleBtn}>
          <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span style={styles.googleBtnText}>Continue with Google</span>
        </button>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account?
            <button onClick={() => onNavigate('signup')} style={styles.linkBtn}>Sign Up</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Styles object
const styles = {
  pageWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1A1228 0%, #331B3F 50%, #47234F 100%)', fontFamily: "'Poppins', sans-serif", overflow: 'hidden', position: 'relative' },
  circle1: { position: 'absolute', width: '420px', height: '420px', borderRadius: '50%', background: 'rgba(98, 48, 104, 0.25)', top: '-160px', right: '-100px', filter: 'blur(2px)' },
  circle2: { position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(13, 114, 137, 0.2)', bottom: '-100px', left: '-60px', filter: 'blur(2px)' },
  circle3: { position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(192, 133, 74, 0.15)', top: '40%', right: '10%' },
  loginCard: { backgroundColor: 'rgba(245, 240, 229, 0.97)', padding: '48px 40px', borderRadius: '24px', boxShadow: '0 24px 60px rgba(26, 18, 40, 0.5)', width: '100%', maxWidth: '420px', textAlign: 'center', border: '1px solid rgba(192, 133, 74, 0.3)', zIndex: 10 },
  headerSection: { marginBottom: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoIcon: { width: '62px', height: '62px', background: 'linear-gradient(135deg, #e8b3ee 0%, #250236 100%)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px', boxShadow: '0 6px 20px rgba(98, 48, 104, 0.4)' },
  brandTitle: { fontSize: '26px', fontWeight: '800', color: '#2D1B38', margin: '0', letterSpacing: '-0.5px' },
  brandSub: { fontSize: '12px', fontWeight: '600', color: '#0D7289', letterSpacing: '2px', textTransform: 'uppercase', margin: '2px 0 6px' },
  subTitle: { fontSize: '13px', color: '#623068', margin: '0', fontWeight: '500' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '15px', width: '18px', height: '18px', color: '#623068', pointerEvents: 'none' },
  input: { width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1.5px solid rgba(192, 133, 74, 0.35)', backgroundColor: '#fff', fontSize: '14px', color: '#2D1B38', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s ease', fontFamily: "'Poppins', sans-serif" },
  button: { width: '100%', padding: '15px', background: 'linear-gradient(90deg, #623068 0%, #0D7289 100%)', color: '#F0EAF8', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px', boxShadow: '0 8px 24px rgba(98, 48, 104, 0.35)', transition: 'all 0.2s ease', fontFamily: "'Poppins', sans-serif", letterSpacing: '0.5px' },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(98, 48, 104, 0.2)' },
  dividerText: { fontSize: '12px', color: '#47234F', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' },
  googleBtn: { width: '100%', padding: '13px 20px', background: '#fff', color: '#2D1B38', border: '1.5px solid rgba(98, 48, 104, 0.25)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'background 0.2s ease', fontFamily: "'Poppins', sans-serif" },
  googleBtnText: { fontSize: '14px', fontWeight: '600', color: '#2D1B38' },
  footer: { marginTop: '28px', borderTop: '1px solid rgba(98, 48, 104, 0.15)', paddingTop: '20px' },
  footerText: { fontSize: '14px', color: '#47234F', margin: '0' },
  linkBtn: { background: 'none', border: 'none', color: '#0D7289', fontWeight: '700', cursor: 'pointer', marginLeft: '6px', fontFamily: "'Poppins', sans-serif", fontSize: '14px', textDecoration: 'underline' },
};

export default Login;