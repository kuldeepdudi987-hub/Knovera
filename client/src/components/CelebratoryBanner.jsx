import React, { useState } from 'react';
import { Sparkles, Gift, X, ArrowRight } from 'lucide-react';
import { useWallet } from '../context/WalletContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function CelebratoryBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { wallet, openBuyModal, triggerCelebration } = useWallet();
  const { role } = useAuth();

  if (dismissed || role === 'teacher') return null;

  const silverCoins = wallet?.silver_coins || 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-cyan-950/80 via-purple-950/80 to-obsidian-900 border-b border-cyan-500/30 px-4 py-3 sm:px-6 shadow-glow-cyan/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 animate-pulse">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white flex items-center gap-1.5">
              🎉 New Student Welcome Gift!
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-obsidian-950 font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow-sm">
                60 FREE SILVER COINS
              </span>
            </span>
            <p className="text-slate-300 text-xs mt-0.5">
              1 Credit = 1 Minute! You have <strong className="text-cyan-300 font-bold">{silverCoins} Free Minutes</strong> of live group micro-tutoring available in your wallet right now.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            onClick={() => {
              triggerCelebration();
              openBuyModal('silver');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <span>Top-up More Coins</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
