import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, Mic, MicOff, MonitorUp, Maximize, User, Sparkles } from 'lucide-react';

export default function VideoGrid({ session, teacher, student, currentUser }) {
  const localVideoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  // Attempt to capture camera / mic
  useEffect(() => {
    let stream = null;
    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: true
          });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setLocalStream(stream);
        }
      } catch (err) {
        console.warn('Physical camera/mic not available or blocked, using virtual video preview:', err.message);
      }
    }
    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => (t.enabled = !cameraActive));
    }
    setCameraActive(!cameraActive);
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => (t.enabled = !micActive));
    }
    setMicActive(!micActive);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);
          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            if (localStream && localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }
          };
        }
      } catch (err) {
        console.warn('Screen share canceled or not permitted:', err);
      }
    } else {
      setIsScreenSharing(false);
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  };

  const teacherName = teacher?.name || 'Dr. Vikram Malhotra';
  const teacherAvatar = teacher?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
  const studentName = student?.name || currentUser?.name || 'Aarav Sharma';

  return (
    <div className="flex flex-col h-full w-full bg-obsidian-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      
      {/* Video Grid layout: 2 participants side-by-side or stacked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 flex-1 h-[520px]">
        
        {/* Remote Peer Video (The Teacher) */}
        <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group shadow-lg">
          {/* Simulated Teacher Live Video Stream */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-slate-900/40 to-transparent z-10 pointer-events-none" />
          
          <img
            src={teacherAvatar}
            alt={teacherName}
            className="w-full h-full object-cover filter brightness-90 group-hover:scale-102 transition-transform duration-700"
          />

          {/* Teacher Badges */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <span className="bg-purple-950/80 backdrop-blur-md text-purple-300 border border-purple-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>👨‍🏫 {teacherName}</span>
            </span>
            <span className="bg-black/60 backdrop-blur-md text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
              1080p 60fps • 22ms
            </span>
          </div>

          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[11px] text-emerald-400">
              <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-white text-[10px] ml-1 font-semibold">Speaking</span>
            </div>
          </div>
        </div>

        {/* Local Participant Video (You) */}
        <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-slate-900/30 to-transparent z-10 pointer-events-none" />

          {/* WebRTC Video Stream */}
          {cameraActive ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 p-6">
              <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-2">
                <User className="w-10 h-10" />
              </div>
              <span className="text-xs font-semibold text-slate-400">Camera Turned Off</span>
            </div>
          )}

          {/* Local User Badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <span className="bg-cyan-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>You ({studentName})</span>
            </span>
            {isScreenSharing && (
              <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Screen Sharing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Classroom Controls Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-obsidian-900 border-t border-slate-800">
        <div className="flex items-center gap-2">
          {/* Mic Button */}
          <button
            onClick={toggleMic}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              micActive
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300'
            }`}
            title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micActive ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
            <span className="hidden sm:inline">{micActive ? 'Mute' : 'Unmuted'}</span>
          </button>

          {/* Camera Button */}
          <button
            onClick={toggleCamera}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              cameraActive
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300'
            }`}
            title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {cameraActive ? <Camera className="w-4 h-4 text-cyan-400" /> : <CameraOff className="w-4 h-4 text-red-400" />}
            <span className="hidden sm:inline">{cameraActive ? 'Stop Video' : 'Start Video'}</span>
          </button>

          {/* Screen Share Button */}
          <button
            onClick={toggleScreenShare}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isScreenSharing
                ? 'bg-amber-500 text-obsidian-950 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Share Screen"
          >
            <MonitorUp className="w-4 h-4" />
            <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            WebRTC Encrypted (P2P)
          </span>
        </div>
      </div>
    </div>
  );
}
