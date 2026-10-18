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

// GET /api/tutors - Search and filter verified teachers
router.get('/', async (req, res) => {
  try {
    const { subject, skill, language, search, onlineOnly, minRating } = req.query;
    
    let tutors = await db.find('users', u => u.role === 'teacher');

    if (subject && subject !== 'All') {
      tutors = tutors.filter(t => {
        try {
          const subjects = JSON.parse(t.subjects || '[]');
          return subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()));
        } catch {
          return false;
        }
      });
    }

    if (skill) {
      tutors = tutors.filter(t => {
        try {
          const subjects = JSON.parse(t.subjects || '[]');
          return subjects.some(s => s.toLowerCase().includes(skill.toLowerCase()));
        } catch {
          return false;
        }
      });
    }

    if (language && language !== 'All') {
      tutors = tutors.filter(t => {
        try {
          const langs = JSON.parse(t.languages || '[]');
          return langs.some(l => l.toLowerCase() === language.toLowerCase());
        } catch {
          return false;
        }
      });
    }

    if (onlineOnly === 'true') {
      tutors = tutors.filter(t => t.is_online === true);
    }

    if (minRating) {
      const min = parseFloat(minRating);
      tutors = tutors.filter(t => (t.rating || 5.0) >= min);
    }

    if (search) {
      const q = search.toLowerCase();
      tutors = tutors.filter(t => 
        t.name.toLowerCase().includes(q) ||
        (t.headline && t.headline.toLowerCase().includes(q)) ||
        (t.bio && t.bio.toLowerCase().includes(q)) ||
        (t.subjects && t.subjects.toLowerCase().includes(q))
      );
    }

    // Attach review stats and parsed arrays
    const formatted = tutors.map(t => ({
      ...t,
      subjects: typeof t.subjects === 'string' ? JSON.parse(t.subjects || '[]') : t.subjects,
      languages: typeof t.languages === 'string' ? JSON.parse(t.languages || '[]') : t.languages,
    }));

    return res.json({ success: true, count: formatted.length, tutors: formatted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/tutors/:id - Get specific tutor profile & reviews
router.get('/:id', async (req, res) => {
  try {
    const tutor = await db.findOne('users', u => u.id === req.params.id);
    if (!tutor) return res.status(404).json({ error: 'Tutor not found' });

    const reviews = await db.find('reviews', r => r.teacher_id === tutor.id);
    const sessions = await db.find('sessions', s => s.teacher_id === tutor.id && s.status !== 'cancelled');

    return res.json({
      success: true,
      tutor: {
        ...tutor,
        subjects: typeof tutor.subjects === 'string' ? JSON.parse(tutor.subjects || '[]') : tutor.subjects,
        languages: typeof tutor.languages === 'string' ? JSON.parse(tutor.languages || '[]') : tutor.languages,
      },
      reviews,
      sessions
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/tutors/profile - Update teacher settings, subjects, availability
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { headline, bio, subjects, languages, is_online, demo_video_url } = req.body;

    await db.update('users', u => u.id === req.user.id, u => ({
      ...u,
      headline: headline !== undefined ? headline : u.headline,
      bio: bio !== undefined ? bio : u.bio,
      subjects: subjects !== undefined ? (Array.isArray(subjects) ? JSON.stringify(subjects) : subjects) : u.subjects,
      languages: languages !== undefined ? (Array.isArray(languages) ? JSON.stringify(languages) : languages) : u.languages,
      is_online: is_online !== undefined ? is_online : u.is_online,
      demo_video_url: demo_video_url !== undefined ? demo_video_url : u.demo_video_url,
    }));

    const updated = await db.findOne('users', u => u.id === req.user.id);
    return res.json({
      success: true,
      message: 'Teacher profile updated successfully!',
      user: {
        ...updated,
        subjects: typeof updated.subjects === 'string' ? JSON.parse(updated.subjects || '[]') : updated.subjects,
        languages: typeof updated.languages === 'string' ? JSON.parse(updated.languages || '[]') : updated.languages,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
