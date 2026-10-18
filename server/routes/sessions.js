import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET } from '../config.js';

const router = express.Router();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /api/sessions/my - Get all sessions for the current user (as student or teacher)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const isTeacher = req.user.role === 'teacher';
    const sessions = await db.find('sessions', s => 
      isTeacher ? s.teacher_id === req.user.id : (s.student_id === req.user.id || s.session_type === 'group')
    );

    // Attach teacher and student profiles
    const populated = await Promise.all(sessions.map(async s => {
      const teacher = await db.findOne('users', u => u.id === s.teacher_id);
      const student = s.student_id ? await db.findOne('users', u => u.id === s.student_id) : null;
      return {
        ...s,
        teacher: teacher ? { id: teacher.id, name: teacher.name, avatar: teacher.avatar, rating: teacher.rating } : null,
        student: student ? { id: student.id, name: student.name, avatar: student.avatar } : null
      };
    }));

    // Sort: active first, then scheduled by date
    populated.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return res.json({ success: true, sessions: populated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id - Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await db.findOne('sessions', s => s.id === req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const teacher = await db.findOne('users', u => u.id === session.teacher_id);
    const student = session.student_id ? await db.findOne('users', u => u.id === session.student_id) : null;

    return res.json({
      success: true,
      session: {
        ...session,
        teacher: teacher ? { id: teacher.id, name: teacher.name, avatar: teacher.avatar, rating: teacher.rating, headline: teacher.headline } : null,
        student: student ? { id: student.id, name: student.name, avatar: student.avatar } : null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/create - Book or Start Instant Micro-Session
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      teacherId,
      title,
      subject,
      sessionType = 'one_on_one',
      durationMinutes = 30,
      targetTopic,
      learningGoals,
      isInstant = false
    } = req.body;

    const teacher = await db.findOne('users', u => u.id === teacherId);
    if (!teacher) return res.status(404).json({ error: 'Selected teacher not found' });

    const duration = parseInt(durationMinutes, 10);
    const coinType = sessionType === 'group' ? 'silver' : 'golden';
    const coinsNeeded = duration; // 1 Credit = 1 Minute!

    // Verify student wallet balance
    const wallet = await db.findOne('wallets', w => w.user_id === req.user.id);
    if (!wallet) return res.status(404).json({ error: 'Student wallet not found' });

    const currentCoinBalance = coinType === 'golden' ? wallet.golden_coins : wallet.silver_coins;
    if (currentCoinBalance < coinsNeeded) {
      return res.status(400).json({
        error: `Insufficient ${coinType === 'golden' ? 'Golden' : 'Silver'} Coins! You have ${currentCoinBalance} coins, but need ${coinsNeeded} coins for a ${duration}-minute session.`,
        required: coinsNeeded,
        available: currentCoinBalance,
        coinType
      });
    }

    const sessionId = `session-${isInstant ? 'instant' : 'sched'}-${Date.now()}`;
    const newSession = {
      id: sessionId,
      title: title || `${duration}-Min Micro-Session on ${subject || 'Skills'}`,
      subject: subject || 'Coding',
      session_type: sessionType,
      teacher_id: teacher.id,
      student_id: req.user.id,
      max_students: sessionType === 'group' ? 8 : 1,
      scheduled_at: isInstant ? new Date().toISOString() : (req.body.scheduledAt || new Date().toISOString()),
      duration_minutes: duration,
      coins_per_minute: 1,
      coin_type: coinType,
      status: isInstant ? 'active' : 'scheduled',
      target_topic: targetTopic || 'Core concepts and live problem-solving',
      learning_goals: learningGoals || '1. Clarify doubts\n2. Practical code or concept drill\n3. Next steps recap',
      ai_integrity_score: 100,
      created_at: new Date().toISOString()
    };

    // Save session
    await db.insert('sessions', newSession);

    // Deduct coins from balance and lock into escrow
    if (coinType === 'golden') {
      await db.update('wallets', w => w.user_id === req.user.id, w => ({
        ...w,
        golden_coins: w.golden_coins - coinsNeeded,
        escrow_golden: (w.escrow_golden || 0) + coinsNeeded,
        updated_at: new Date().toISOString()
      }));
    } else {
      await db.update('wallets', w => w.user_id === req.user.id, w => ({
        ...w,
        silver_coins: w.silver_coins - coinsNeeded,
        escrow_silver: (w.escrow_silver || 0) + coinsNeeded,
        updated_at: new Date().toISOString()
      }));
    }

    // Ledger record
    const updatedWallet = await db.findOne('wallets', w => w.user_id === req.user.id);
    await db.insert('transactions', {
      id: `tx-lock-${sessionId}`,
      user_id: req.user.id,
      type: 'escrow_lock',
      coin_type: coinType,
      amount: -coinsNeeded,
      balance_after: coinType === 'golden' ? updatedWallet.golden_coins : updatedWallet.silver_coins,
      reference_id: sessionId,
      description: `Escrow Locked: ${coinsNeeded} ${coinType.toUpperCase()} Coins for "${newSession.title}". 100% Auto-Refund Protected.`,
      status: 'held_in_escrow',
      created_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: isInstant ? 'Instant Micro-Session launched!' : 'Session scheduled successfully!',
      session: newSession,
      wallet: updatedWallet,
      classroomUrl: `/classroom/${sessionId}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/group-create - Teacher creates multi-student Group room
router.post('/group-create', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create group rooms' });
    }

    const { title, subject, scheduledAt, durationMinutes = 45, maxStudents = 10, targetTopic, learningGoals } = req.body;
    const sessionId = `group-room-${Date.now()}`;

    const newGroup = {
      id: sessionId,
      title: title || 'Live Group Masterclass',
      subject: subject || 'General',
      session_type: 'group',
      teacher_id: req.user.id,
      student_id: null,
      max_students: parseInt(maxStudents, 10) || 8,
      scheduled_at: scheduledAt || new Date(Date.now() + 3600000 * 2).toISOString(),
      duration_minutes: parseInt(durationMinutes, 10) || 45,
      coins_per_minute: 1,
      coin_type: 'silver',
      status: 'scheduled',
      targetTopic: targetTopic || 'Interactive group workshop',
      learningGoals: learningGoals || 'Hands-on practice & peer discussion',
      ai_integrity_score: 100,
      created_at: new Date().toISOString()
    };

    await db.insert('sessions', newGroup);
    return res.json({ success: true, session: newGroup, message: 'Group room scheduled!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
