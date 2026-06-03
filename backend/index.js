import 'dotenv/config'
import express from 'express'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'

const app = express()
const { Pool } = pg


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
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

app.get('/health', (_, res) => res.json({ ok: true }))

// ─── Auth ─────────────────────────────────────────────────────────────────────

// POST /api/auth/register — onboarding admin (crée une organisation)
app.post('/api/auth/register', async (req, res) => {
  console.log('[register] body:', JSON.stringify(req.body), '| content-type:', req.headers['content-type'])
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
    console.error('[register] ERREUR:', e.message, e.code)
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

// PUT /api/organisations — mettre à jour le profil de l'organisation (onboarding)
app.put('/api/organisations', auth, async (req, res) => {
  const { secteur, taille, outils_ia, maturite, statut_onboarding } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE organisations
       SET secteur = COALESCE($1, secteur),
           taille  = COALESCE($2, taille),
           outils_ia = COALESCE($3, outils_ia),
           maturite = COALESCE($4, maturite),
           statut_onboarding = COALESCE($5, statut_onboarding)
       WHERE id = $6
       RETURNING id, nom, secteur, taille, outils_ia, maturite, statut_onboarding`,
      [secteur, taille, outils_ia, maturite, statut_onboarding, req.org.id]
    )
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
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

// PUT /api/usecases/:id — mettre à jour un cas d'usage (ex: assigner une équipe)
app.put('/api/usecases/:id', auth, async (req, res) => {
  const { id } = req.params
  const { intitule, equipe, outil_ia, niveau_risque, description, recommandation } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE usecases
       SET intitule = COALESCE($1, intitule),
           equipe = COALESCE($2, equipe),
           outil_ia = COALESCE($3, outil_ia),
           niveau_risque = COALESCE($4, niveau_risque),
           description = COALESCE($5, description),
           recommandation = COALESCE($6, recommandation)
       WHERE id = $7 AND org_id = $8 RETURNING *`,
      [intitule, equipe, outil_ia, niveau_risque, description, recommandation, id, req.org.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Cas d\'usage non trouvé' })
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/usecases/:id
app.delete('/api/usecases/:id', auth, async (req, res) => {
  const { id } = req.params
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM usecases WHERE id = $1 AND org_id = $2',
      [id, req.org.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Cas d\'usage non trouvé' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
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

// PUT /api/modules/:id — mettre à jour un module
app.put('/api/modules/:id', auth, async (req, res) => {
  const { id } = req.params
  const { equipes_ciblees, titre, description, contenu } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE modules
       SET equipes_ciblees = COALESCE($1, equipes_ciblees),
           titre = COALESCE($2, titre),
           description = COALESCE($3, description),
           contenu = COALESCE($4, contenu)
       WHERE id = $5 AND org_id = $6 RETURNING *`,
      [equipes_ciblees ?? null, titre ?? null, description ?? null, contenu ?? null, id, req.org.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Module non trouvé' })
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/modules/:id
app.delete('/api/modules/:id', auth, async (req, res) => {
  const { id } = req.params
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM modules WHERE id = $1 AND org_id = $2',
      [id, req.org.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Module non trouvé' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/modules/team/:team_id — modules assignés à une équipe (public, pour les collaborateurs)
app.get('/api/modules/team/:team_id', async (req, res) => {
  const { team_id } = req.params
  try {
    // Récupérer le nom de l'équipe à partir de son ID
    const teamRes = await pool.query('SELECT nom FROM teams WHERE id = $1 LIMIT 1', [team_id])
    const teamNom = teamRes.rows[0]?.nom
    if (!teamNom) return res.json([])

    const { rows } = await pool.query(
      `SELECT id, titre, code, description, categorie, niveau, duree_min, contenu, personnalise
       FROM modules
       WHERE (equipes_ciblees = $1 OR equipes_ciblees = $2) AND statut = 'active'
       ORDER BY created_at DESC`,
      [teamNom, team_id]
    )
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
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
  const prefix = (nom.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'TEAM').padEnd(4, '0')
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const suffix = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const code_acces = `${prefix}-${suffix}`
  const { rows } = await pool.query(
    `INSERT INTO teams (org_id, nom, code_acces, description) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.org.id, nom, code_acces, description ?? '']
  )
  res.json(rows[0])
})

// DELETE /api/teams/:id
app.delete('/api/teams/:id', auth, async (req, res) => {
  const { id } = req.params
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM collaborators WHERE team_id = $1', [id])
    const { rowCount } = await client.query(
      'DELETE FROM teams WHERE id = $1 AND org_id = $2',
      [id, req.org.id]
    )
    if (!rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Équipe non trouvée' }) }
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
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

// GET /api/collaborators/:id — récupérer les infos d'un collaborateur
app.get('/api/collaborators/:id', async (req, res) => {
  const { id } = req.params
  try {
    const { rows } = await pool.query(
      `SELECT c.*, t.nom as team_name
       FROM collaborators c
       LEFT JOIN teams t ON c.team_id = t.id
       WHERE c.id = $1`,
      [id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Collaborateur non trouvé' })
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/collaborators/:id/sessions — récupérer les sessions d'un collaborateur
app.get('/api/collaborators/:id/sessions', async (req, res) => {
  const { id } = req.params
  try {
    const { rows } = await pool.query(
      `SELECT s.*, m.titre as module_titre
       FROM sessions s
       LEFT JOIN modules m ON s.module_id = m.id
       WHERE s.collaborator_id = $1
       ORDER BY s.date DESC`,
      [id]
    )
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
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

// GET /api/config/org/:org_id — récupérer la config publique d'une organisation
app.get('/api/config/org/:org_id', async (req, res) => {
  const { org_id } = req.params
  try {
    const { rows } = await pool.query(
      "SELECT contenu FROM modules WHERE org_id = $1 AND code = 'QUIZ_CONFIG' LIMIT 1",
      [org_id]
    )
    if (!rows.length || !rows[0].contenu) return res.json(null)
    res.json(JSON.parse(rows[0].contenu))
  } catch (e) {
    res.status(500).json({ error: e.message })
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

// ─── Proxy Ollama (évite CORS navigateur → Ollama) ───────────────────────────

const OLLAMA_LOCAL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434'

// POST /api/proxy/generate — génération texte
app.post('/api/proxy/generate', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_LOCAL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify(req.body),
    })
    if (!r.ok) return res.status(r.status).json({ error: `Ollama HTTP ${r.status}` })
    const data = await r.json()
    res.json(data)
  } catch (e) {
    res.status(503).json({ error: 'Ollama inaccessible: ' + e.message })
  }
})

// POST /api/proxy/embed — embeddings (essaie /api/embed puis /api/embeddings)
app.post('/api/proxy/embed', async (req, res) => {
  const { model, text } = req.body
  const ngrokHeaders = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
  for (const endpoint of [`${OLLAMA_LOCAL}/api/embed`, `${OLLAMA_LOCAL}/api/embeddings`]) {
    try {
      const body = endpoint.endsWith('/embed')
        ? JSON.stringify({ model, input: text })
        : JSON.stringify({ model, prompt: text })
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: ngrokHeaders,
        body,
      })
      if (!r.ok) continue
      const data = await r.json()
      const vec = data.embeddings?.[0] ?? data.embedding
      if (vec) return res.json({ embedding: vec })
    } catch { continue }
  }
  res.status(503).json({ error: 'Ollama embedding échoué' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend LHCtrl running on port ${PORT}`))
