import express from 'express'
import pg from 'pg'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cors from 'cors'

const app = express()
const { Pool } = pg


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
  ssl: { rejectUnauthorized: false },
})

pool.on('error', (err) => console.error('Pool error:', err.message))
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err))
const JWT_SECRET = process.env.JWT_SECRET || 'lhc-secret-2026'

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}))
app.options('*', cors())
app.use(express.json())

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token manquant' })
  try {
    req.org = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide' })
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// POST /api/auth/register — onboarding admin (crée une organisation)
app.post('/api/auth/register', async (req, res) => {
  const { nom, email, password, secteur, taille, outils_ia, maturite } = req.body
  if (!nom || !email || !password) return res.status(400).json({ error: 'Champs manquants' })
  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      `INSERT INTO organisations (nom, email_admin, password_hash, secteur, taille, outils_ia, maturite, statut_onboarding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'En cours') RETURNING id, nom, email_admin, secteur`,
      [nom, email.toLowerCase().trim(), hash, secteur, taille, outils_ia, maturite]
    )
    const org = rows[0]
    const token = jwt.sign({ id: org.id, nom: org.nom, email: org.email_admin }, JWT_SECRET)
    res.json({ org, token })
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Cet email est déjà utilisé.' })
    res.status(500).json({ error: 'Erreur serveur.' })
  }
})

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const { rows } = await pool.query(
      'SELECT * FROM organisations WHERE email_admin = $1',
      [email.toLowerCase().trim()]
    )
    const org = rows[0]
    if (!org || !(await bcrypt.compare(password, org.password_hash))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }
    const token = jwt.sign({ id: org.id, nom: org.nom, email: org.email_admin }, JWT_SECRET)
    res.json({ org: { id: org.id, nom: org.nom, secteur: org.secteur }, token })
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' })
  }
})

// ─── Cas d'usage ──────────────────────────────────────────────────────────────

// GET /api/usecases
app.get('/api/usecases', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM usecases WHERE org_id = $1 ORDER BY created_at DESC',
    [req.org.id]
  )
  res.json(rows)
})

// POST /api/usecases
app.post('/api/usecases', auth, async (req, res) => {
  const { intitule, description, equipe, outil_ia, frequence, risques, niveau_risque } = req.body
  const { rows } = await pool.query(
    `INSERT INTO usecases (org_id, intitule, description, equipe, outil_ia, frequence, risques, niveau_risque)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.org.id, intitule, description, equipe, outil_ia, frequence, risques, niveau_risque]
  )
  res.json(rows[0])
})

// ─── Modules ──────────────────────────────────────────────────────────────────

// GET /api/modules
app.get('/api/modules', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM modules WHERE org_id = $1 ORDER BY created_at DESC',
    [req.org.id]
  )
  res.json(rows)
})

// POST /api/modules
app.post('/api/modules', auth, async (req, res) => {
  const { titre, description, categorie, niveau, duree_min, equipes_ciblees, contenu, personnalise } = req.body
  const code = `MODULE_${Date.now().toString().slice(-4)}`
  const { rows } = await pool.query(
    `INSERT INTO modules (org_id, titre, code, description, categorie, niveau, duree_min, equipes_ciblees, contenu, personnalise)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.org.id, titre, code, description, categorie ?? 'Fondamentaux', niveau ?? 'intermediate',
     duree_min ?? 12, equipes_ciblees, contenu, personnalise ?? false]
  )
  res.json(rows[0])
})

// ─── Équipes ──────────────────────────────────────────────────────────────────

// GET /api/teams
app.get('/api/teams', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM teams WHERE org_id = $1 ORDER BY created_at DESC',
    [req.org.id]
  )
  res.json(rows)
})

// POST /api/teams
app.post('/api/teams', auth, async (req, res) => {
  const { nom, description } = req.body
  const prefix = nom.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'TEAM'
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const code_acces = `${prefix}-${suffix}`
  const { rows } = await pool.query(
    `INSERT INTO teams (org_id, nom, code_acces, description) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.org.id, nom, code_acces, description ?? '']
  )
  res.json(rows[0])
})

// ─── Collaborateurs ───────────────────────────────────────────────────────────

// POST /api/join — rejoindre une équipe via code d'accès
app.post('/api/join', async (req, res) => {
  const { code, nom, email, role } = req.body
  try {
    const { rows: teams } = await pool.query(
      'SELECT * FROM teams WHERE code_acces = $1',
      [code]
    )
    const team = teams[0]
    if (!team) return res.status(404).json({ error: 'Code invalide' })

    const { rows } = await pool.query(
      `INSERT INTO collaborators (org_id, team_id, nom, email, role)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [team.org_id, team.id, nom, email, role ?? '']
    )
    await pool.query(
      'UPDATE teams SET nb_collaborateurs = nb_collaborateurs + 1 WHERE id = $1',
      [team.id]
    )
    res.json({ collaborator: rows[0], team: team.nom })
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' })
  }
})

// ─── Sessions ─────────────────────────────────────────────────────────────────

// POST /api/sessions — sauvegarder un résultat de quiz
app.post('/api/sessions', async (req, res) => {
  const { collaborator_id, module_id, org_id, score, total_questions, xp_gagne, duree_min, concepts_maitrises } = req.body
  const { rows } = await pool.query(
    `INSERT INTO sessions (org_id, collaborator_id, module_id, score, total_questions, xp_gagne, duree_min, concepts_maitrises)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [org_id, collaborator_id, module_id, score, total_questions, xp_gagne, duree_min, concepts_maitrises]
  )
  await pool.query(
    'UPDATE collaborators SET xp = xp + $1 WHERE id = $2',
    [xp_gagne ?? 0, collaborator_id]
  )
  res.json(rows[0])
})

// GET /api/sessions — résultats de l'org (admin)
app.get('/api/sessions', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, c.nom as collaborateur_nom, m.titre as module_titre
     FROM sessions s
     LEFT JOIN collaborators c ON s.collaborator_id = c.id
     LEFT JOIN modules m ON s.module_id = m.id
     WHERE s.org_id = $1
     ORDER BY s.date DESC`,
    [req.org.id]
  )
  res.json(rows)
})

// ─── Config quiz (couche de compatibilité) ────────────────────────────────────

// GET /api/config — charge la config de l'organisation depuis modules
app.get('/api/config', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT contenu FROM modules WHERE org_id = $1 AND code = 'QUIZ_CONFIG' LIMIT 1",
      [req.org.id]
    )
    if (!rows.length || !rows[0].contenu) return res.json(null)
    res.json(JSON.parse(rows[0].contenu))
  } catch {
    res.json(null)
  }
})

// PUT /api/config — sauvegarde/met à jour la config quiz dans modules
app.put('/api/config', auth, async (req, res) => {
  try {
    const config = req.body
    const { rows } = await pool.query(
      "SELECT id FROM modules WHERE org_id = $1 AND code = 'QUIZ_CONFIG'",
      [req.org.id]
    )
    if (rows.length) {
      await pool.query(
        "UPDATE modules SET contenu = $1 WHERE org_id = $2 AND code = 'QUIZ_CONFIG'",
        [JSON.stringify(config), req.org.id]
      )
    } else {
      await pool.query(
        `INSERT INTO modules (org_id, titre, code, contenu, personnalise)
         VALUES ($1, 'Quiz Config', 'QUIZ_CONFIG', $2, true)`,
        [req.org.id, JSON.stringify(config)]
      )
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/results — compatibilité ancienne route → sessions
app.post('/api/results', auth, async (req, res) => {
  const { score, profil, reponses } = req.body
  const total = Array.isArray(reponses) ? reponses.length : 0
  const xp = Math.round((score / Math.max(total, 1)) * 100)
  try {
    const { rows } = await pool.query(
      `INSERT INTO sessions (org_id, score, total_questions, xp_gagne, concepts_maitrises)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.org.id, score, total, xp, profil ?? '']
    )
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Documents (RAG) ──────────────────────────────────────────────────────────

// POST /api/documents — stocker un chunk avec son embedding (appelé par Dev 1)
app.post('/api/documents', auth, async (req, res) => {
  const { filename, chunk, embedding } = req.body
  const { rows } = await pool.query(
    `INSERT INTO documents (org_id, filename, chunk, embedding)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [req.org.id, filename, chunk, JSON.stringify(embedding)]
  )
  res.json(rows[0])
})

// GET /api/documents/search — recherche vectorielle (appelée par Dev 1)
app.get('/api/documents/search', auth, async (req, res) => {
  const { embedding, limit = 5 } = req.body
  const { rows } = await pool.query(
    `SELECT chunk FROM documents
     WHERE org_id = $1
     ORDER BY embedding <=> $2
     LIMIT $3`,
    [req.org.id, JSON.stringify(embedding), limit]
  )
  res.json(rows.map(r => r.chunk))
})

app.listen(3001, () => console.log('Backend LHCtrl running on port 3001'))
