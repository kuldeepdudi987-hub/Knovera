import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, QrCode, ShieldCheck, Smartphone, Copy, CheckCircle, FileText } from 'lucide-react';
import { useWallet } from '../context/WalletContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../utils/api.js';

export default function BuyCoinsModal() {
  const { isBuyModalOpen, closeBuyModal, buyModalDefaultType, refreshWallet, triggerCelebration, openReceipt } = useWallet();
  const { isLoggedIn, devLogin } = useAuth();

  const [coinType, setCoinType] = useState('silver');
  const [selectedPackId, setSelectedPackId] = useState('silver-value');
  const [packs, setPacks] = useState({ silverPacks: [], goldenPacks: [] });
  const [qrData, setQrData] = useState(null);
  const [realUtr, setRealUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrError, setUtrError] = useState('');

  // Initialize selected coin type when modal opens
  useEffect(() => {
    if (isBuyModalOpen) {
      setCoinType(buyModalDefaultType || 'silver');
      setSelectedPackId(buyModalDefaultType === 'golden' ? 'gold-value' : 'silver-value');
      setSuccessResult(null);
      fetchPacks();
    }
  }, [isBuyModalOpen, buyModalDefaultType]);

  const fetchPacks = async () => {
    try {
      const res = await apiRequest('/payments/packs');
      if (res.success) {
        setPacks({
          silverPacks: res.silverPacks,
          goldenPacks: res.goldenPacks
        });
      }
    } catch (e) {
      console.warn('Could not load packs from backend:', e);
    }
  };

  // Generate dynamic QR whenever selected pack changes
  useEffect(() => {
    if (selectedPackId && isBuyModalOpen) {
      fetchDynamicQr(selectedPackId);
    }
  }, [selectedPackId, isBuyModalOpen]);

  const fetchDynamicQr = async (packId) => {
    try {
      const res = await apiRequest(`/payments/dynamic-qr?packId=${packId}`);
      if (res.success) {
        setQrData(res);
      }
    } catch (e) {
      console.warn('Failed to load dynamic QR:', e);
    }
  };

  const handleCopyUpi = (upiId) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };


  const handleSubmitRealUtr = async (e) => {
    e.preventDefault();
    if (!realUtr || realUtr.trim().length < 8) {
      setUtrError('Please enter the 12-digit UPI UTR number from your payment app.');
      return;
    }
    if (!isLoggedIn) {
      await devLogin('student');
    }
    setLoading(true);
    setUtrError('');
    try {
      const res = await apiRequest('/payments/submit-utr', {
        method: 'POST',
        body: JSON.stringify({
          packId: selectedPackId,
          utrNumber: realUtr.trim()
        })
      });
      if (res.success) {
        triggerCelebration();
        await refreshWallet();
        setSuccessResult(res);
      }
    } catch (err) {
      setUtrError(err.message || 'UTR verification failed');
    } finally {
      setLoading(false);
    }
  };



  if (!isBuyModalOpen) return null;

  const currentPacks = coinType === 'silver' ? packs.silverPacks : packs.goldenPacks;
  const activePack = currentPacks.find(p => p.id === selectedPackId) || currentPacks[1] || currentPacks[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-obsidian-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-obsidian-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Top-Up Learning Credits</h3>
              <p className="text-xs text-slate-400">1 Credit = 1 Minute • Protected by Knovera Escrow</p>
            </div>
          </div>
          <button
            onClick={closeBuyModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {successResult ? (
          <div className="p-8 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-2xl font-extrabold text-white">Payment Confirmed!</h4>
              <p className="text-slate-300 text-sm mt-1">
                {successResult.message}
              </p>
              <div className="inline-block mt-3 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700 text-xs text-cyan-300 font-mono">
                Tx Ref: {successResult.utrNumber || successResult.paymentId}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 max-w-md mx-auto text-xs text-left space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>New Silver Balance:</span>
                <span className="font-bold text-white">{successResult.wallet?.silver_coins || 0} Silver Coins</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>New Golden Balance:</span>
                <span className="font-bold text-amber-300">{successResult.wallet?.golden_coins || 0} Golden Coins</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                <span>Protection Status:</span>
                <span className="text-emerald-400 font-semibold">100% Escrow Guarantee Active</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  closeBuyModal();
                  if (successResult.receiptId) {
                    openReceipt(successResult.receiptId);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-600 transition-all"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>View / Print Tax Receipt</span>
              </button>

              <button
                onClick={closeBuyModal}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
              >
                Continue Learning
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Coin Type Selector Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-obsidian-950 border border-slate-800">
              <button
                onClick={() => {
                  setCoinType('silver');
                  setSelectedPackId('silver-value');
                }}
                className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  coinType === 'silver'
                    ? 'bg-slate-800 text-white shadow-md border border-slate-600'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-base">🪙</span>
                <span>Silver Coins (Group)</span>
              </button>

              <button
                onClick={() => {
                  setCoinType('golden');
                  setSelectedPackId('gold-value');
                }}
                className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  coinType === 'golden'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-obsidian-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-base">✨</span>
                <span>Golden Coins (1-on-1)</span>
              </button>
            </div>

            {/* Pack Cards Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentPacks.map((pack) => {
                const isSelected = selectedPackId === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPackId(pack.id)}
                    className={`cursor-pointer relative p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? coinType === 'golden'
                          ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-cyan-950/30 border-cyan-400 ring-2 ring-cyan-400/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-obsidian-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Best Value
                      </span>
                    )}

                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-1">{pack.name}</div>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-2xl font-extrabold text-white">₹{pack.priceInr}</span>
                      </div>
                      <div className="text-xs font-bold text-cyan-400">{pack.coins} Minutes</div>
                      <div className="text-[11px] text-slate-400 mt-1">{pack.savingsText}</div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{pack.targetAudience}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-cyan-400 text-obsidian-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct UPI Checkout Section */}
            <div className="border-t border-slate-800 pt-5">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Direct UPI Checkout (0% Fees • GPay, PhonePe, Paytm, CRED)</span>
              </div>

              {/* Dynamic UPI Checkout Panel */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-4">
                  
                  {/* Real Direct UPI Payment Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Direct Real UPI Payment (Live Bank Transfer)</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      NPCI UPI 2.0
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {qrData?.qrDataUrl ? (
                      <div className="p-2 bg-white rounded-xl shadow-md flex-shrink-0">
                        <img
                          src={qrData.qrDataUrl}
                          alt="Dynamic UPI QR"
                          className="w-36 h-36 rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-36 h-36 bg-slate-800 rounded-xl animate-pulse flex-shrink-0" />
                    )}

                    <div className="space-y-2 text-xs w-full">
                      <div className="text-slate-300">
                        Scan with any UPI App (<strong className="text-white">GPay, PhonePe, Paytm, CRED</strong>) to transfer <strong className="text-cyan-400 font-bold">₹{activePack?.priceInr || 45}</strong>
                      </div>

                      {/* Fixed Official Merchant VPA */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">UPI ID:</span>
                          <span className="text-cyan-300 font-bold tracking-wide">9680877599@ybl</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyUpi('9680877599@ybl')}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs font-semibold"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {qrData?.upiUri && (
                        <a
                          href={qrData.upiUri}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Tap to Pay on Mobile UPI App</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Real UPI UTR Submission Form */}
                  <form onSubmit={handleSubmitRealUtr} className="border-t border-slate-800 pt-3 space-y-3">
                    {utrError && (
                      <div className="p-2 rounded-lg bg-red-950/70 border border-red-500/40 text-red-300 text-xs">
                        {utrError}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Enter 12-Digit UPI Transaction ID / UTR Number:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={22}
                          required
                          placeholder="e.g. 428910284719 (from GPay / PhonePe / Paytm)"
                          value={realUtr}
                          onChange={(e) => setRealUtr(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-extrabold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                          {loading ? 'Verifying...' : 'Verify & Claim Coins'}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
                      <div>💡 <strong>Where to find the 12-digit UTR?</strong></div>
                      <div>• <strong>Google Pay</strong>: Tap transaction &rarr; Look for "UPI transaction ID" (12 digits)</div>
                      <div>• <strong>PhonePe</strong>: Tap transaction &rarr; Look for "UTR" number (12 digits)</div>
                      <div>• <strong>Paytm</strong>: Tap payment &rarr; Look for "UPI Ref No." (12 digits)</div>
                    </div>
                  </form>
                </div>
            </div>

            {/* Escrow Guarantee Footer */}
            <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Automated Escrow Refund Guarantee protected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
