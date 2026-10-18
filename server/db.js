import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for local fallback
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const LOCAL_DB_FILE = path.join(DATA_DIR, 'knovera_local.json');

class DatabaseEngine {
  constructor() {
    this.isPostgres = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));
    this.pgPool = null;
    this.localState = {
      users: [],
      wallets: [],
      transactions: [],
      sessions: [],
      payments: [],
      payouts: [],
      reviews: [],
      audit_logs: []
    };
  }

  async init() {
    if (this.isPostgres) {
      console.log('🔗 [Knovera DB] Connecting to PostgreSQL via Render DATABASE_URL...');
      try {
        this.pgPool = new pg.Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
        });
        await this.createPostgresTables();
        console.log('✅ [Knovera DB] PostgreSQL tables verified & ready.');
        return;
      } catch (err) {
        console.warn('⚠️ [Knovera DB] PostgreSQL connection failed, falling back to local persistent storage. Reason:', err.code || 'Connection error');
        this.isPostgres = false;
      }
    }

    // Local persistent fallback
    console.log(`📁 [Knovera DB] Initializing Local Persistent Storage (${LOCAL_DB_FILE})...`);
    if (fs.existsSync(LOCAL_DB_FILE)) {
      try {
        const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
        this.localState = JSON.parse(raw);
      } catch (e) {
        console.warn('Could not read existing local DB file, starting clean.', e);
      }
    } else {
      this.saveLocal();
    }
    console.log('✅ [Knovera DB] Local database engine ready.');
  }

  saveLocal() {
    try {
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(this.localState, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist local DB state:', err);
    }
  }

  async createPostgresTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar TEXT,
        role VARCHAR(32) NOT NULL DEFAULT 'student',
        bio TEXT,
        headline TEXT,
        subjects TEXT,
        languages TEXT,
        hourly_rate INTEGER DEFAULT 60,
        rating NUMERIC DEFAULT 4.9,
        total_reviews INTEGER DEFAULT 0,
        is_online BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS wallets (
        user_id VARCHAR(64) PRIMARY KEY,
        silver_coins INTEGER DEFAULT 0,
        golden_coins INTEGER DEFAULT 0,
        escrow_silver INTEGER DEFAULT 0,
        escrow_golden INTEGER DEFAULT 0,
        inr_earnings NUMERIC DEFAULT 0,
        withdrawable_inr NUMERIC DEFAULT 0,
        pending_escrow_inr NUMERIC DEFAULT 0,
        total_minutes_taught INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        type VARCHAR(64) NOT NULL,
        coin_type VARCHAR(32) NOT NULL,
        amount NUMERIC NOT NULL,
        balance_after NUMERIC NOT NULL,
        reference_id VARCHAR(128),
        description TEXT,
        status VARCHAR(32) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(128) NOT NULL,
        session_type VARCHAR(32) NOT NULL,
        teacher_id VARCHAR(64) NOT NULL,
        student_id VARCHAR(64),
        max_students INTEGER DEFAULT 1,
        scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration_minutes INTEGER DEFAULT 30,
        coins_per_minute INTEGER DEFAULT 1,
        coin_type VARCHAR(32) NOT NULL,
        status VARCHAR(32) DEFAULT 'scheduled',
        target_topic TEXT,
        learning_goals TEXT,
        ai_integrity_score INTEGER DEFAULT 100,
        refund_reason TEXT,
        refund_status VARCHAR(32),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        order_id VARCHAR(128) NOT NULL,
        pack_id VARCHAR(64) NOT NULL,
        coin_type VARCHAR(32) NOT NULL,
        coin_amount INTEGER NOT NULL,
        price_inr NUMERIC NOT NULL,
        payment_method VARCHAR(64) NOT NULL,
        utr_number VARCHAR(128),
        status VARCHAR(32) DEFAULT 'completed',
        receipt_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS payouts (
        id VARCHAR(64) PRIMARY KEY,
        teacher_id VARCHAR(64) NOT NULL,
        upi_id VARCHAR(128) NOT NULL,
        amount_inr NUMERIC NOT NULL,
        minutes_settled INTEGER NOT NULL,
        status VARCHAR(32) DEFAULT 'completed',
        transaction_ref VARCHAR(128),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64),
        student_id VARCHAR(64) NOT NULL,
        teacher_id VARCHAR(64) NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        session_id VARCHAR(64),
        user_id VARCHAR(64),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    ];

    for (const q of queries) {
      await this.pgPool.query(q);
    }
  }

  // --- Collection Query Methods (Transparent local vs PostgreSQL) ---

  async find(collection, predicate = () => true) {
    if (this.isPostgres && this.pgPool) {
      // Postgres fallback to full select with memory predicate for simplicity across all schemas
      const res = await this.pgPool.query(`SELECT * FROM ${collection}`);
      return res.rows.filter(predicate);
    }
    return (this.localState[collection] || []).filter(predicate);
  }

  async findOne(collection, predicate) {
    const list = await this.find(collection, predicate);
    return list[0] || null;
  }

  async insert(collection, item) {
    if (this.isPostgres && this.pgPool) {
      const keys = Object.keys(item);
      const values = Object.values(item);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${collection} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${keys.map(k => `${k} = EXCLUDED.${k}`).join(', ')}`;
      await this.pgPool.query(query, values);
      return item;
    }

    if (!this.localState[collection]) {
      this.localState[collection] = [];
    }
    const idx = this.localState[collection].findIndex(x => (item.id && x.id === item.id) || (item.user_id && x.user_id === item.user_id));
    if (idx >= 0) {
      this.localState[collection][idx] = { ...this.localState[collection][idx], ...item };
    } else {
      this.localState[collection].push(item);
    }
    this.saveLocal();
    return item;
  }

  async update(collection, predicate, updateFn) {
    if (this.isPostgres && this.pgPool) {
      const items = await this.find(collection, predicate);
      for (const item of items) {
        const updated = updateFn({ ...item });
        await this.insert(collection, updated);
      }
      return;
    }

    if (!this.localState[collection]) return;
    let modified = false;
    for (let i = 0; i < this.localState[collection].length; i++) {
      if (predicate(this.localState[collection][i])) {
        this.localState[collection][i] = updateFn(this.localState[collection][i]);
        modified = true;
      }
    }
    if (modified) {
      this.saveLocal();
    }
  }

  async delete(collection, predicate) {
    if (this.isPostgres && this.pgPool) {
      const items = await this.find(collection, predicate);
      for (const item of items) {
        await this.pgPool.query(`DELETE FROM ${collection} WHERE id = $1`, [item.id || item.user_id]);
      }
      return;
    }

    if (!this.localState[collection]) return;
    this.localState[collection] = this.localState[collection].filter(x => !predicate(x));
    this.saveLocal();
  }
}

export const db = new DatabaseEngine();
