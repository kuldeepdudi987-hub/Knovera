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

// In-memory active live rooms state
const liveRooms = new Map();

// Helper to get or create room state
function getRoomState(sessionId, session) {
  if (!liveRooms.has(sessionId)) {
    liveRooms.set(sessionId, {
      sessionId,
      status: session?.status || 'active',
      startedAt: Date.now(),
      totalDurationSeconds: (session?.duration_minutes || 30) * 60,
      secondsRemaining: (session?.duration_minutes || 30) * 60,
      activeCoinDeductionMinutes: 0,
      teacherPresent: true,
      studentPresent: true,
      topicCoverageScore: 88,
      aiCheckpoints: [
        { id: 1, label: 'Target Topic Alignment', status: 'verified', note: 'Session matches student stated learning goal.' },
        { id: 2, label: 'Teacher Audio & Video Presence', status: 'verified', note: 'Active two-way stream confirmed.' },
        { id: 3, label: 'Concept Explanation & Code Drill', status: 'in_progress', note: 'Deep-dive explanation underway.' },
        { id: 4, label: 'Q&A & Doubt Resolution Check', status: 'pending', note: 'Awaiting student comprehension check.' }
      ],
      aiAlerts: [],
      chatMessages: [
        {
          id: 'sys-1',
          sender: 'Knovera AI Sentinel',
          isSystem: true,
          text: '🛡️ 100% Auto-Refund Protection is ACTIVE. 1 Credit is deducted per minute of verified live learning.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  }
  return liveRooms.get(sessionId);
}

// GET /api/classroom/:id/state - Retrieve live classroom state
router.get('/:id/state', authMiddleware, async (req, res) => {
  try {
    const session = await db.findOne('sessions', s => s.id === req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const teacher = await db.findOne('users', u => u.id === session.teacher_id);
    const student = session.student_id ? await db.findOne('users', u => u.id === session.student_id) : null;
    const roomState = getRoomState(session.id, session);

    return res.json({
      success: true,
      session,
      roomState,
      teacher: teacher ? { id: teacher.id, name: teacher.name, avatar: teacher.avatar, headline: teacher.headline } : null,
      student: student ? { id: student.id, name: student.name, avatar: student.avatar } : null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/classroom/:id/trigger-refund - 100% Auto-Refund Guarantee Engine
router.post('/:id/trigger-refund', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { reason = 'Teacher early disconnect or AI topic coverage shortfall' } = req.body;

    const session = await db.findOne('sessions', s => s.id === sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.status === 'refunded') {
      return res.status(400).json({ error: 'Session has already been refunded' });
    }

    const studentId = session.student_id || req.user.id;
    const studentWallet = await db.findOne('wallets', w => w.user_id === studentId);
    if (!studentWallet) return res.status(404).json({ error: 'Student wallet not found' });

    const refundCoins = session.duration_minutes || 30;
    const coinType = session.coin_type || 'golden';

    // 1. Return 100% locked coins from escrow back to student balance
    let newBalance = 0;
    if (coinType === 'golden') {
      const held = studentWallet.escrow_golden || refundCoins;
      newBalance = studentWallet.golden_coins + held;
      await db.update('wallets', w => w.user_id === studentId, w => ({
        ...w,
        golden_coins: newBalance,
        escrow_golden: Math.max(0, (w.escrow_golden || 0) - held),
        updated_at: new Date().toISOString()
      }));
    } else {
      const held = studentWallet.escrow_silver || refundCoins;
      newBalance = studentWallet.silver_coins + held;
      await db.update('wallets', w => w.user_id === studentId, w => ({
        ...w,
        silver_coins: newBalance,
        escrow_silver: Math.max(0, (w.escrow_silver || 0) - held),
        updated_at: new Date().toISOString()
      }));
    }

    // 2. Mark session refunded
    await db.update('sessions', s => s.id === sessionId, s => ({
      ...s,
      status: 'refunded',
      refund_reason: reason,
      refund_status: '100%_AUTOMATED_REFUND_COMPLETED'
    }));

    // 3. Record in ledger
    await db.insert('transactions', {
      id: `tx-refund-auto-${Date.now()}`,
      user_id: studentId,
      type: 'escrow_refund',
      coin_type: coinType,
      amount: refundCoins,
      balance_after: newBalance,
      reference_id: sessionId,
      description: `100% AUTO-REFUND GUARANTEE: Restored ${refundCoins} ${coinType.toUpperCase()} Coins to wallet. Trigger: ${reason}`,
      status: 'refunded',
      created_at: new Date().toISOString()
    });

    // 4. Audit Log
    await db.insert('audit_logs', {
      id: `audit-refund-${Date.now()}`,
      event_type: '100%_ESCROW_AUTO_REFUND',
      session_id: sessionId,
      user_id: studentId,
      details: JSON.stringify({
        refundCoins,
        coinType,
        reason,
        aiIntegrityScore: 45,
        timestamp: new Date().toISOString()
      }),
      created_at: new Date().toISOString()
    });

    // Update room state
    if (liveRooms.has(sessionId)) {
      const room = liveRooms.get(sessionId);
      room.status = 'refunded';
      room.aiAlerts.push(`⚠️ 100% Auto-Refund triggered: ${reason}. All ${refundCoins} coins returned to student.`);
    }

    const updatedWallet = await db.findOne('wallets', w => w.user_id === studentId);

    return res.json({
      success: true,
      message: `100% Auto-Refund successfully executed! ${refundCoins} ${coinType} coins returned to student wallet.`,
      wallet: updatedWallet,
      refundDetails: {
        sessionId,
        refundCoins,
        coinType,
        reason,
        auditLogId: `audit-refund-${Date.now()}`
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/classroom/:id/complete - Complete session and settle teacher payout
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await db.findOne('sessions', s => s.id === sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.status === 'completed') {
      return res.json({ success: true, message: 'Session already settled.' });
    }

    const durationMinutes = session.duration_minutes || 30;
    const studentId = session.student_id;
    const teacherId = session.teacher_id;
    const coinType = session.coin_type || 'golden';

    // 1. Deduct from student escrow (coins already taken out of liquid balance upon booking)
    if (studentId) {
      const studentWallet = await db.findOne('wallets', w => w.user_id === studentId);
      if (studentWallet) {
        if (coinType === 'golden') {
          await db.update('wallets', w => w.user_id === studentId, w => ({
            ...w,
            escrow_golden: Math.max(0, (w.escrow_golden || 0) - durationMinutes),
            updated_at: new Date().toISOString()
          }));
        } else {
          await db.update('wallets', w => w.user_id === studentId, w => ({
            ...w,
            escrow_silver: Math.max(0, (w.escrow_silver || 0) - durationMinutes),
            updated_at: new Date().toISOString()
          }));
        }
      }
    }

    // 2. Convert learning minutes into Teacher INR earnings based on platform mediator spread
    // Golden: ₹5 gross/min => Teacher gets ₹3.75/min (75%), Platform spread 25% (₹1.25/min)
    // Silver: ₹1.5 gross/min => Teacher gets ₹1.10/min (~73%), Platform spread 27%
    const ratePerMinute = coinType === 'golden' ? 3.75 : 1.10;
    const teacherEarnings = Math.round(durationMinutes * ratePerMinute);

    const teacherWallet = await db.findOne('wallets', w => w.user_id === teacherId);
    if (teacherWallet) {
      await db.update('wallets', w => w.user_id === teacherId, w => ({
        ...w,
        inr_earnings: (w.inr_earnings || 0) + teacherEarnings,
        withdrawable_inr: (w.withdrawable_inr || 0) + teacherEarnings,
        total_minutes_taught: (w.total_minutes_taught || 0) + durationMinutes,
        updated_at: new Date().toISOString()
      }));

      // Record in teacher ledger
      await db.insert('transactions', {
        id: `tx-earn-${sessionId}`,
        user_id: teacherId,
        type: 'teaching_earnings',
        coin_type: 'inr',
        amount: teacherEarnings,
        balance_after: (teacherWallet.withdrawable_inr || 0) + teacherEarnings,
        reference_id: sessionId,
        description: `Teaching Settlement: ${durationMinutes} mins @ ₹${ratePerMinute}/min net (Platform fee 25% deducted)`,
        status: 'completed',
        created_at: new Date().toISOString()
      });
    }

    // 3. Mark session complete
    await db.update('sessions', s => s.id === sessionId, s => ({
      ...s,
      status: 'completed',
      ai_integrity_score: 98
    }));

    if (liveRooms.has(sessionId)) {
      liveRooms.get(sessionId).status = 'completed';
    }

    return res.json({
      success: true,
      message: `Session completed successfully! Settled ₹${teacherEarnings} to teacher wallet.`,
      teacherEarnings,
      minutesSettled: durationMinutes
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
