import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET } from '../config.js';

const router = express.Router();
const MIN_WITHDRAWAL_INR = 200;

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

// GET /api/payouts/stats - Teacher payout dashboard metrics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const teacherId = req.user.id;
    let wallet = await db.findOne('wallets', w => w.user_id === teacherId);
    if (!wallet) {
      wallet = {
        user_id: teacherId,
        silver_coins: 0,
        golden_coins: 0,
        escrow_silver: 0,
        escrow_golden: 0,
        inr_earnings: 0,
        withdrawable_inr: 0,
        pending_escrow_inr: 0,
        total_minutes_taught: 0
      };
    }

    const payoutHistory = await db.find('payouts', p => p.teacher_id === teacherId);
    payoutHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      stats: {
        totalMinutesTaught: wallet.total_minutes_taught || 0,
        inrEarnings: wallet.inr_earnings || 0,
        withdrawableInr: wallet.withdrawable_inr || 0,
        pendingEscrowInr: wallet.pending_escrow_inr || 0,
        minWithdrawalThreshold: MIN_WITHDRAWAL_INR,
        canWithdraw: (wallet.withdrawable_inr || 0) >= MIN_WITHDRAWAL_INR,
        platformSpread: {
          teacherShare: '75%',
          platformFee: '25%',
          grossMinuteValue: '₹5.00',
          teacherNetMinuteValue: '₹3.75'
        }
      },
      payoutHistory
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/payouts/request-upi - Instant UPI Withdrawal flow
router.post('/request-upi', authMiddleware, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { upiId, amountInr } = req.body;

    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid UPI VPA (e.g. yourname@okhdfcbank or 9876543210@paytm)' });
    }

    const amount = parseFloat(amountInr);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_INR) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_INR}. You requested ₹${amountInr || 0}.`
      });
    }

    const wallet = await db.findOne('wallets', w => w.user_id === teacherId);
    if (!wallet || (wallet.withdrawable_inr || 0) < amount) {
      return res.status(400).json({
        error: `Insufficient withdrawable balance! You have ₹${wallet?.withdrawable_inr || 0}, but requested ₹${amount}.`
      });
    }

    // Deduct withdrawable balance
    const newWithdrawable = (wallet.withdrawable_inr || 0) - amount;
    await db.update('wallets', w => w.user_id === teacherId, w => ({
      ...w,
      withdrawable_inr: newWithdrawable,
      updated_at: new Date().toISOString()
    }));

    // Record completed payout
    const payoutId = `payout-${Date.now()}`;
    const txRef = `UPI/IMPS/${Date.now().toString().slice(-8)}/${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayout = {
      id: payoutId,
      teacher_id: teacherId,
      upi_id: upiId,
      amount_inr: amount,
      minutes_settled: Math.round(amount / 3.75),
      status: 'completed',
      transaction_ref: txRef,
      created_at: new Date().toISOString()
    };
    await db.insert('payouts', newPayout);

    // Ledger record
    await db.insert('transactions', {
      id: `tx-payout-${Date.now()}`,
      user_id: teacherId,
      type: 'payout',
      coin_type: 'inr',
      amount: -amount,
      balance_after: newWithdrawable,
      reference_id: txRef,
      description: `Instant UPI Payout Disbursed: ₹${amount} to ${upiId} (Ref: ${txRef})`,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Instant UPI Payout of ₹${amount} disbursed to ${upiId}!`,
      payout: newPayout,
      newWithdrawable
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
