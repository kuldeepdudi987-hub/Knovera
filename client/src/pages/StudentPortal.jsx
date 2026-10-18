import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Clock, Video, Calendar, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import CelebratoryBanner from '../components/CelebratoryBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import { apiRequest } from '../utils/api.js';

const SUBJECT_CATEGORIES = [
  'All',
  'Coding',
  'Maths',
  'Design',
  'Languages',
  'Exam Prep',
  'AI & Data Science'
];

export default function StudentPortal({ setActivePage, setSelectedSessionId }) {
  const { user, isLoggedIn, devLogin } = useAuth();
  const { wallet, refreshWallet, openBuyModal, triggerCelebration } = useWallet();

  const [tutors, setTutors] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingModalTutor, setBookingModalTutor] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [targetTopic, setTargetTopic] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Load tutors & my sessions
  useEffect(() => {
    fetchTutors();
    if (isLoggedIn) {
      fetchMySessions();
    }
  }, [selectedSubject, onlineOnly, minRating, isLoggedIn]);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubject !== 'All') params.append('subject', selectedSubject);
      if (onlineOnly) params.append('onlineOnly', 'true');
      if (minRating) params.append('minRating', minRating);
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiRequest(`/tutors?${params.toString()}`);
      if (res.success) {
        setTutors(res.tutors);
      }
    } catch (e) {
      console.warn('Could not fetch tutors:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySessions = async () => {
    try {
      const res = await apiRequest('/sessions/my');
      if (res.success) {
        setMySessions(res.sessions);
      }
    } catch (e) {
      console.warn('Could not fetch sessions:', e);
    }
  };

  const handleInstantConnect = async (tutor) => {
    if (!isLoggedIn) {
      await devLogin('student');
    }
    setBookingModalTutor(tutor);
    setTargetTopic(`Clarify ${tutor.subjects?.[0] || 'concept'} doubts and live code drill`);
  };

  const handleConfirmBooking = async (isInstant = true) => {
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await apiRequest('/sessions/create', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: bookingModalTutor.id,
          title: `${durationMinutes}-Min Micro-Session with ${bookingModalTutor.name}`,
          subject: bookingModalTutor.subjects?.[0] || 'Coding',
          sessionType: 'one_on_one',
          durationMinutes: parseInt(durationMinutes, 10),
          targetTopic: targetTopic || 'Core concepts and doubt resolution',
          isInstant
        })
      });

      if (res.success) {
        triggerCelebration();
        await refreshWallet();
        await fetchMySessions();
        setBookingModalTutor(null);
        setSelectedSessionId(res.session.id);
        setActivePage('classroom');
      }
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const silverCoins = wallet?.silver_coins || 0;
  const goldenCoins = wallet?.golden_coins || 0;

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col pb-16">
      {/* Celebratory 60 Free Coins Banner */}
      <CelebratoryBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full space-y-8">
        
        {/* Portal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>Skill Marketplace & Micro-Sessions</span>
              <span className="text-xs bg-cyan-950 text-cyan-400 font-bold px-2.5 py-1 rounded-full border border-cyan-500/30">
                1 Credit = 1 Minute
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Find verified mentors for instant pair programming, calculus derivations, or design critiques.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openBuyModal('golden')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:opacity-95 text-obsidian-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>+ Buy 1-on-1 Golden Coins</span>
            </button>
          </div>
        </div>

        {/* Active / Ongoing Sessions Alert Banner if any */}
        {mySessions.some(s => s.status === 'active') && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/90 to-purple-950/80 border border-cyan-400/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-glow-cyan/20">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">Live Session in Progress</span>
                <span className="text-sm font-extrabold text-white">
                  {mySessions.find(s => s.status === 'active')?.title}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                const live = mySessions.find(s => s.status === 'active');
                setSelectedSessionId(live.id);
                setActivePage('classroom');
              }}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Enter Live Classroom Now</span>
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by topic, skill (e.g. Python, Calculus, Figma, IELTS, AWS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTutors()}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 self-end md:self-auto text-xs">
              <button
                onClick={() => setOnlineOnly(!onlineOnly)}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 font-bold transition-all ${
                  onlineOnly
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${onlineOnly ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>Online Only</span>
              </button>

              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="">All Ratings</option>
                <option value="4.9">⭐ 4.9+ Stars</option>
                <option value="4.8">⭐ 4.8+ Stars</option>
              </select>
            </div>
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
            {SUBJECT_CATEGORIES.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedSubject === subj
                    ? 'bg-cyan-500 text-obsidian-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Tutors Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400 font-semibold">
              Showing <strong className="text-white">{tutors.length}</strong> verified tutors
            </span>
            <span className="text-xs text-cyan-400 font-mono">
              Rate: 1 Coin = 1 Minute
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className="rounded-2xl bg-obsidian-900/80 border border-slate-800/80 p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-md group"
                >
                  <div>
                    {/* Header: Avatar, Name, Rating */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative">
                        <img
                          src={tutor.avatar}
                          alt={tutor.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-700 group-hover:border-cyan-400 transition-colors"
                        />
                        {tutor.is_online && (
                          <span
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-obsidian-900"
                            title="Online Now for Instant Connect"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-white text-base truncate">{tutor.name}</h3>
                        </div>
                        <div className="text-xs text-cyan-400 font-medium truncate mt-0.5">
                          {tutor.headline}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mt-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{tutor.rating}</span>
                          <span className="text-slate-500 font-normal">({tutor.total_reviews} sessions)</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                      {tutor.bio}
                    </p>

                    {/* Subject Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(Array.isArray(tutor.subjects) ? tutor.subjects : []).slice(0, 4).map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/70 text-slate-300 border border-slate-700/50"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Action Buttons */}
                  <div className="border-t border-slate-800 pt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Micro-Pricing:</span>
                      <span className="font-bold text-amber-300">1 Golden Coin / min</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleInstantConnect(tutor)}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:opacity-95 text-obsidian-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Instant 1-on-1</span>
                      </button>

                      <button
                        onClick={() => handleInstantConnect(tutor)}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Schedule</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Micro-Sessions Section */}
        {mySessions.length > 0 && (
          <div className="border-t border-slate-800/80 pt-8 space-y-4">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>My Micro-Sessions History</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mySessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        session.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 animate-pulse'
                          : session.status === 'refunded'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {session.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {session.duration_minutes} Mins • {session.coin_type}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white truncate max-w-sm">
                      {session.title}
                    </h4>

                    {session.refund_reason && (
                      <div className="text-[11px] text-purple-300 font-medium">
                        🛡️ 100% Escrow Auto-Refunded: {session.refund_reason}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setActivePage('classroom');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 whitespace-nowrap"
                  >
                    <span>{session.status === 'active' ? 'Re-enter Room' : 'View Classroom'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Confirmation / Topic Setup Modal */}
      {bookingModalTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-obsidian-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="font-extrabold text-white text-base">
                  Start Micro-Session with {bookingModalTutor.name}
                </h3>
              </div>
              <button
                onClick={() => setBookingModalTutor(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>{bookingError}</div>
                  <button
                    onClick={() => {
                      setBookingModalTutor(null);
                      openBuyModal('golden');
                    }}
                    className="font-bold underline text-amber-300"
                  >
                    Top-up Golden Coins now &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Target Topic Requirement */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Target Topic / Question for AI Sentinel:
              </label>
              <textarea
                rows={2}
                value={targetTopic}
                onChange={(e) => setTargetTopic(e.target.value)}
                placeholder="e.g. Profiling asyncio deadlocks or solving integration by parts"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The AI Session Sentinel tracks topic coverage to guarantee your 100% refund protection.
              </p>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Session Duration (1 Credit = 1 Minute)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      durationMinutes === mins
                        ? 'bg-amber-950/50 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mins} Mins ({mins} Coins)
                  </button>
                ))}
              </div>
            </div>

            {/* Escrow Lock Details */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Coins Held in Escrow:</span>
                <span className="font-extrabold text-amber-300">{durationMinutes} Golden Coins</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Available Golden Balance:</span>
                <span className="font-bold text-white">{goldenCoins} Golden Coins</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] pt-1 border-t border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>100% Escrow Auto-Refund applies if teacher is absent or quality fails</span>
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookingModalTutor(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleConfirmBooking(true)}
                disabled={bookingLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:opacity-95 text-obsidian-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
              >
                {bookingLoading ? 'Connecting...' : `Lock ${durationMinutes} Coins & Launch Room`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
