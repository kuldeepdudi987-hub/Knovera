import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, Sparkles, Plus, FileText, CheckCircle2, Clock, Filter, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import { apiRequest } from '../utils/api.js';

export default function WalletLedgerPage() {
  const { user, isLoggedIn, devLogin } = useAuth();
  const { wallet, refreshWallet, openBuyModal, openReceipt, triggerCelebration } = useWallet();

  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      if (!isLoggedIn) {
        await devLogin('student');
      }
      fetchLedger();
    }
    init();
  }, [isLoggedIn]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/wallet/ledger');
      if (res.success) {
        setTransactions(res.transactions);
      }
    } catch (err) {
      console.warn('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const silverCoins = wallet?.silver_coins || 0;
  const goldenCoins = wallet?.golden_coins || 0;
  const escrowSilver = wallet?.escrow_silver || 0;
  const escrowGolden = wallet?.escrow_golden || 0;
  const withdrawableInr = wallet?.withdrawable_inr || 0;

  const filtered = transactions.filter((t) => {
    if (filterType === 'all') return true;
    if (filterType === 'purchase') return t.type === 'purchase' || t.type === 'signup_bonus';
    if (filterType === 'escrow') return t.type === 'escrow_lock' || t.type === 'escrow_deduct';
    if (filterType === 'refund') return t.type === 'escrow_refund';
    if (filterType === 'payout') return t.type === 'payout' || t.type === 'teaching_earnings';
    return true;
  });

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full space-y-8">
        
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-950 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">
                Double-Entry Ledger
              </span>
              <span className="text-xs text-slate-400">• Knovera Financial Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Wallet Balances & Escrow Audit History
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openBuyModal('silver')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Buy Silver Pack</span>
            </button>

            <button
              onClick={() => openBuyModal('golden')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:opacity-95 text-obsidian-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Buy Golden Pack</span>
            </button>
          </div>
        </div>

        {/* Balance Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Silver Balance Card */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Silver Coins (Group)</span>
              <span className="text-lg">🪙</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{silverCoins}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {escrowSilver > 0 ? (
                <span className="text-cyan-400 font-semibold">{escrowSilver} coins held in escrow</span>
              ) : (
                '0 coins locked in escrow'
              )}
            </div>
          </div>

          {/* Golden Balance Card */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Golden Coins (1-on-1)</span>
              <span className="text-lg">✨</span>
            </div>
            <div className="text-3xl font-black text-amber-300 font-mono">{goldenCoins}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {escrowGolden > 0 ? (
                <span className="text-amber-400 font-semibold">{escrowGolden} coins held in escrow</span>
              ) : (
                '0 coins locked in escrow'
              )}
            </div>
          </div>

          {/* Escrow Protection Total */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Escrow Hold Balance</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {escrowSilver + escrowGolden} Coins
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">
              100% Auto-Refund Protected
            </div>
          </div>

          {/* INR Earnings / Balance */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Withdrawable INR</span>
              <Wallet className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              ₹{withdrawableInr}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Instant UPI routing enabled
            </div>
          </div>
        </div>

        {/* Ledger Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-6">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Records ({transactions.length})
            </button>

            <button
              onClick={() => setFilterType('purchase')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'purchase'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Coin Purchases & Bonus
            </button>

            <button
              onClick={() => setFilterType('escrow')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'escrow'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Escrow Holds & Deductions
            </button>

            <button
              onClick={() => setFilterType('refund')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'refund'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              100% Auto-Refunds
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Immutable Double-Entry Ledger
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-obsidian-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
              Loading ledger transactions...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No transactions found in this filter category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="px-5 py-3.5">Type & Description</th>
                    <th className="px-4 py-3.5">Coin Type</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Balance After</th>
                    <th className="px-4 py-3.5">Reference / Tx ID</th>
                    <th className="px-4 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            t.type === 'purchase' || t.type === 'signup_bonus'
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                              : t.type === 'escrow_refund'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : t.type === 'escrow_lock'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              : 'bg-purple-950 text-purple-400 border border-purple-500/30'
                          }`}>
                            {t.type === 'purchase' || t.type === 'signup_bonus' ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : t.type === 'escrow_refund' ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : t.type === 'escrow_lock' ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{t.description}</div>
                            <div className="text-[10px] text-slate-500 capitalize">{t.status || 'completed'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold capitalize text-slate-300">
                        {t.coin_type}
                      </td>

                      <td className="px-4 py-3.5 font-bold font-mono">
                        <span className={t.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}>
                          {t.amount > 0 ? `+${t.amount}` : t.amount}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {t.balance_after}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                        {t.reference_id || 'N/A'}
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {t.type === 'purchase' ? (
                          <button
                            onClick={() => openReceipt(t.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] border border-slate-700 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
