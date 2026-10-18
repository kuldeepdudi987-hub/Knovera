import React from 'react';
import { Sparkles, ShieldCheck, Zap, Users, ArrowRight, CheckCircle2, Clock, Award, Star, MessageSquare } from 'lucide-react';
import LiveTutorTicker from '../components/LiveTutorTicker.jsx';
import CoinPriceCalculator from '../components/CoinPriceCalculator.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';

export default function LandingPage({ setActivePage }) {
  const { isLoggedIn, devLogin } = useAuth();
  const { openBuyModal, triggerCelebration } = useWallet();

  const handleGetStarted = () => {
    if (!isLoggedIn) {
      setActivePage('login');
    } else {
      setActivePage('student');
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col">
      {/* Live Tutor Ribbon */}
      <LiveTutorTicker />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        {/* Neon Glow Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-xs font-bold tracking-wide shadow-glow-cyan/20">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>THE PEER-TO-PEER MICRO-TUTORING MARKETPLACE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight">
            Stop Paying for Hours.<br />
            <span className="neon-gradient-text">1 Credit = 1 Minute</span> of Live Learning.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Stuck on a tricky bug, calculus proof, or design review? Connect with verified mentors in seconds.
            Pay only for the exact minutes you learn, backed by our <strong className="text-cyan-300">100% AI Escrow Auto-Refund Guarantee</strong>.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-purple-600 hover:opacity-95 text-obsidian-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all transform active:scale-95"
            >
              <span>Get 60 Free Silver Coins Now</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              onClick={() => setActivePage('student')}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base border border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <Users className="w-5 h-5 text-purple-400" />
              <span>Explore Verified Tutors</span>
            </button>
          </div>

          {/* Trust Metrics */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div className="text-2xl font-black text-white font-mono">1 Min</div>
              <div className="text-xs text-slate-400 mt-0.5">Granular Micro-Billing</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div className="text-2xl font-black text-cyan-400 font-mono">60 Coins</div>
              <div className="text-xs text-slate-400 mt-0.5">Free Signup Promo</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div className="text-2xl font-black text-emerald-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">AI Escrow Auto-Refund</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div className="text-2xl font-black text-purple-400 font-mono">Instant</div>
              <div className="text-xs text-slate-400 mt-0.5">Direct UPI Settlements</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Price Calculator Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <CoinPriceCalculator />
      </section>

      {/* Why Knovera Beats Traditional Coaching */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-obsidian-900/60 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-white">
              Engineered for Modern Problem Solvers
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Why pay for 1 hour when you only have a 15-minute question?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-obsidian-950 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-md">
              <div className="w-12 h-12 rounded-xl bg-cyan-950 flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/30">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Monthly Lock-Ins</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Traditional tutoring platforms lock you into ₹15,000 subscriptions. On Knovera, you buy coin packs as low as ₹45 and spend them 1 minute at a time.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-obsidian-950 border border-slate-800 hover:border-purple-500/40 transition-all shadow-md">
              <div className="w-12 h-12 rounded-xl bg-purple-950 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">100% Auto-Refund Guarantee</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Every session's coins are held in platform escrow. If the mentor disconnects early or the AI Sentinel detects topic drift, 100% of your credits are immediately refunded.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-obsidian-950 border border-slate-800 hover:border-amber-500/40 transition-all shadow-md">
              <div className="w-12 h-12 rounded-xl bg-amber-950 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/30">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Direct UPI & Instant QR Checkout</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Direct bank-to-bank settlement via scannable dynamic UPI QR code and deep links to GPay/PhonePe/Paytm with 0% gateway fees and official downloadable tax receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Micro-Tutors Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Learn from Top Practitioners
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Ex-Googlers, Stanford researchers, IIT fellows, and design leads ready for micro-sessions.
            </p>
          </div>
          <button
            onClick={() => setActivePage('student')}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold text-xs"
          >
            <span>View All Tutors</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                alt="Vikram"
                className="w-12 h-12 rounded-full object-cover border border-cyan-400/50"
              />
              <div>
                <h4 className="font-bold text-white text-sm">Dr. Vikram Malhotra</h4>
                <div className="text-[11px] text-cyan-300">Ex-Google Staff Engineer</div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>4.98 (142 sessions)</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4 line-clamp-2">
              Microservices, low-latency node engines, and rapid live Python debugging.
            </p>
            <button
              onClick={() => setActivePage('student')}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
            >
              Start 1-on-1 Micro-Session
            </button>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                alt="Ananya"
                className="w-12 h-12 rounded-full object-cover border border-purple-400/50"
              />
              <div>
                <h4 className="font-bold text-white text-sm">Ananya Deshmukh</h4>
                <div className="text-[11px] text-purple-300">GenAI Researcher & Stanford Alum</div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>4.95 (98 sessions)</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4 line-clamp-2">
              Building production LLM agents, RAG pipelines, and PyTorch fine-tuning drills.
            </p>
            <button
              onClick={() => setActivePage('student')}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
            >
              Start 1-on-1 Micro-Session
            </button>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                alt="Rajesh"
                className="w-12 h-12 rounded-full object-cover border border-amber-400/50"
              />
              <div>
                <h4 className="font-bold text-white text-sm">Prof. Rajesh Kulkarni</h4>
                <div className="text-[11px] text-amber-300">IIT Bombay Chair Fellow</div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>4.99 (324 sessions)</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4 line-clamp-2">
              Advanced Calculus, Jacobians, and linear algebra unblocking in 15-minute drills.
            </p>
            <button
              onClick={() => setActivePage('student')}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
            >
              Start 1-on-1 Micro-Session
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-obsidian-950 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">KNOVERA</span>
            <span>• Peer-to-Peer Micro-Tutoring Marketplace</span>
          </div>
          <div>
            1 Credit = 1 Minute of Live Learning • Protected by Knovera Escrow
          </div>
        </div>
      </footer>
    </div>
  );
}
