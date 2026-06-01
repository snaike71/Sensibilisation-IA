import express from 'express'
import pg from 'pg'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cors from 'cors'

const app = express()
const { Pool } = pg

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const JWT_SECRET = process.env.JWT_SECRET || 'lhc-secret-2026'

app.use(cors())
app.use(express.json())

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token manquant' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide' })
  }
}

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, name, password } = req.body
  if (!email || !name || !password) return res.status(400).json({ error: 'Champs manquants' })
  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, role',
      [email.toLowerCase().trim(), name.trim(), hash]
    )
    const user = rows[0]
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET)
    res.json({ user, token })
  } catch {
    res.status(400).json({ error: 'Cet email est déjà utilisé.' })
  }
})

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET)
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token })
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' })
  }
})

// POST /api/results — sauvegarder un résultat
app.post('/api/results', authMiddleware, async (req, res) => {
  const { score, profil, reponses } = req.body
  await pool.query(
    'INSERT INTO results (user_id, score, profil, reponses) VALUES ($1, $2, $3, $4)',
    [req.user.id, score, profil, JSON.stringify(reponses ?? {})]
  )
  res.json({ ok: true })
})

// GET /api/results — tous les résultats (admin)
app.get('/api/results', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })
  const { rows } = await pool.query(
    'SELECT r.id, r.score, r.profil, r.created_at, u.name, u.email FROM results r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC'
  )
  res.json(rows)
})

// GET /api/config — config entreprise active
app.get('/api/config', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM company_config ORDER BY updated_at DESC LIMIT 1')
  res.json(rows[0] ?? null)
})

// PUT /api/config — sauvegarder config (admin)
app.put('/api/config', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })
  const { company_name, sector, size, tools, context, situations } = req.body
  await pool.query('DELETE FROM company_config')
  await pool.query(
    'INSERT INTO company_config (company_name, sector, size, tools, context, situations) VALUES ($1,$2,$3,$4,$5,$6)',
    [company_name, sector, size, tools, context, JSON.stringify(situations)]
  )
  res.json({ ok: true })
})

app.listen(3001, () => console.log('Backend LHCtrl running on port 3001'))
