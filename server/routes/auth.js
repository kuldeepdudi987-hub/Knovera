import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, GOOGLE_CLIENT_ID } from '../config.js';

const router = express.Router();

// Helper to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Dev-Mode Quick Login Bypass (Instant 1-Click login as Student or Teacher)
router.post('/dev-login', async (req, res) => {
  try {
    const { role = 'student', customEmail, customName } = req.body;
    let targetUserId = role === 'teacher' ? 'user-teacher-demo' : 'user-student-demo';
    
    let user = await db.findOne('users', u => u.id === targetUserId);
    
    // If user requested a custom dev login
    if (customEmail) {
      user = await db.findOne('users', u => u.email.toLowerCase() === customEmail.toLowerCase());
      if (!user) {
        const id = `user-${Date.now()}`;
        user = {
          id,
          email: customEmail,
          name: customName || customEmail.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
          role: role,
          headline: `${role === 'teacher' ? 'Certified Mentor' : 'Active Learner'} on Knovera`,
          bio: 'Passionate member of the Knovera micro-learning community.',
          subjects: JSON.stringify(['Coding', 'General Skills']),
          languages: JSON.stringify(['English']),
          hourly_rate: role === 'teacher' ? 60 : 0,
          rating: 5.0,
          total_reviews: 0,
          is_online: true
        };
        await db.insert('users', user);

        // Credit 60 Free Silver Coins signup bonus
        await db.insert('wallets', {
          user_id: user.id,
          silver_coins: 60,
          golden_coins: 20,
          escrow_silver: 0,
          escrow_golden: 0,
          inr_earnings: 0,
          withdrawable_inr: 0,
          pending_escrow_inr: 0,
          total_minutes_taught: 0,
          updated_at: new Date().toISOString()
        });

        await db.insert('transactions', {
          id: `tx-bonus-${Date.now()}`,
          user_id: user.id,
          type: 'signup_bonus',
          coin_type: 'silver',
          amount: 60,
          balance_after: 60,
          reference_id: 'WELCOME_BONUS_PROMO',
          description: 'Welcome to Knovera! 60 Free Silver Coins credited on registration.',
          status: 'completed',
          created_at: new Date().toISOString()
        });
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found in demo seed.' });
    }

    const token = generateToken(user);
    const wallet = await db.findOne('wallets', w => w.user_id === user.id);

    return res.json({
      success: true,
      token,
      user,
      wallet,
      message: `Logged in successfully as ${user.name} (${user.role})`
    });
  } catch (err) {
    console.error('Dev login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/google-config - provide Google OAuth Client ID for frontend GSI button
router.get('/google-config', (req, res) => {
  return res.json({
    success: true,
    clientId: GOOGLE_CLIENT_ID
  });
});

// Google Sign-In Endpoint (OAuth 2.0 / Google Identity Services)
router.post('/google', async (req, res) => {
  try {
    const { credential, email, name, avatar, role = 'student' } = req.body;
    
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let isGoogleVerified = false;

    // Decode official Google Identity Services JWT credential
    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email) {
            userEmail = payload.email;
            userName = payload.name || userName;
            userAvatar = payload.picture || userAvatar;
            isGoogleVerified = Boolean(payload.email_verified);
          }
        }
      } catch (err) {
        console.warn('Could not decode Google JWT credential:', err.message);
      }
    }

    if (!userEmail || !userEmail.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid Google / Gmail address to link your Knovera account.' });
    }

    userEmail = userEmail.trim().toLowerCase();
    userName = userName || userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    userAvatar = userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`;

    let user = await db.findOne('users', u => u.email.toLowerCase() === userEmail);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const id = `user-g-${Date.now()}`;
      user = {
        id,
        email: userEmail,
        name: userName,
        avatar: userAvatar,
        role: role,
        headline: `${role === 'teacher' ? 'Verified Mentor' : 'Eager Learner'} on Knovera`,
        bio: 'Joined Knovera via Google Sign-In.',
        subjects: JSON.stringify(['Coding', 'Design', 'Languages']),
        languages: JSON.stringify(['English']),
        hourly_rate: role === 'teacher' ? 60 : 0,
        rating: 5.0,
        total_reviews: 0,
        is_online: true
      };
      await db.insert('users', user);

      // Automatically credit 60 Free Silver Coins to every new user's wallet upon registration
      await db.insert('wallets', {
        user_id: user.id,
        silver_coins: 60,
        golden_coins: 0,
        escrow_silver: 0,
        escrow_golden: 0,
        inr_earnings: 0,
        withdrawable_inr: 0,
        pending_escrow_inr: 0,
        total_minutes_taught: 0,
        updated_at: new Date().toISOString()
      });

      await db.insert('transactions', {
        id: `tx-bonus-g-${Date.now()}`,
        user_id: user.id,
        type: 'signup_bonus',
        coin_type: 'silver',
        amount: 60,
        balance_after: 60,
        reference_id: 'GMAIL_SIGNUP_BONUS_60',
        description: 'New Student Signup Bonus: 60 Free Silver Coins for Group Tutoring!',
        status: 'completed',
        created_at: new Date().toISOString()
      });
    }

    const token = generateToken(user);
    const wallet = await db.findOne('wallets', w => w.user_id === user.id);

    return res.json({
      success: true,
      token,
      user,
      wallet,
      isNewUser,
      bonusAwarded: isNewUser ? 60 : 0,
      message: `Successfully connected with Google ID: ${user.email}`
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Mobile OTP / Email login simulation
const activeOtps = new Map();

router.post('/send-otp', (req, res) => {
  const { phoneOrEmail } = req.body;
  if (!phoneOrEmail) return res.status(400).json({ error: 'Phone or Email required' });
  
  // Standard demo OTP: 123456
  const otp = '123456';
  activeOtps.set(phoneOrEmail, { otp, expires: Date.now() + 5 * 60 * 1000 });
  return res.json({ success: true, message: 'OTP sent! Use demo code: 123456', demoOtp: '123456' });
});

router.post('/verify-otp', async (req, res) => {
  const { phoneOrEmail, otp, role = 'student' } = req.body;
  const stored = activeOtps.get(phoneOrEmail);
  
  if (otp !== '123456' && (!stored || stored.otp !== otp)) {
    return res.status(400).json({ error: 'Invalid or expired OTP. Use demo OTP: 123456' });
  }

  let user = await db.findOne('users', u => u.email === phoneOrEmail);
  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    const id = `user-otp-${Date.now()}`;
    user = {
      id,
      email: phoneOrEmail,
      name: phoneOrEmail.includes('@') ? phoneOrEmail.split('@')[0] : `User ${phoneOrEmail.slice(-4)}`,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`,
      role: role,
      headline: 'Knovera Member',
      bio: 'Logged in via Mobile OTP / Email.',
      subjects: JSON.stringify(['General Skills']),
      languages: JSON.stringify(['English']),
      hourly_rate: 60,
      rating: 5.0,
      total_reviews: 0,
      is_online: true
    };
    await db.insert('users', user);

    await db.insert('wallets', {
      user_id: user.id,
      silver_coins: 60,
      golden_coins: 0,
      escrow_silver: 0,
      escrow_golden: 0,
      inr_earnings: 0,
      withdrawable_inr: 0,
      pending_escrow_inr: 0,
      total_minutes_taught: 0,
      updated_at: new Date().toISOString()
    });

    await db.insert('transactions', {
      id: `tx-otp-bonus-${Date.now()}`,
      user_id: user.id,
      type: 'signup_bonus',
      coin_type: 'silver',
      amount: 60,
      balance_after: 60,
      reference_id: 'OTP_SIGNUP_BONUS_60',
      description: 'Signup Promo: 60 Free Silver Coins credited.',
      status: 'completed',
      created_at: new Date().toISOString()
    });
  }

  const token = generateToken(user);
  const wallet = await db.findOne('wallets', w => w.user_id === user.id);
  return res.json({ success: true, token, user, wallet, isNewUser });
});

// Role Switcher Endpoint (Student <-> Teacher anytime)
router.post('/switch-role', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { newRole } = req.body;
    if (!['student', 'teacher'].includes(newRole)) {
      return res.status(400).json({ error: 'Role must be student or teacher' });
    }

    await db.update('users', u => u.id === decoded.id, u => ({
      ...u,
      role: newRole
    }));

    const updatedUser = await db.findOne('users', u => u.id === decoded.id);
    const newToken = generateToken(updatedUser);
    const wallet = await db.findOne('wallets', w => w.user_id === updatedUser.id);

    return res.json({
      success: true,
      user: updatedUser,
      token: newToken,
      wallet,
      message: `Role switched to ${newRole.toUpperCase()}!`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get Current User Profile & Live Wallet
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await db.findOne('users', u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const wallet = await db.findOne('wallets', w => w.user_id === user.id);
    return res.json({ success: true, user, wallet });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
