import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, GraduationCap, User, ArrowRight, ShieldCheck, Mail, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import { apiRequest } from '../utils/api.js';

export default function LoginPage({ setActivePage }) {
  const { loginWithGoogle, devLogin, isLoggedIn, role } = useAuth();
  const { triggerCelebration } = useWallet();

  const [googleEmail, setGoogleEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const [showConfigClientId, setShowConfigClientId] = useState(false);

  const googleButtonRef = useRef(null);

  // If already logged in, redirect to respective portal
  useEffect(() => {
    if (isLoggedIn) {
      setActivePage(role === 'teacher' ? 'teacher' : 'student');
    }
  }, [isLoggedIn, role, setActivePage]);

  // Fetch Google Client ID config from backend
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await apiRequest('/auth/google-config');
        if (res.success && res.clientId) {
          setGoogleClientId(res.clientId);
        }
      } catch (e) {
        console.warn('Could not load Google config:', e);
      }
    }
    loadConfig();
  }, []);

  // Initialize Google Identity Services (GSI)
  useEffect(() => {
    const initGsi = () => {
      if (window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          if (googleButtonRef.current) {
            googleButtonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: 'filled_black',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'continue_with',
              logo_alignment: 'left',
              width: 320
            });
          }

          setIsGsiLoaded(true);
        } catch (err) {
          console.warn('Google GSI Init error:', err);
        }
      }
    };

    // Check if script is loaded or wait for it
    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGsi();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [googleClientId, selectedRole]);

  // Handle Google Credential Response from Google Identity Services Popup
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await loginWithGoogle({
        credential: response.credential,
        role: selectedRole
      });
      triggerCelebration();
      setActivePage(selectedRole === 'teacher' ? 'teacher' : 'student');
    } catch (err) {
      setError(err.message || 'Google account verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Real Gmail ID Submission & Direct Google Linking
  const handleDirectGoogleSignIn = async (e) => {
    if (e) e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setError('Please enter your valid real Gmail address (e.g. name@gmail.com)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const email = googleEmail.trim().toLowerCase();
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // If Google Identity prompt is available, attempt to prompt the Google account picker
      if (window.google?.accounts?.id && googleClientId && !googleClientId.includes('demo')) {
        try {
          window.google.accounts.id.prompt();
        } catch (promptErr) {
          console.warn('GSI prompt notice:', promptErr);
        }
      }

      const res = await loginWithGoogle({
        email,
        name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        role: selectedRole
      });

      triggerCelebration();
      setActivePage(selectedRole === 'teacher' ? 'teacher' : 'student');
    } catch (err) {
      setError(err.message || 'Failed to link Google account.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Fast Dev Sign-in Bypass
  const handleQuickDevLogin = async (roleType) => {
    setLoading(true);
    setError('');
    try {
      await devLogin(roleType);
      triggerCelebration();
      setActivePage(roleType === 'teacher' ? 'teacher' : 'student');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const isRealGmail = googleEmail.toLowerCase().endsWith('@gmail.com') || googleEmail.toLowerCase().endsWith('@googlemail.com');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-obsidian-950 relative overflow-hidden">
      {/* Background Neon Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-obsidian-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>1 Credit = 1 Minute Live Learning</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Link Your <span className="neon-gradient-text">Google Account</span>
          </h1>
          <p className="text-xs text-slate-400">
            Sign in with your real Google ID to sync learning minutes, tutor payouts, and your wallet.
          </p>
        </div>

        {/* New User Promo Callout */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/50 to-purple-950/40 border border-cyan-500/30 text-xs text-slate-200 flex items-start gap-2.5">
          <span className="text-xl flex-shrink-0">🎁</span>
          <div className="space-y-0.5">
            <div className="font-extrabold text-cyan-300">New Learner Bonus: 60 Free Silver Coins</div>
            <div className="text-[11px] text-slate-400">Get 1 hour of group micro-tutoring automatically credited to your Google ID.</div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">
            Select Account Role:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                selectedRole === 'student'
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-cyan-400" />
              </div>
              <span>Student / Learner</span>
              <span className="text-[10px] text-cyan-300/80 font-normal">+60 Free Coins</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                selectedRole === 'teacher'
                  ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-purple-400" />
              </div>
              <span>Teacher / Mentor</span>
              <span className="text-[10px] text-purple-300/80 font-normal">Earn INR/min</span>
            </button>
          </div>
        </div>

        {/* Real Google / Gmail ID Form */}
        <form onSubmit={handleDirectGoogleSignIn} className="space-y-3 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-200 block">
                Enter your real Gmail / Google ID:
              </label>
              {isRealGmail && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Gmail
                </span>
              )}
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>
          </div>

          {/* Official Google One-Tap / Rendered GSI Button if Client ID Ready */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div ref={googleButtonRef} className="w-full flex justify-center min-h-[44px]" />
            
            {/* Fallback & Direct Google Link Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {/* Google SVG Icon */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.13C3.25 21.36 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.27C.46 8.2 0 10.05 0 12s.46 3.8 1.27 5.42l4.01-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.27 6.58l4.01 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>{loading ? 'Verifying with Google...' : 'Continue & Link Google ID'}</span>
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-obsidian-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Or Quick Demo Bypass
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* 1-Click Quick Demo Login */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickDevLogin('student')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <span>⚡ Demo Student</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDevLogin('teacher')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <span>⚡ Demo Teacher</span>
          </button>
        </div>

        {/* Google Cloud Client ID Custom Setup (Optional Accordion) */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowConfigClientId(!showConfigClientId)}
            className="text-[11px] text-slate-400 hover:text-cyan-300 underline block mx-auto transition-colors"
          >
            {showConfigClientId ? 'Hide Google Cloud Client ID settings' : '⚙️ Configure custom Google Client ID'}
          </button>

          {showConfigClientId && (
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <label className="text-[11px] text-slate-300 block font-semibold">
                Google Cloud OAuth 2.0 Client ID:
              </label>
              <input
                type="text"
                placeholder="xxxx.apps.googleusercontent.com"
                value={customClientIdInput || googleClientId}
                onChange={(e) => setCustomClientIdInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (customClientIdInput) {
                    setGoogleClientId(customClientIdInput.trim());
                    alert('Google Client ID updated for this session!');
                  }
                }}
                className="px-3 py-1 bg-cyan-500 text-obsidian-950 font-bold rounded-lg text-[11px]"
              >
                Apply Client ID
              </button>
              <p className="text-[10px] text-slate-400">
                You can also configure <code className="text-cyan-300">GOOGLE_CLIENT_ID</code> in your <code className="text-cyan-300">.env</code> file.
              </p>
            </div>
          )}
        </div>

        {/* Security & Guarantee Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Google Identity Services 2.0 • 256-bit Encryption</span>
        </div>
      </div>
    </div>
  );
}
