import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, Clock, Users, ArrowUpRight, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, Send, Video, Calendar, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import { apiRequest } from '../utils/api.js';

export default function TeacherPortal({ setActivePage, setSelectedSessionId }) {
  const { user, devLogin, isLoggedIn } = useAuth();
  const { refreshWallet, triggerCelebration } = useWallet();

  const [stats, setStats] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [teacherSessions, setTeacherSessions] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  // Profile Form States
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [subjectsStr, setSubjectsStr] = useState('');
  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Group Room Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupSubject, setGroupSubject] = useState('Coding');
  const [groupDuration, setGroupDuration] = useState(45);
  const [groupCapacity, setGroupCapacity] = useState(8);

  // UPI Withdrawal Modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [withdrawalUpiId, setWithdrawalUpiId] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('1000');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');
  const [payoutError, setPayoutError] = useState('');

  // Auto-login as Teacher if visiting portal not signed in
  useEffect(() => {
    async function init() {
      if (!isLoggedIn || user?.role !== 'teacher') {
        await devLogin('teacher');
      }
      fetchPayoutStats();
      fetchTeacherSessions();
    }
    init();
  }, [isLoggedIn, user?.role]);

  // Sync profile fields from user
  useEffect(() => {
    if (user) {
      setHeadline(user.headline || 'Senior Cloud & Systems Architect');
      setBio(user.bio || 'Helping engineers master distributed architectures and cloud migrations.');
      setSubjectsStr(Array.isArray(user.subjects) ? user.subjects.join(', ') : (user.subjects || 'Coding, AWS, Node.js'));
      setDemoVideoUrl(user.demo_video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      setIsOnline(user.is_online !== undefined ? user.is_online : true);
    }
  }, [user]);

  const fetchPayoutStats = async () => {
    try {
      const res = await apiRequest('/payouts/stats');
      if (res.success) {
        setStats(res.stats);
        setPayoutHistory(res.payoutHistory || []);
      }
    } catch (e) {
      console.warn('Could not fetch payout stats:', e);
    }
  };

  const fetchTeacherSessions = async () => {
    try {
      const res = await apiRequest('/sessions/my');
      if (res.success) {
        setTeacherSessions(res.sessions);
      }
    } catch (e) {
      console.warn('Could not fetch teacher sessions:', e);
    }
  };

  const handleToggleOnline = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    try {
      await apiRequest('/tutors/profile', {
        method: 'PUT',
        body: JSON.stringify({ is_online: nextStatus })
      });
    } catch (e) {
      console.warn('Failed to update online status:', e);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const subjectsArray = subjectsStr.split(',').map(s => s.trim()).filter(Boolean);
      const res = await apiRequest('/tutors/profile', {
        method: 'PUT',
        body: JSON.stringify({
          headline,
          bio,
          subjects: subjectsArray,
          demo_video_url: demoVideoUrl
        })
      });
      if (res.success) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (err) {
      alert('Failed to save profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroupRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/sessions/group-create', {
        method: 'POST',
        body: JSON.stringify({
          title: groupTitle || 'Live Interactive Masterclass',
          subject: groupSubject,
          durationMinutes: parseInt(groupDuration, 10),
          maxStudents: parseInt(groupCapacity, 10)
        })
      });
      if (res.success) {
        triggerCelebration();
        setIsGroupModalOpen(false);
        fetchTeacherSessions();
      }
    } catch (err) {
      alert('Failed to schedule group room: ' + err.message);
    }
  };

  const handleRequestUpiPayout = async (e) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutError('');
    setPayoutMessage('');
    try {
      const res = await apiRequest('/payouts/request-upi', {
        method: 'POST',
        body: JSON.stringify({
          upiId: withdrawalUpiId,
          amountInr: parseFloat(withdrawalAmount)
        })
      });
      if (res.success) {
        triggerCelebration();
        setPayoutMessage(res.message);
        await refreshWallet();
        await fetchPayoutStats();
        setTimeout(() => {
          setIsPayoutModalOpen(false);
          setPayoutMessage('');
        }, 2500);
      }
    } catch (err) {
      setPayoutError(err.message);
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full space-y-8">
        
        {/* Top Header & Availability Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-950 text-purple-300 font-bold px-2.5 py-1 rounded-full border border-purple-500/30 uppercase tracking-wider">
                Teacher Dashboard
              </span>
              <span className="text-xs text-slate-400">• Knovera Micro-Mentor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Welcome back, {user?.name || 'Dr. Priya Nair'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Availability Toggle */}
            <button
              onClick={handleToggleOnline}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all border ${
                isOnline
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isOnline ? '🟢 Available for Instant Micro-Sessions' : '🔴 Marked Away'}</span>
            </button>

            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Group Room</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics & Earnings Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Minutes Taught */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Total Learning Minutes</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {stats?.totalMinutesTaught || 1240}
            </div>
            <div className="text-[11px] text-cyan-300 mt-1">
              1 Credit per minute completed
            </div>
          </div>

          {/* Card 2: Cumulative INR Earnings */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Cumulative Earnings</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              ₹{stats?.inrEarnings || 4850}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Mediator spread: 75% Net to Teacher
            </div>
          </div>

          {/* Card 3: Pending Escrow Balance */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Pending in Escrow</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-300 font-mono">
              ₹{stats?.pendingEscrowInr || 650}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Held until session completion
            </div>
          </div>

          {/* Card 4: Withdrawable INR Balance & CTA */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/50 to-obsidian-900 border border-purple-500/40 shadow-glow-purple/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-purple-300 text-xs mb-1 font-bold">
                <span>Withdrawable Balance</span>
                <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-full">Min ₹200</span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                ₹{stats?.withdrawableInr || 4200}
              </div>
            </div>

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all active:scale-95"
            >
              <span>Instant UPI Withdrawal</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Platform Spread Transparency Banner */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Platform Fee Spread Transparency</span>
              <span className="text-slate-400">
                Gross 1-on-1 Minute Rate: <strong className="text-white">₹5.00/min</strong> • Teacher Net: <strong className="text-emerald-400">₹3.75/min (75%)</strong> • Platform Facilitation Spread: <strong className="text-purple-300">25%</strong>
              </span>
            </div>
          </div>
          <div className="text-slate-400 text-right">
            Disbursements processed directly to your linked UPI ID within seconds.
          </div>
        </div>

        {/* Teacher Sessions & Profile Setup Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Incoming & Scheduled Sessions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-400" />
                <span>My Teaching Sessions</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {teacherSessions.length} total sessions
              </span>
            </div>

            <div className="space-y-3">
              {teacherSessions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
                  No sessions yet. Keep your availability toggled ON to receive instant 1-on-1 requests!
                </div>
              ) : (
                teacherSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-obsidian-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          s.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 animate-pulse'
                            : s.status === 'completed'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-purple-950 text-purple-300'
                        }`}>
                          {s.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {s.duration_minutes} Mins • {s.session_type === 'group' ? 'Silver Group' : 'Golden 1-on-1'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{s.title}</h4>
                      <div className="text-xs text-slate-400">
                        Target Topic: <span className="text-slate-300">{s.target_topic || 'Live doubt solving'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSessionId(s.id);
                        setActivePage('classroom');
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md self-end sm:self-auto"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{s.status === 'active' ? 'Re-enter Room' : 'Open Classroom'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Payout History Ledger */}
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-base font-bold text-white mb-3">
                Recent UPI Payout Settlements
              </h3>
              <div className="space-y-2">
                {payoutHistory.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/30 text-xs text-slate-500 text-center">
                    No payouts requested yet.
                  </div>
                ) : (
                  payoutHistory.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>Disbursed ₹{p.amount_inr}</span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                            COMPLETED
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          VPA: {p.upi_id} • Ref: {p.transaction_ref}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Teacher Profile & Skill Setup */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-md space-y-4">
              <h3 className="text-base font-bold text-white">
                Teacher Profile & Availability
              </h3>

              {profileSaved && (
                <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs">
                  ✓ Profile settings saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Professional Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Principal Systems Architect | Ex-Googler"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Skills & Subjects (Comma-separated)</label>
                  <input
                    type="text"
                    value={subjectsStr}
                    onChange={(e) => setSubjectsStr(e.target.value)}
                    placeholder="Python, System Design, React, AWS"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Mentor Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your expertise and micro-tutoring style"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Demo Video Link (YouTube / Loom)</label>
                  <input
                    type="url"
                    value={demoVideoUrl}
                    onChange={(e) => setDemoVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors border border-slate-700"
                >
                  {loading ? 'Saving...' : 'Update Teacher Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Group Room Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-obsidian-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Schedule Multi-Student Group Room</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateGroupRoom} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Group Session Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master React 19 Server Actions & Transitions"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Subject</label>
                  <select
                    value={groupSubject}
                    onChange={(e) => setGroupSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="Coding">Coding</option>
                    <option value="Maths">Maths</option>
                    <option value="Design">Design</option>
                    <option value="Languages">Languages</option>
                    <option value="Exam Prep">Exam Prep</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={groupCapacity}
                    onChange={(e) => setGroupCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Duration (Minutes)</label>
                <select
                  value={groupDuration}
                  onChange={(e) => setGroupDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="30">30 Mins (30 Silver Coins)</option>
                  <option value="45">45 Mins (45 Silver Coins)</option>
                  <option value="60">60 Mins (60 Silver Coins)</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-400">
                Students will join with Silver Coins. Earnings settle directly to your INR balance upon completion.
              </p>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/25"
              >
                Create Group Masterclass
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Instant UPI Withdrawal Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-obsidian-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="font-extrabold text-white text-base">Instant UPI Payout Request</h3>
              </div>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {payoutMessage && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                ✓ {payoutMessage}
              </div>
            )}

            {payoutError && (
              <div className="p-3 rounded-xl bg-red-950 border border-red-500/40 text-red-300 text-xs font-semibold">
                ✕ {payoutError}
              </div>
            )}

            <form onSubmit={handleRequestUpiPayout} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Your Registered UPI ID (VPA)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. priya.nair@okhdfcbank or 9876543210@paytm"
                  value={withdrawalUpiId}
                  onChange={(e) => setWithdrawalUpiId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-medium">Amount to Withdraw (INR)</label>
                  <span className="text-slate-400 font-mono">
                    Available: ₹{stats?.withdrawableInr || 4200}
                  </span>
                </div>
                <input
                  type="number"
                  min="200"
                  max={stats?.withdrawableInr || 4200}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-400 font-mono text-base font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>• Minimum withdrawal threshold: <strong className="text-white">₹200.00</strong></div>
                <div>• Settlement speed: <strong className="text-emerald-400">Immediate IMPS/UPI routing</strong></div>
                <div>• Platform spread deducted during active learning minutes. No additional withdrawal fees.</div>
              </div>

              <button
                type="submit"
                disabled={payoutLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/25 disabled:opacity-50"
              >
                {payoutLoading ? 'Processing Settlement...' : `Confirm & Withdraw ₹${withdrawalAmount} via UPI`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
