export function setupClassroomSocket(io) {
  // Store timers and states per room
  const activeRoomTimers = new Map();

  io.on('connection', (socket) => {
    // Join a classroom room
    socket.on('join_room', ({ sessionId, user }) => {
      socket.join(sessionId);
      socket.sessionId = sessionId;
      socket.user = user;

      // Broadcast participant joined
      io.to(sessionId).emit('user_joined', {
        user,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Start synchronized room timer if not already running
      if (!activeRoomTimers.has(sessionId)) {
        const timerState = {
          sessionId,
          secondsRemaining: 30 * 60, // default 30 mins
          totalSeconds: 30 * 60,
          elapsedMinutes: 0,
          isRunning: true,
          intervalId: null
        };

        timerState.intervalId = setInterval(() => {
          if (timerState.secondsRemaining > 0 && timerState.isRunning) {
            timerState.secondsRemaining -= 1;
            
            // Check if 1 minute elapsed for credit sync
            const elapsed = Math.floor((timerState.totalSeconds - timerState.secondsRemaining) / 60);
            if (elapsed > timerState.elapsedMinutes) {
              timerState.elapsedMinutes = elapsed;
              io.to(sessionId).emit('minute_tick', {
                elapsedMinutes: timerState.elapsedMinutes,
                message: `1 Minute elapsed • 1 Credit transferred from Escrow.`
              });
            }

            // Broadcast synchronized countdown every second
            io.to(sessionId).emit('timer_sync', {
              secondsRemaining: timerState.secondsRemaining,
              totalSeconds: timerState.totalSeconds,
              elapsedMinutes: timerState.elapsedMinutes
            });
          } else if (timerState.secondsRemaining <= 0) {
            clearInterval(timerState.intervalId);
            io.to(sessionId).emit('session_time_expired', {
              message: 'Scheduled micro-session duration has completed.'
            });
          }
        }, 1000);

        activeRoomTimers.set(sessionId, timerState);
      } else {
        // Send current timer state to newly joined user
        const existing = activeRoomTimers.get(sessionId);
        socket.emit('timer_sync', {
          secondsRemaining: existing.secondsRemaining,
          totalSeconds: existing.totalSeconds,
          elapsedMinutes: existing.elapsedMinutes
        });
      }
    });

    // Real-time Chat
    socket.on('send_message', ({ sessionId, message }) => {
      io.to(sessionId).emit('receive_message', {
        ...message,
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    // Collaborative Whiteboard Canvas draw event
    socket.on('whiteboard_draw', ({ sessionId, drawData }) => {
      // Broadcast to other participants in the room
      socket.to(sessionId).emit('whiteboard_draw', drawData);
    });

    socket.on('whiteboard_clear', ({ sessionId }) => {
      io.to(sessionId).emit('whiteboard_clear');
    });

    // WebRTC Signaling
    socket.on('webrtc_signal', ({ sessionId, signalData, targetSocketId }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_signal', {
          signalData,
          fromSocketId: socket.id
        });
      } else {
        socket.to(sessionId).emit('webrtc_signal', {
          signalData,
          fromSocketId: socket.id
        });
      }
    });

    // AI Session Integrity Real-Time Checkpoint Event
    socket.on('ai_integrity_update', ({ sessionId, checkpointId, status, coverageScore }) => {
      io.to(sessionId).emit('ai_integrity_update', {
        checkpointId,
        status,
        coverageScore,
        timestamp: new Date().toISOString()
      });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      if (socket.sessionId) {
        io.to(socket.sessionId).emit('user_left', {
          user: socket.user,
          socketId: socket.id
        });

        // If teacher left prematurely during active session
        if (socket.user?.role === 'teacher') {
          io.to(socket.sessionId).emit('teacher_disconnected_warning', {
            message: 'Teacher disconnected. 100% Escrow Auto-Refund protection active if connection is not restored within 2 minutes.'
          });
        }
      }
    });
  });
}
