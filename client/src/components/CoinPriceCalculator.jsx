import React, { useState } from 'react';
import { Calculator, Clock, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useWallet } from '../context/WalletContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function CoinPriceCalculator() {
  const [minutes, setMinutes] = useState(30);
  const { openBuyModal, triggerCelebration } = useWallet();
  const { isLoggedIn, devLogin } = useAuth();

  // Calculations
  const silverCoins = minutes;
  const silverPrice = minutes <= 60 ? 0 : Math.round(minutes * 1.38); // First 60 free with signup!
  const silverActualRate = Math.round(minutes * 1.4);

  const goldenCoins = minutes;
  const goldenPrice = Math.round(minutes * 4.75);
  const traditionalCost = Math.round(minutes * (1200 / 60)); // Traditional ₹1200/hr
  const savings = Math.max(0, traditionalCost - goldenPrice);
  const savingsPercent = Math.round((savings / traditionalCost) * 100);

  return (
    <div className="w-full glass-panel rounded-2xl p-6 sm:p-8 neon-border-cyan shadow-glow-cyan/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Interactive Micro-Pricing Engine</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">
            1 Credit = 1 Minute of Verified Live Learning
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Never pay for unused hours or monthly locks again. Slide to select the exact minutes you need.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <Clock className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-xs text-slate-400 block leading-none">Selected Duration</span>
            <span className="text-xl font-extrabold text-white">{minutes} Minutes</span>
          </div>
        </div>
      </div>

      {/* Slider Control */}
      <div className="my-8">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold text-slate-300">
            How many minutes of micro-tutoring do you need?
          </label>
          <span className="text-xs text-cyan-400 font-bold bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
            {minutes} Mins = {minutes} Credits
          </span>
        </div>

        <input
          type="range"
          min="15"
          max="120"
          step="15"
          value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
          className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />

        <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
          <span>15 min (Doubt)</span>
          <span>30 min (Micro-Drill)</span>
          <span>60 min (Concept Dive)</span>
          <span>90 min (Bootcamp)</span>
          <span>120 min (Mastery)</span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Silver Coin Pack (Group Sessions) */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-700/70 relative overflow-hidden flex flex-col justify-between hover:border-slate-500/80 transition-all">
          <div className="absolute top-0 right-0 bg-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1 rounded-bl-lg border-l border-b border-slate-700 uppercase">
            Group Masterclasses
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🪙</span>
              <h4 className="font-bold text-white text-lg">Silver Coins</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Best for multi-student live workshops, code-alongs, and study cohorts.
            </p>

            <div className="space-y-2 mb-4 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Credits Deducted:</span>
                <span className="font-bold text-white">{silverCoins} Silver Coins</span>
              </div>
              <div className="flex justify-between">
                <span>First 60 Mins on Signup:</span>
                <span className="font-bold text-emerald-400">100% FREE (Welcome Bonus)</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-semibold">
                <span>Standard Coin Value:</span>
                <span className="text-white font-extrabold">₹{silverActualRate} (~₹1.38/min)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              triggerCelebration();
              openBuyModal('silver');
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-600/50"
          >
            <span>Get Silver Pack</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

        {/* Golden Coin Pack (1-on-1 Sessions) */}
        <div className="p-5 rounded-xl bg-gradient-to-b from-purple-950/40 to-slate-900/80 border border-purple-500/40 relative overflow-hidden flex flex-col justify-between shadow-glow-purple/20 hover:border-purple-400/70 transition-all">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-obsidian-950 text-[10px] font-extrabold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            1-on-1 Private Mentorship
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✨</span>
              <h4 className="font-bold text-white text-lg">Golden Coins</h4>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Dedicated screen sharing, pair programming, and private problem solving with verified experts.
            </p>

            <div className="space-y-2 mb-4 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Credits Deducted:</span>
                <span className="font-bold text-amber-300">{goldenCoins} Golden Coins</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Traditional 1-on-1 Cost:</span>
                <span className="line-through text-red-400 font-mono">₹{traditionalCost}</span>
              </div>
              <div className="flex justify-between border-t border-purple-900/50 pt-2 text-sm font-semibold">
                <span className="text-cyan-300">Knovera Micro-Price:</span>
                <span className="text-amber-400 font-extrabold text-base">₹{goldenPrice}</span>
              </div>
              <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-2 rounded-lg text-xs font-bold text-center">
                🎉 You save ₹{savings} ({savingsPercent}%) vs traditional tutor rates!
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              triggerCelebration();
              openBuyModal('golden');
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-obsidian-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-98"
          >
            <span>Buy {goldenCoins} Golden Coins (₹{goldenPrice})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Escrow Guarantee Pill */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 bg-obsidian-900/50 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Locked in Escrow per session</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>100% Automated Refund if session has quality issues</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5 text-purple-300 font-medium">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Session Topic & Attendance Sentinel</span>
        </div>
      </div>
    </div>
  );
}
