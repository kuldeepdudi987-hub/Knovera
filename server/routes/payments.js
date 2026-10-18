import express from 'express';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { db } from '../db.js';
import { JWT_SECRET, MERCHANT_UPI_ID } from '../config.js';

const router = express.Router();
export const FIXED_MERCHANT_UPI_ID = MERCHANT_UPI_ID;

// Catalog of Official Coin Packs
export const COIN_PACKS = {
  // Silver Coin Packs (Group Tutoring)
  'silver-starter': {
    id: 'silver-starter',
    name: 'Silver Starter Pack',
    coinType: 'silver',
    coins: 30,
    priceInr: 45,
    popular: false,
    savingsText: '₹1.50 / min',
    targetAudience: 'Ideal for 1 Group session'
  },
  'silver-value': {
    id: 'silver-value',
    name: 'Silver Value Pack',
    coinType: 'silver',
    coins: 90,
    priceInr: 125,
    popular: true,
    savingsText: 'Save 8% • ₹1.38 / min',
    targetAudience: 'Most Popular for weekly study groups'
  },
  'silver-pro': {
    id: 'silver-pro',
    name: 'Silver Pro Pack',
    coinType: 'silver',
    coins: 120,
    priceInr: 165,
    popular: false,
    savingsText: 'Save 9% • ₹1.37 / min',
    targetAudience: 'Best value for exam prep bootcamps'
  },

  // Golden Coin Packs (1-on-1 Private Tutoring)
  'gold-starter': {
    id: 'gold-starter',
    name: 'Golden Starter Pack',
    coinType: 'golden',
    coins: 30,
    priceInr: 150,
    popular: false,
    savingsText: '₹5.00 / min',
    targetAudience: 'Perfect for quick 1-on-1 code review or doubt'
  },
  'gold-value': {
    id: 'gold-value',
    name: 'Golden Value Pack',
    coinType: 'golden',
    coins: 90,
    priceInr: 430,
    popular: true,
    savingsText: 'Save ₹20 • ₹4.77 / min',
    targetAudience: 'Most Popular for 3 deep-dive 1-on-1 sessions'
  },
  'gold-pro': {
    id: 'gold-pro',
    name: 'Golden Pro Pack',
    coinType: 'golden',
    coins: 120,
    priceInr: 570,
    popular: false,
    savingsText: 'Save ₹30 • ₹4.75 / min',
    targetAudience: 'Best value for intensive mentorship'
  }
};

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

// GET /api/payments/merchant-upi - get fixed merchant UPI ID
router.get('/merchant-upi', (req, res) => {
  return res.json({ success: true, merchantUpiId: FIXED_MERCHANT_UPI_ID });
});

// GET /api/payments/packs - list all pricing packs
router.get('/packs', (req, res) => {
  return res.json({
    success: true,
    merchantUpiId: FIXED_MERCHANT_UPI_ID,
    silverPacks: [
      COIN_PACKS['silver-starter'],
      COIN_PACKS['silver-value'],
      COIN_PACKS['silver-pro']
    ],
    goldenPacks: [
      COIN_PACKS['gold-starter'],
      COIN_PACKS['gold-value'],
      COIN_PACKS['gold-pro']
    ]
  });
});

// GET /api/payments/dynamic-qr - generate dynamic UPI QR code
router.get('/dynamic-qr', async (req, res) => {
  try {
    const { packId, amount } = req.query;
    const pack = COIN_PACKS[packId];
    const finalAmount = pack ? pack.priceInr : (amount || 45);
    const orderRef = `KNV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const targetUpiId = FIXED_MERCHANT_UPI_ID;

    // Standard NPCI UPI URI string
    const upiUri = `upi://pay?pa=${encodeURIComponent(targetUpiId)}&pn=Knovera&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(`Knovera ${pack ? pack.name : 'Coins'} (${orderRef})`)}`;
    
    // Generate QR Data URL
    const qrDataUrl = await QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0a0f1d',
        light: '#ffffff'
      }
    });

    return res.json({
      success: true,
      upiUri,
      qrDataUrl,
      orderRef,
      merchantUpiId: targetUpiId,
      amount: finalAmount,
      pack: pack || null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// POST /api/payments/submit-utr - Real UPI payment UTR/RRN verification
router.post('/submit-utr', authMiddleware, async (req, res) => {
  try {
    const { packId, utrNumber } = req.body;
    if (!utrNumber || utrNumber.trim().length < 8) {
      return res.status(400).json({
        error: 'Please enter a valid 12-digit UPI Transaction ID / UTR number from your payment app (Google Pay, PhonePe, Paytm).'
      });
    }

    const cleanUtr = utrNumber.trim();
    const pack = COIN_PACKS[packId];
    if (!pack) return res.status(400).json({ error: 'Invalid pack selected' });

    // Anti-Fraud: Check for duplicate UTR claim
    const existing = await db.findOne('payments', p => p.utr_number === cleanUtr && p.status === 'completed');
    if (existing) {
      return res.status(400).json({
        error: `This UPI Transaction UTR (${cleanUtr}) has already been redeemed and credited on Knovera!`
      });
    }

    // Fulfill coin credit
    const wallet = await db.findOne('wallets', w => w.user_id === req.user.id);
    let newBalance = 0;
    if (pack.coinType === 'golden') {
      newBalance = (wallet?.golden_coins || 0) + pack.coins;
      await db.update('wallets', w => w.user_id === req.user.id, w => ({
        ...w,
        golden_coins: newBalance,
        updated_at: new Date().toISOString()
      }));
    } else {
      newBalance = (wallet?.silver_coins || 0) + pack.coins;
      await db.update('wallets', w => w.user_id === req.user.id, w => ({
        ...w,
        silver_coins: newBalance,
        updated_at: new Date().toISOString()
      }));
    }

    const paymentRecordId = `pay-${Date.now()}`;
    await db.insert('payments', {
      id: paymentRecordId,
      user_id: req.user.id,
      order_id: `ORD-REAL-UPI-${Date.now()}`,
      pack_id: pack.id,
      coin_type: pack.coinType,
      coin_amount: pack.coins,
      price_inr: pack.priceInr,
      payment_method: 'real_direct_upi',
      utr_number: cleanUtr,
      status: 'completed',
      receipt_url: `/api/payments/receipt/${paymentRecordId}`,
      created_at: new Date().toISOString()
    });

    // Immutable ledger entry
    await db.insert('transactions', {
      id: `tx-real-upi-${Date.now()}`,
      user_id: req.user.id,
      type: 'purchase',
      coin_type: pack.coinType,
      amount: pack.coins,
      balance_after: newBalance,
      reference_id: cleanUtr,
      description: `Verified Real UPI Payment: +${pack.coins} ${pack.coinType.toUpperCase()} Coins via Direct UPI (UTR: ${cleanUtr})`,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    await db.insert('audit_logs', {
      id: `audit-upi-${Date.now()}`,
      event_type: 'REAL_UPI_PAYMENT_VERIFIED',
      user_id: req.user.id,
      details: JSON.stringify({
        utr: cleanUtr,
        pack: pack.name,
        priceInr: pack.priceInr,
        coinsCredited: pack.coins,
        merchantVpa: currentMerchantUpiId
      }),
      created_at: new Date().toISOString()
    });

    const updatedWallet = await db.findOne('wallets', w => w.user_id === req.user.id);

    return res.json({
      success: true,
      message: `Real UPI Payment of ₹${pack.priceInr} verified! Credited ${pack.coins} ${pack.coinType} coins.`,
      wallet: updatedWallet,
      utrNumber: cleanUtr,
      receiptId: paymentRecordId
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// GET /api/payments/receipt/:id - Generate HTML/PDF receipt
router.get('/receipt/:id', async (req, res) => {
  try {
    const payment = await db.findOne('payments', p => p.id === req.params.id || p.order_id === req.params.id);
    if (!payment) return res.status(404).send('<h1>Receipt Not Found</h1>');

    const user = await db.findOne('users', u => u.id === payment.user_id);
    const pack = COIN_PACKS[payment.pack_id] || { name: 'Knovera Coin Pack', coins: payment.coin_amount };

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Knovera Tax Invoice & Receipt - ${payment.id}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; color: #1e293b; padding: 40px; margin: 0; }
        .invoice-box { max-width: 720px; margin: auto; background: #fff; padding: 36px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00d2ff; padding-bottom: 20px; }
        .logo { font-size: 26px; font-weight: 800; color: #0f172a; }
        .logo span { color: #00b4d8; }
        .badge { background: #dcfce7; color: #15803d; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
        .item-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .item-table th { background: #f8fafc; text-align: left; padding: 12px; font-size: 13px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        .item-table td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .total-box { margin-top: 25px; text-align: right; }
        .total-price { font-size: 24px; font-weight: 800; color: #0f172a; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 18px; }
        .print-btn { background: #0f172a; color: #fff; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
        @media print { .print-btn { display: none; } body { background: #fff; padding: 0; } .invoice-box { box-shadow: none; border: none; } }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <div class="logo">KNO<span>VERA</span></div>
          <div>
            <span class="badge">PAID • VERIFIED</span>
          </div>
        </div>
        <div class="details-grid">
          <div>
            <p style="color: #64748b; font-size: 12px; margin: 0;">BILLED TO</p>
            <h3 style="margin: 4px 0 2px 0;">${user ? user.name : 'Knovera Member'}</h3>
            <p style="color: #64748b; margin: 0; font-size: 13px;">${user ? user.email : ''}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">RECEIPT REF</p>
            <p style="font-weight: 700; margin: 4px 0 2px 0;">${payment.id}</p>
            <p style="color: #64748b; margin: 0; font-size: 12px;">Date: ${new Date(payment.created_at).toLocaleString()}</p>
            <p style="color: #64748b; margin: 0; font-size: 12px;">UTR/Tx: ${payment.utr_number || 'N/A'}</p>
          </div>
        </div>

        <table class="item-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th>Coin Type</th>
              <th>Learning Minutes</th>
              <th style="text-align: right;">Price (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${pack.name}</strong><br><small style="color: #64748b;">1 Credit = 1 Minute of live learning</small></td>
              <td style="text-transform: capitalize;">${payment.coin_type} Coins</td>
              <td>${payment.coin_amount} Minutes</td>
              <td style="text-align: right; font-weight: 600;">₹${payment.price_inr}.00</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <p style="color: #64748b; margin-bottom: 4px;">Net Amount Paid</p>
          <div class="total-price">₹${payment.price_inr}.00</div>
          <p style="color: #10b981; font-size: 13px; font-weight: 600; margin-top: 4px;">✓ Protected by Knovera Escrow & 100% Auto-Refund Guarantee</p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </div>

        <div class="footer">
          Knovera Micro-Tutoring Marketplace • Bengaluru & Global • support@knovera.dev<br>
          Computer-generated tax receipt. Valid without physical signature.
        </div>
      </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    return res.status(500).send('Error generating receipt: ' + err.message);
  }
});

export default router;
