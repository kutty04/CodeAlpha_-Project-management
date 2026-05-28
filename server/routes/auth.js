import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from '../db.js';

const router = express.Router();
const JWT_SECRET = 'aether_secret_key_2026';

// Register User
router.post('/register', async (req, res) => {
  const { username, password, name, color, role } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, and name are required' });
  }

  try {
    // Check if user exists
    const existing = await get('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `u_${Date.now()}`;
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const userColor = color || '#8b5cf6'; // default primary violet
    const userRole = role || 'Fullstack Developer';

    await run(`
      INSERT INTO users (id, username, password, name, avatar, color, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, username.toLowerCase(), hashedPassword, name, avatar, userColor, userRole]);

    const token = jwt.sign({ id: userId, username: username.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: userId, username: username.toLowerCase(), name, avatar, color: userColor, role: userRole }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar, color: user.color, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to authenticate token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Get Current User Info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await get('SELECT id, username, name, avatar, color, role FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
