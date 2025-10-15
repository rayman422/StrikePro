import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// In-memory demo storage (not for production)
const users = new Map(); // email -> { name, email }
const sessions = new Map(); // token -> email

function generateToken(email) {
  return Buffer.from(`${email}:${Date.now()}:${Math.random()}`).toString('base64url');
}

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
app.post('/api/auth/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
  const { name, email } = parsed.data;
  if (users.has(email)) return res.status(409).json({ error: 'User already exists' });
  users.set(email, { name, email });
  const token = generateToken(email);
  sessions.set(token, email);
  return res.status(201).json({ token, user: { name, email } });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
  const { email } = parsed.data;
  if (!users.has(email)) users.set(email, { name: email.split('@')[0], email });
  const token = generateToken(email);
  sessions.set(token, email);
  return res.json({ token, user: users.get(email) });
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

const bookings = [];

app.post('/api/booking', (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
  const booking = { id: bookings.length + 1, ...parsed.data, createdAt: new Date().toISOString() };
  bookings.push(booking);
  return res.status(201).json({ booking });
});

// Protected premium videos example
app.get('/api/videos/premium', (req, res) => {
  const auth = req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice('Bearer '.length);
  if (!sessions.has(token)) return res.status(401).json({ error: 'Invalid token' });
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
