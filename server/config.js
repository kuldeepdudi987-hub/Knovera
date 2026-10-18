import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// Strict Secret Handling:
// 1. In production, JWT_SECRET must be supplied via environment variable.
// 2. In development, if not provided, generate an ephemeral cryptographically secure random key.
// 3. Never use hardcoded fallback strings in source code.
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.trim().length === 0) {
  console.warn('⚠️ [Knovera Config] JWT_SECRET not found in environment; generating secure ephemeral 256-bit key.');
  jwtSecret = crypto.randomBytes(32).toString('hex');
}

export const JWT_SECRET = jwtSecret;
export const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID || '9680877599@ybl';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const DATABASE_URL = process.env.DATABASE_URL || '';
