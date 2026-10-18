import { db } from './db.js';

export async function seedDatabase() {
  await db.init();

  const existingUsers = await db.find('users');
  if (existingUsers.length > 0) {
    console.log(`ℹ️ [Knovera Seed] Database already has ${existingUsers.length} users. Skipping full reseed.`);
    return;
  }

  console.log('🌱 [Knovera Seed] Seeding rich initial marketplace data...');

  const teachers = [
    {
      id: 'teacher-vikram',
      email: 'vikram.tech@knovera.dev',
      name: 'Dr. Vikram Malhotra',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      role: 'teacher',
      headline: 'Principal Systems Architect & Ex-Google Staff Engineer',
      bio: '14+ years building high-throughput distributed systems. Specialized in microservices, low-latency node engines, and rapid code debugging.',
      subjects: JSON.stringify(['Coding', 'System Design', 'Python', 'Node.js', 'React']),
      languages: JSON.stringify(['English', 'Hindi']),
      hourly_rate: 60,
      rating: 4.98,
      total_reviews: 142,
      is_online: true,
      demo_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'teacher-ananya',
      email: 'ananya.ai@knovera.dev',
      name: 'Ananya Deshmukh',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      role: 'teacher',
      headline: 'Applied GenAI Researcher & Stanford Alum',
      bio: 'Building production LLM agents, RAG architectures, and fine-tuning transformer models. Passionate about unblocking junior and senior engineers.',
      subjects: JSON.stringify(['Coding', 'AI & Data Science', 'PyTorch', 'LLMs', 'Python']),
      languages: JSON.stringify(['English', 'Marathi']),
      hourly_rate: 60,
      rating: 4.95,
      total_reviews: 98,
      is_online: true,
      demo_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'teacher-rajesh',
      email: 'rajesh.maths@knovera.dev',
      name: 'Prof. Rajesh Kulkarni',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      role: 'teacher',
      headline: 'IIT Bombay Chair Fellow | Advanced Mathematics & Calculus',
      bio: 'Simplifying multivariable calculus, linear algebra, and mathematical physics with intuitive geometric visualizations.',
      subjects: JSON.stringify(['Maths', 'Calculus', 'Linear Algebra', 'Exam Prep']),
      languages: JSON.stringify(['English', 'Hindi']),
      hourly_rate: 60,
      rating: 4.99,
      total_reviews: 324,
      is_online: true,
      demo_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'teacher-kavita',
      email: 'kavita.design@knovera.dev',
      name: 'Kavita Sen',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      role: 'teacher',
      headline: 'VP of Product Design | Ex-Swiggy & Razorpay',
      bio: 'Design systems champion, micro-interaction specialist, and Figma power user. Micro-reviews of portfolios, design critiques, and UX architecture.',
      subjects: JSON.stringify(['Design', 'UI/UX', 'Figma', 'Product Strategy']),
      languages: JSON.stringify(['English', 'Bengali']),
      hourly_rate: 60,
      rating: 4.96,
      total_reviews: 115,
      is_online: true,
      demo_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'teacher-elena',
      email: 'elena.languages@knovera.dev',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      role: 'teacher',
      headline: 'Polyglot Coach | Accent Reduction & Fluency in 30 Days',
      bio: 'Master of 5 languages. Conversational micro-drills to overcome speaking hesitation and master authentic native idioms.',
      subjects: JSON.stringify(['Languages', 'French', 'Spanish', 'Conversational English']),
      languages: JSON.stringify(['English', 'French', 'Spanish', 'Russian']),
      hourly_rate: 60,
      rating: 4.97,
      total_reviews: 182,
      is_online: true,
      demo_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'teacher-neha',
      email: 'neha.gmat@knovera.dev',
      name: 'Neha Gupta',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
      role: 'teacher',
      headline: 'GMAT 780 (Q51) & CAT 99.8%ile | Quantitative Aptitude Whisperer',
      bio: 'Specialized in 15-minute concept unblocking for Permutations, Number Systems, Data Interpretation, and high-stakes test strategies.',
      subjects: JSON.stringify(['Exam Prep', 'Maths', 'GMAT/CAT', 'Quantitative Aptitude']),
      languages: JSON.stringify(['English', 'Hindi']),
      hourly_rate: 60,
      rating: 4.99,
      total_reviews: 268,
      is_online: false,
      demo_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }
  ];

  for (const t of teachers) {
    await db.insert('users', t);
    // Teacher wallet
    await db.insert('wallets', {
      user_id: t.id,
      silver_coins: 0,
      golden_coins: 0,
      escrow_silver: 0,
      escrow_golden: 0,
      inr_earnings: 3450,
      withdrawable_inr: 2850,
      pending_escrow_inr: 600,
      total_minutes_taught: t.total_reviews * 30,
      updated_at: new Date().toISOString()
    });
  }

  // Demo Student User (Aarav Sharma)
  const studentUser = {
    id: 'user-student-demo',
    email: 'aarav.student@knovera.dev',
    name: 'Aarav Sharma',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    role: 'student',
    headline: 'Computer Science Undergrad & Full-Stack Learner',
    bio: 'Passionate learner brushing up on Distributed Systems, React internals, and Calculus.',
    subjects: JSON.stringify(['Coding', 'Maths']),
    languages: JSON.stringify(['English', 'Hindi']),
    hourly_rate: 0,
    rating: 5.0,
    total_reviews: 0,
    is_online: true
  };
  await db.insert('users', studentUser);

  // Student Wallet: Credited with 60 Free Silver Coins (Signup bonus) + 90 Golden Coins
  await db.insert('wallets', {
    user_id: studentUser.id,
    silver_coins: 60,
    golden_coins: 90,
    escrow_silver: 0,
    escrow_golden: 0,
    inr_earnings: 0,
    withdrawable_inr: 0,
    pending_escrow_inr: 0,
    total_minutes_taught: 0,
    updated_at: new Date().toISOString()
  });

  // Log Signup Bonus Transaction in Ledger
  await db.insert('transactions', {
    id: 'tx-signup-bonus-aarav',
    user_id: studentUser.id,
    type: 'signup_bonus',
    coin_type: 'silver',
    amount: 60,
    balance_after: 60,
    reference_id: 'WELCOME_BONUS_PROMO',
    description: 'Welcome to Knovera! 60 Free Silver Coins for Group Micro-Sessions credited.',
    status: 'completed',
    created_at: new Date().toISOString()
  });

  // Log Golden Coin purchase in Ledger
  await db.insert('transactions', {
    id: 'tx-gold-purchase-aarav',
    user_id: studentUser.id,
    type: 'purchase',
    coin_type: 'golden',
    amount: 90,
    balance_after: 90,
    reference_id: 'UPI-REF-KNV88291',
    description: 'Purchased Value Pack: 90 Golden Coins via Direct UPI (₹430)',
    status: 'completed',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  });

  // Demo Teacher User (Dr. Priya Nair)
  const teacherUser = {
    id: 'user-teacher-demo',
    email: 'priya.nair@knovera.dev',
    name: 'Dr. Priya Nair',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
    role: 'teacher',
    headline: 'Senior Cloud Architect & Certified AWS Mentor',
    bio: 'Ex-Amazon Tech Lead. Helping engineers crack AWS Solutions Architect exams, Kubernetes deployments, and cloud architecture reviews.',
    subjects: JSON.stringify(['Coding', 'Cloud Architecture', 'AWS', 'Docker', 'System Design']),
    languages: JSON.stringify(['English', 'Hindi', 'Malayalam']),
    hourly_rate: 60,
    rating: 4.97,
    total_reviews: 86,
    is_online: true,
    demo_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  };
  await db.insert('users', teacherUser);

  await db.insert('wallets', {
    user_id: teacherUser.id,
    silver_coins: 20,
    golden_coins: 0,
    escrow_silver: 0,
    escrow_golden: 0,
    inr_earnings: 4850,
    withdrawable_inr: 4200,
    pending_escrow_inr: 650,
    total_minutes_taught: 1240,
    updated_at: new Date().toISOString()
  });

  // Sample Past Payout for Dr. Priya Nair
  await db.insert('payouts', {
    id: 'payout-priya-01',
    teacher_id: teacherUser.id,
    upi_id: 'priya.nair@okhdfcbank',
    amount_inr: 2500,
    minutes_settled: 625,
    status: 'completed',
    transaction_ref: 'UPI/IMPS/5283918237/SUCCESS',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  });

  // Seed sample sessions
  const sampleSessions = [
    {
      id: 'session-demo-live-1',
      title: 'Live 1-on-1: Python AsyncIO & Event Loop Bottlenecks',
      subject: 'Coding',
      session_type: 'one_on_one',
      teacher_id: 'teacher-vikram',
      student_id: studentUser.id,
      max_students: 1,
      scheduled_at: new Date().toISOString(),
      duration_minutes: 30,
      coins_per_minute: 1,
      coin_type: 'golden',
      status: 'active',
      target_topic: 'Profiling asyncio tasks in Python 3.12 and fixing coroutine deadlocks',
      learning_goals: '1. Diagnose high latency in event loop\n2. Profile with cProfile\n3. Implement threadpool executor safely',
      ai_integrity_score: 98
    },
    {
      id: 'session-demo-group-2',
      title: 'Group Room: Master React 19 Server Actions & Transitions',
      subject: 'Coding',
      session_type: 'group',
      teacher_id: 'user-teacher-demo',
      student_id: null,
      max_students: 8,
      scheduled_at: new Date(Date.now() + 3600000 * 3).toISOString(),
      duration_minutes: 45,
      coins_per_minute: 1,
      coin_type: 'silver',
      status: 'scheduled',
      target_topic: 'Deep dive into useActionState, useOptimistic, and Server Functions',
      learning_goals: 'Full code-along session with interactive live whiteboard and sample repo',
      ai_integrity_score: 100
    },
    {
      id: 'session-demo-math-3',
      title: '1-on-1 Micro-Drill: Multivariable Chain Rule & Jacobians',
      subject: 'Maths',
      session_type: 'one_on_one',
      teacher_id: 'teacher-rajesh',
      student_id: null,
      max_students: 1,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 30,
      coins_per_minute: 1,
      coin_type: 'golden',
      status: 'scheduled',
      target_topic: 'Deriving Jacobian matrices for coordinate transformations in ML backprop',
      learning_goals: 'Intuitive visual proofs and 5 practice problems',
      ai_integrity_score: 100
    }
  ];

  for (const s of sampleSessions) {
    await db.insert('sessions', s);
  }

  // Sample Reviews
  await db.insert('reviews', {
    id: 'rev-1',
    session_id: 'session-demo-live-1',
    student_id: studentUser.id,
    teacher_id: 'teacher-vikram',
    rating: 5,
    comment: 'Solved my asyncio memory leak in literally 18 minutes. The 1 credit = 1 minute billing is a game changer!',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  });

  console.log('✅ [Knovera Seed] Database successfully seeded with teachers, demo accounts, and sessions.');
}
