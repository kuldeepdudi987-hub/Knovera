import React, { useState } from 'react';
import { Sparkles, Plus, Wallet, ArrowLeftRight, LogOut, User, ShieldCheck, ChevronDown, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import AuthModal from './AuthModal.jsx';

export default function Navbar({ activePage, setActivePage }) {
  const { user, role, isLoggedIn, switchRole, logout } = useAuth();
  const { wallet, openBuyModal } = useWallet();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const silverCoins = wallet?.silver_coins || 0;
  const goldenCoins = wallet?.golden_coins || 0;
  const withdrawableInr = wallet?.withdrawable_inr || 0;

  const handleToggleRole = async () => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setSwitchingRole(true);
    try {
      const targetRole = role === 'student' ? 'teacher' : 'student';
      await switchRole(targetRole);
      // Auto-switch view to match role
      if (targetRole === 'teacher') {
        setActivePage('teacher');
      } else {
        setActivePage('student');
      }
    } catch (err) {
      alert('Could not switch role: ' + err.message);
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Tagline */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActivePage('landing')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-glow-cyan/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-obsidian-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                  KNO<span className="text-cyan-400">VERA</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block leading-none">
                  1 Credit = 1 Minute
                </span>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActivePage('student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePage === 'student'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Skill Marketplace
              </button>

              <button
                onClick={() => setActivePage('teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePage === 'teacher'
                    ? 'bg-slate-800 text-purple-400 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Teacher Hub
              </button>

              <button
                onClick={() => setActivePage('ledger')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePage === 'ledger'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Wallet & Ledger
              </button>
            </nav>
          </div>

          {/* Right: Role Switcher, Wallet Bar, Theme Toggle, User Profile */}
          <div className="flex items-center gap-3">
            
            {/* Dual-Role Switcher Pill */}
            {isLoggedIn && (
              <button
                onClick={handleToggleRole}
                disabled={switchingRole}
                title="Switch between Student & Teacher modes anytime"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition-all active:scale-95 ${
                  role === 'student'
                    ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
                    : 'bg-purple-950/60 border-purple-500/40 text-purple-300 hover:bg-purple-900/60'
                }`}
              >
                <span>{role === 'student' ? '🎓 Student Mode' : '👨‍🏫 Teacher Mode'}</span>
                <ArrowLeftRight className="w-3 h-3 text-slate-400" />
              </button>
            )}

            {/* Live Wallet Bar */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 dark:bg-obsidian-950 p-1 rounded-xl border border-slate-800 text-xs">
              {/* Silver Coins */}
              <button
                onClick={() => openBuyModal('silver')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Silver Coins (Group Sessions) - 1 Credit = 1 Minute"
              >
                <span className="text-sm">🪙</span>
                <span className="font-extrabold text-white">{silverCoins}</span>
                <span className="text-[10px] text-slate-400 hidden lg:inline">Silver</span>
              </button>

              {/* Golden Coins */}
              <button
                onClick={() => openBuyModal('golden')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Golden Coins (1-on-1 Sessions) - 1 Credit = 1 Minute"
              >
                <span className="text-sm">✨</span>
                <span className="font-extrabold text-amber-300">{goldenCoins}</span>
                <span className="text-[10px] text-amber-200/80 hidden lg:inline">Gold</span>
              </button>

              {/* Teacher INR Withdrawable if in Teacher role */}
              {role === 'teacher' && (
                <button
                  onClick={() => setActivePage('teacher')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50 transition-colors border border-emerald-500/30"
                  title="Withdrawable INR Balance"
                >
                  <span className="font-mono font-bold">₹{withdrawableInr}</span>
                  <span className="text-[10px] hidden lg:inline">Payout</span>
                </button>
              )}

              {/* + Buy Coins Button */}
              <button
                onClick={() => openBuyModal('silver')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-black text-xs transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Buy</span>
              </button>
            </div>


            {/* Profile Avatar & Menu or Sign In */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/60 transition-colors"
                >
                  <img
                    src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=knovera'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full border border-cyan-400/50 object-cover"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-obsidian-900 border border-slate-700 shadow-2xl py-2 text-xs z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <div className="font-bold text-white truncate">{user?.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                      <div className="mt-1 inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                        {role} Mode
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleToggleRole();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                      <span>Switch to {role === 'student' ? 'Teacher' : 'Student'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActivePage('ledger');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <span>Ledger & Invoices</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setIsProfileDropdownOpen(false);
                        setActivePage('login');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-950/40 text-red-400 flex items-center gap-2 border-t border-slate-800 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setActivePage('login')}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
