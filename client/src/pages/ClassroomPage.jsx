import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { ShieldCheck, Clock, Video, Edit3, MessageSquare, AlertTriangle, CheckCircle2, Send, PhoneOff, Sparkles, Check, ChevronRight, RefreshCw, Star } from 'lucide-react';
import VideoGrid from '../components/VideoGrid.jsx';
import WhiteboardCanvas from '../components/WhiteboardCanvas.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import { apiRequest } from '../utils/api.js';

export default function ClassroomPage({ sessionId = 'session-demo-live-1', setActivePage }) {
  const { user, devLogin, isLoggedIn } = useAuth();
  const { wallet, refreshWallet, triggerCelebration } = useWallet();

  const [session, setSession] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'whiteboard' | 'split'
  const [socket, setSocket] = useState(null);

  // Synchronized Timer States
  const [secondsRemaining, setSecondsRemaining] = useState(30 * 60);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // AI Sentinel Integrity State
  const [aiScore, setAiScore] = useState(88);
  const [aiCheckpoints, setAiCheckpoints] = useState([
    { id: 1, label: 'Target Topic Alignment', status: 'verified', note: 'Session matches student stated learning goal.' },
    { id: 2, label: 'Teacher Audio & Video Presence', status: 'verified', note: 'Active two-way stream confirmed.' },
    { id: 3, label: 'Concept Explanation & Code Drill', status: 'in_progress', note: 'Deep-dive explanation underway.' },
    { id: 4, label: 'Q&A & Doubt Resolution Check', status: 'pending', note: 'Awaiting student comprehension check.' }
  ]);

  // Real-time Chat
  const [messages, setMessages] = useState([
    {
      id: 'sys-1',
      sender: 'Knovera AI Sentinel',
      isSystem: true,
      text: '🛡️ 100% Escrow Auto-Refund Guarantee is ACTIVE. 1 Credit deducted per verified minute.',
      timestamp: '12:00'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef(null);

  // Refund / Completion Banner States
  const [refundAlert, setRefundAlert] = useState(null);
  const [completedNotice, setCompletedNotice] = useState(null);
  const [ratingModal, setRatingModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Socket Connection and Session Fetch
  useEffect(() => {
    async function initSession() {
      if (!isLoggedIn) {
        await devLogin('student');
      }

      try {
        const res = await apiRequest(`/classroom/${sessionId}/state`);
        if (res.success) {
          setSession(res.session);
          setTeacher(res.teacher);
          setStudent(res.student);
          if (res.roomState) {
            setSecondsRemaining(res.roomState.secondsRemaining);
            setAiScore(res.roomState.topicCoverageScore);
            setAiCheckpoints(res.roomState.aiCheckpoints);
          }
        }
      } catch (err) {
        console.warn('Failed to load session details:', err);
      }
    }
    initSession();

    // Socket Setup
    const newSocket = io({ path: '/socket.io' });
    setSocket(newSocket);

    newSocket.emit('join_room', {
      sessionId,
      user: user || { id: 'temp-user', name: 'Learner', role: 'student' }
    });

    newSocket.on('timer_sync', (data) => {
      setSecondsRemaining(data.secondsRemaining);
      setElapsedMinutes(data.elapsedMinutes);
    });

    newSocket.on('minute_tick', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `tick-${Date.now()}`,
          sender: 'Knovera Escrow',
          isSystem: true,
          text: `⏱️ ${data.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    });

    newSocket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('teacher_disconnected_warning', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `warn-${Date.now()}`,
          sender: 'AI Sentinel Alert',
          isSystem: true,
          text: `⚠️ ${data.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, isLoggedIn]);

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Format MM:SS
  const formatTimer = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    const newMsg = {
      sessionId,
      message: {
        sender: user?.name || 'You',
        role: user?.role || 'student',
        text: chatInput.trim()
      }
    };

    socket.emit('send_message', newMsg);
    setChatInput('');
  };

  // 100% Escrow Auto-Refund Trigger
  const handleTriggerRefund = async (reason = 'AI Monitor Quality Check or Teacher Disconnect') => {
    if (!confirm('Execute 100% Escrow Auto-Refund? All locked coins will be immediately restored to your balance.')) return;
    try {
      const res = await apiRequest(`/classroom/${sessionId}/trigger-refund`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      if (res.success) {
        triggerCelebration();
        await refreshWallet();
        setRefundAlert(res.message);
        setSession((prev) => ({ ...prev, status: 'refunded' }));
      }
    } catch (err) {
      alert(err.message || 'Refund trigger failed');
    }
  };

  // End Session / Complete Learning Flow
  const handleCompleteSession = async () => {
    try {
      const res = await apiRequest(`/classroom/${sessionId}/complete`, {
        method: 'POST'
      });
      if (res.success) {
        triggerCelebration();
        await refreshWallet();
        setCompletedNotice(res.message);
        setRatingModal(true);
      }
    } catch (err) {
      alert(err.message || 'Complete session failed');
    }
  };

  // Calculate timer alert color state
  const isCriticalTime = secondsRemaining <= 120;
  const isWarningTime = secondsRemaining > 120 && secondsRemaining <= 300;

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col pb-10">
      
      {/* Classroom Top Bar */}
      <div className="bg-obsidian-900 border-b border-slate-800 px-4 py-3 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Left: Session Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePage('student')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              &larr; Exit
            </button>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {session?.title || 'Live 1-on-1 Micro-Tutoring Session'}
                </span>
                <span className="text-[10px] bg-purple-900/60 text-purple-300 font-extrabold px-2 py-0.5 rounded-full border border-purple-500/30 uppercase">
                  {session?.coin_type || 'golden'} Coins
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Mentor: <strong className="text-cyan-400">{teacher?.name || 'Dr. Vikram Malhotra'}</strong></span>
                <span>•</span>
                <span>Target: {session?.target_topic || 'AsyncIO Profiling & Concept Drill'}</span>
              </div>
            </div>
          </div>

          {/* Right: Live Countdown Timer & Auto-Refund Shield */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            
            {/* Live Credit Countdown Timer */}
            <div
              className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl border transition-all ${
                isCriticalTime
                  ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                  : isWarningTime
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-cyan-500/40 text-cyan-300 shadow-glow-cyan/20'
              }`}
            >
              <Clock className="w-4 h-4" />
              <div>
                <span className="text-lg font-black font-mono tracking-wider">
                  {formatTimer(secondsRemaining)}
                </span>
                <span className="text-[10px] block leading-none opacity-80">
                  {session?.coins_per_minute || 1} Credit / Min
                </span>
              </div>
            </div>

            {/* 100% Refund Shield Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Refund Protected</span>
            </div>

            {/* End Session Button */}
            <button
              onClick={handleCompleteSession}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Finish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Refund Success Banner if triggered */}
      {refundAlert && (
        <div className="bg-gradient-to-r from-emerald-950 via-purple-950 to-slate-950 border-b border-emerald-500/40 p-4 text-center animate-fade-in">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm text-emerald-300 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{refundAlert}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Collaborative Workspace (Video / Whiteboard / Split) */}
        <div className="lg:col-span-2 flex flex-col space-y-3">
          
          {/* Workspace View Mode Toggle */}
          <div className="flex items-center justify-between bg-obsidian-900 p-1.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('video')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'video'
                    ? 'bg-cyan-500 text-obsidian-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video Grid</span>
              </button>

              <button
                onClick={() => setActiveTab('whiteboard')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'whiteboard'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Collaborative Whiteboard</span>
              </button>

              <button
                onClick={() => setActiveTab('split')}
                className={`hidden sm:flex px-3 py-1.5 rounded-lg font-bold items-center gap-1.5 transition-all ${
                  activeTab === 'split'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Dual Split</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Room ID: {sessionId}
            </div>
          </div>

          {/* Dynamic Workspace Container */}
          <div className="flex-1 min-h-[520px]">
            {activeTab === 'video' && (
              <VideoGrid
                session={session}
                teacher={teacher}
                student={student}
                currentUser={user}
              />
            )}

            {activeTab === 'whiteboard' && (
              <WhiteboardCanvas
                socket={socket}
                sessionId={sessionId}
              />
            )}

            {activeTab === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-[520px]">
                <VideoGrid
                  session={session}
                  teacher={teacher}
                  student={student}
                  currentUser={user}
                />
                <WhiteboardCanvas
                  socket={socket}
                  sessionId={sessionId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Col: AI Session Integrity Monitor & Real-Time Chat */}
        <div className="space-y-6 flex flex-col">
          
          {/* AI Session Integrity & Sentinel Panel */}
          <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <h3 className="text-sm font-extrabold text-white">
                  AI Session Integrity Monitor
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            {/* Target Topic Requirement Display */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Target Learning Goal:</span>
              <p className="text-slate-200 font-medium">
                {session?.target_topic || 'Clarify memory leaks and debug asyncio event loop bottlenecks.'}
              </p>
            </div>

            {/* Topic Coverage Progress Bar */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
                <span className="text-slate-400">Target Topic Coverage:</span>
                <span className="text-cyan-400 font-bold">{aiScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${aiScore}%` }}
                />
              </div>
            </div>

            {/* AI Checkpoints List */}
            <div className="space-y-2 text-xs">
              {aiCheckpoints.map((cp) => (
                <div
                  key={cp.id}
                  className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {cp.status === 'verified' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : cp.status === 'in_progress' ? (
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                    )}
                    <span className="text-slate-200 font-medium text-[11px]">{cp.label}</span>
                  </div>

                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    cp.status === 'verified'
                      ? 'text-emerald-400 bg-emerald-950/80'
                      : cp.status === 'in_progress'
                      ? 'text-cyan-300 bg-cyan-950/80'
                      : 'text-slate-500 bg-slate-900'
                  }`}>
                    {cp.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>

            {/* Auto-Refund Trigger Button */}
            <button
              onClick={() => handleTriggerRefund('Student requested AI Quality review: Topic mismatch')}
              className="w-full py-2 px-3 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Report Issue / Trigger AI 100% Refund</span>
            </button>
          </div>

          {/* Real-time Classroom Chat */}
          <div className="flex-1 rounded-2xl bg-obsidian-900 border border-slate-800 flex flex-col overflow-hidden min-h-[320px] shadow-md">
            <div className="px-4 py-3 border-b border-slate-800 bg-obsidian-950/60 flex items-center justify-between text-xs font-bold text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Classroom Live Chat</span>
              </div>
              <span className="text-slate-500 text-[10px] font-mono">Encrypted P2P</span>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[260px] text-xs"
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-xs space-y-0.5 ${
                    m.isSystem
                      ? 'bg-slate-950/80 border border-slate-800 text-cyan-300 text-[11px]'
                      : m.role === 'teacher'
                      ? 'bg-purple-950/40 border border-purple-500/30 text-slate-200'
                      : 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-white">{m.sender}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="text-slate-300 leading-relaxed">{m.text}</div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-800 bg-obsidian-950 flex gap-2">
              <input
                type="text"
                placeholder="Ask doubt or share code..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Rating & Review Modal after Session Completion */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-obsidian-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">Micro-Session Completed!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Credits successfully settled. How was your session with {teacher?.name || 'your mentor'}?
              </p>
            </div>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Leave a quick review for the mentor (optional)..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
            />

            <button
              onClick={() => {
                setRatingModal(false);
                setActivePage('student');
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-black text-xs shadow-md shadow-cyan-500/20 transition-all"
            >
              Submit & Return to Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
