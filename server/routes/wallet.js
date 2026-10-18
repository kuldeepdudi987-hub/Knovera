import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET } from '../config.js';

const router = express.Router();

// Middleware to extract user from token
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

// GET /api/wallet/balances - live wallet status
router.get('/balances', authMiddleware, async (req, res) => {
  try {
    let wallet = await db.findOne('wallets', w => w.user_id === req.user.id);
    if (!wallet) {
      wallet = {
        user_id: req.user.id,
        silver_coins: 60,
        golden_coins: 0,
        escrow_silver: 0,
        escrow_golden: 0,
        inr_earnings: 0,
        withdrawable_inr: 0,
        pending_escrow_inr: 0,
        total_minutes_taught: 0,
        updated_at: new Date().toISOString()
      };
      await db.insert('wallets', wallet);
    }
    return res.json({ success: true, wallet });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/wallet/ledger - double-entry transaction history
router.get('/ledger', authMiddleware, async (req, res) => {
  try {
    const transactions = await db.find('transactions', t => t.user_id === req.user.id);
    // Sort descending by date
    transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json({ success: true, transactions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/wallet/escrow/lock - lock coins in escrow when session is started or booked
router.post('/escrow/lock', authMiddleware, async (req, res) => {
  try {
    const { sessionId, coinType = 'golden', amountMinutes = 30 } = req.body;
    const coinsNeeded = parseInt(amountMinutes, 10);
    
    const wallet = await db.findOne('wallets', w => w.user_id === req.user.id);
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    if (coinType === 'golden') {
      if (wallet.golden_coins < coinsNeeded) {
        return res.status(400).json({
          error: `Insufficient Golden Coins! You have ${wallet.golden_coins} Golden Coins, but ${coinsNeeded} are required for this ${amountMinutes}-min 1-on-1 session.`,
          required: coinsNeeded,
          available: wallet.golden_coins,
          coinType: 'golden'
        });
      }

      await db.update('wallets', w => w.user_id === req.user.id, w => ({
        ...w,
        golden_coins: w.golden_coins - coinsNeeded,
        escrow_golden: (w.escrow_golden || 0) + coinsNeeded,
        updated_at: new Date().toISOString()
      }));
    } else {
      if (wallet.silver_coins < coinsNeeded) {
        return res.status(400).json({
          error: `Insufficient Silver Coins! You have ${wallet.silver_coins} Silver Coins, but ${coinsNeeded} are required for this ${amountMinutes}-min Group session.`,
          required: coinsNeeded,
          available: wallet.silver_coins,
          coinType: 'silver'
        });
      }

      await db.update('wallets', w => w.user_id === req.user.id, w => ({
        ...w,
        silver_coins: w.silver_coins - coinsNeeded,
        escrow_silver: (w.escrow_silver || 0) + coinsNeeded,
        updated_at: new Date().toISOString()
      }));
    }

    const updatedWallet = await db.findOne('wallets', w => w.user_id === req.user.id);

    // Ledger record
    await db.insert('transactions', {
      id: `tx-escrow-lock-${Date.now()}`,
      user_id: req.user.id,
      type: 'escrow_lock',
      coin_type: coinType,
      amount: -coinsNeeded,
      balance_after: coinType === 'golden' ? updatedWallet.golden_coins : updatedWallet.silver_coins,
      reference_id: sessionId || `SESSION_${Date.now()}`,
      description: `Escrow Hold: Locked ${coinsNeeded} ${coinType.toUpperCase()} Coins for ${amountMinutes}-minute session. Protected by 100% Auto-Refund Guarantee.`,
      status: 'held_in_escrow',
      created_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Successfully locked ${coinsNeeded} ${coinType} coins in escrow protection.`,
      wallet: updatedWallet
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/wallet/escrow/refund - 100% Auto-Refund trigger
router.post('/escrow/refund', authMiddleware, async (req, res) => {
  try {
    const { sessionId, coinType = 'golden', amount, reason = 'AI Monitor Quality Check or Premature Disconnect' } = req.body;
    const coinsToRefund = parseInt(amount, 10);
    
    const wallet = await db.findOne('wallets', w => w.user_id === req.user.id);
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    if (coinType === 'golden') {
      const escrowHeld = Math.min(wallet.escrow_golden || 0, coinsToRefund);
      await db.update('wallets', w => w.user_id === req.user.id, w => ({
        ...w,
        golden_coins: w.golden_coins + escrowHeld,
        escrow_golden: Math.max(0, (w.escrow_golden || 0) - escrowHeld),
        updated_at: new Date().toISOString()
      }));
    } else {
      const escrowHeld = Math.min(wallet.escrow_silver || 0, coinsToRefund);
      await db.update('wallets', w => w.user_id === req.user.id, w => ({
        ...w,
        silver_coins: w.silver_coins + escrowHeld,
        escrow_silver: Math.max(0, (w.escrow_silver || 0) - escrowHeld),
        updated_at: new Date().toISOString()
      }));
    }

    const updatedWallet = await db.findOne('wallets', w => w.user_id === req.user.id);

    // Audit and Ledger entry
    await db.insert('transactions', {
      id: `tx-refund-${Date.now()}`,
      user_id: req.user.id,
      type: 'escrow_refund',
      coin_type: coinType,
      amount: coinsToRefund,
      balance_after: coinType === 'golden' ? updatedWallet.golden_coins : updatedWallet.silver_coins,
      reference_id: sessionId || 'AUTO_REFUND_GUARANTEE',
      description: `100% ESCROW AUTO-REFUND: Returned ${coinsToRefund} ${coinType.toUpperCase()} Coins to your wallet. Reason: ${reason}`,
      status: 'refunded',
      created_at: new Date().toISOString()
    });

    await db.insert('audit_logs', {
      id: `audit-${Date.now()}`,
      event_type: 'ESCROW_AUTO_REFUND_EXECUTED',
      session_id: sessionId,
      user_id: req.user.id,
      details: JSON.stringify({ amount: coinsToRefund, coinType, reason }),
      created_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `100% Auto-Refund executed! ${coinsToRefund} ${coinType} coins returned to your balance.`,
      wallet: updatedWallet
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
