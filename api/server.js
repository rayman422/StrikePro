import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Persistent storage (lowdb)
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { users: [], bookings: [] });
await db.read();
db.data ||= { users: [], bookings: [] };

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
function signToken(email) { return jwt.sign({ sub: email }, JWT_SECRET, { expiresIn: '30d' }); }

// Health
app.get('/api/healthz', (req, res) => res.json({ ok: true }));

// Auth schemas
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
  const { name, email, password } = parsed.data;
  const existing = db.data.users.find(u => u.email === email);
  if (existing) return res.status(409).json({ error: 'User already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  db.data.users.push({ name, email, passwordHash, createdAt: new Date().toISOString() });
  await db.write();
  const token = signToken(email);
  return res.status(201).json({ token, user: { name, email } });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
  const { email, password } = parsed.data;
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(email);
  return res.json({ token, user: { name: user.name, email: user.email } });
});

// Booking
const bookingSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  preferredDate: z.string(),
  preferredTime: z.enum(['morning', 'afternoon', 'evening']),
  notes: z.string().optional(),
});

app.post('/api/booking', async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
  const booking = { id: (db.data.bookings.at(-1)?.id || 0) + 1, ...parsed.data, createdAt: new Date().toISOString() };
  db.data.bookings.push(booking);
  await db.write();
  return res.status(201).json({ booking });
});

// Protected premium videos example
app.get('/api/videos/premium', (req, res) => {
  const auth = req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice('Bearer '.length);
  try { jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'Invalid token' }); }
  return res.json({
    videos: [
      { id: 'adv-combos', title: 'Advanced Combinations', duration: '20:15' },
      { id: 'speed-power', title: 'Speed & Power Training', duration: '25:00' },
      { id: 'ring-strategy', title: 'Ring Strategy & Tactics', duration: '22:40' },
    ],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
