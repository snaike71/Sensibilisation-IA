import { useState } from 'react'

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL?.replace(/\/$/, '') || 'http://localhost:11434'
const MODEL = 'gemma4:e2b'

// Si VITE_API_BASE est défini (mode Vercel+ngrok), on passe par le proxy backend
// pour éviter les problèmes CORS avec Ollama
const USE_PROXY = !!import.meta.env.VITE_API_BASE
import { apiUrl, API_HEADERS } from '../utils/api.js'

const OLLAMA_HEADERS = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }

// Normalise bonneReponse : seules "ia" et "humain" sont valides
function normalizeReponse(val, categorie) {
  if (val === 'ia') return 'ia'
  if (val === 'humain' || val === 'manuel') return 'humain'
  // Si le modèle met la catégorie comme réponse (danger/cyber/limite → humain, possibilite → ia)
  if (categorie === 'possibilite') return 'ia'
  return 'humain'
}

function buildPrompt({ companyName, sector, size, tools, context, documentContext }, count = 3, questionsPerScenario = 3) {
  const docSection = documentContext
    ? `\n\nCONTEXTE DOCUMENTAIRE :\n---\n${documentContext}\n---\n`
    : ''

  // Détermine le plan de types selon le nombre de questions demandées
  // ex: 3 questions → ["drag","mcq","free"], 2 → ["drag","mcq"], 4 → ["drag","mcq","free","drag"]
  function makeTypePlan(n) {
    const base = ['drag', 'mcq', 'free']
    const extras = ['drag', 'mcq', 'drag', 'mcq']
    return [...base, ...extras].slice(0, n)
  }

  const typePlan = makeTypePlan(questionsPerScenario)

  // Génère les questions exemple pour un thème donné
  function makeExampleQuestions(themeId) {
    return typePlan.map((type, j) => {
      const qid = `${themeId}-${j + 1}`
      if (type === 'drag') return `{"id":"${qid}","type":"drag","texte":"Situation concrète liée au thème ${themeId}.","bonneReponse":"ia","explication":"Explication."}`
      if (type === 'mcq') return `{"id":"${qid}","type":"mcq","texte":"Question QCM liée au thème ${themeId} ?","options":["Option A","Option B","Option C","Option D"],"bonneReponse":"B","explication":"Explication."}`
      return `{"id":"${qid}","type":"free","texte":"Question ouverte liée au thème ${themeId} ?","modelAnswer":"Réponse idéale en 2-3 phrases.","explication":"Points clés."}`
    }).join(',')
  }

  // Montre 2 thèmes dans l'exemple (peu importe count) pour que le modèle comprenne la répétition
  const exampleThemes = [1, 2].map((i) =>
    `{"id":${i},"categorie":"${i === 1 ? 'danger' : 'cyber'}","titre":"Titre thème ${i}","description":"Contexte thème ${i} chez ${companyName}.","questions":[${makeExampleQuestions(i)}]}`
  ).join(',\n  ')

  const typeList = typePlan.map((t, i) => `Q${i + 1}="${t}"`).join(', ')

  return `Tu es un expert en sensibilisation à l'IA en entreprise.${docSection}

Génère exactement ${count} thèmes pour "${companyName}" (${size}, secteur : ${sector}, outils : ${tools}).
Contexte : ${context || 'environnement corporate standard'}.
Chaque thème : exactement ${questionsPerScenario} questions, types dans cet ordre FIXE : ${typeList}.

JSON attendu (remplace par le vrai contenu, garde exactement ${count} thèmes) :

{"situations":[
  ${exampleThemes}
]}

RÈGLES :
- ${count} thèmes exactement, ${questionsPerScenario} questions par thème
- drag → "bonneReponse":"ia" ou "humain", pas d'options
- mcq → "options":[4 choix], "bonneReponse":"A"/"B"/"C"/"D"
- free → "modelAnswer":"réponse idéale", pas de bonneReponse
- Catégories : "possibilite","danger","limite","cyber" — varier
- Tout en français, contenu réel lié à ${companyName}
- RETOURNER UNIQUEMENT LE JSON`
}

function repairJSON(str) {
  if (typeof str !== 'string') return str
  let s = str.trim()
  // Extraire uniquement le bloc JSON (entre { } ou [ ])
  const start = s.search(/[{[]/)
  if (start > 0) s = s.slice(start)
  // Supprimer les virgules trailing avant } ou ]
  s = s.replace(/,\s*([}\]])/g, '$1')
  // Ajouter virgules manquantes entre } { ou ] [
  s = s.replace(/}\s*{/g, '},{')
  s = s.replace(/]\s*\[/g, '],[')
  // Fermer les structures ouvertes si le JSON est tronqué
  try {
    JSON.parse(s)
    return s
  } catch {
    // Compter les accolades/crochets ouverts
    let braces = 0, brackets = 0
    for (const c of s) {
      if (c === '{') braces++
      else if (c === '}') braces--
      else if (c === '[') brackets++
      else if (c === ']') brackets--
    }
    // Fermer les structures ouvertes
    while (brackets > 0) { s += ']'; brackets-- }
    while (braces > 0) { s += '}'; braces-- }
    return s
  }
}

function extractSituations(raw) {
  const repaired = repairJSON(typeof raw === 'string' ? raw : JSON.stringify(raw))
  let parsed
  try {
    parsed = JSON.parse(repaired)
  } catch {
    throw new Error('Format de réponse invalide. Réessaie — le modèle a généré un JSON malformé.')
  }

  // Cas 1 : tableau direct
  if (Array.isArray(parsed)) return parsed

  // Cas 2 : objet avec une clé connue contenant un tableau (nouvelle structure incluse)
  const candidates = ['situations', 'scenarios', 'themes', 'thèmes', 'data', 'results', 'items', 'liste', 'array', 'scenarii']
  for (const key of candidates) {
    if (Array.isArray(parsed[key])) return parsed[key]
  }

  // Cas 3 : n'importe quelle valeur tableau dans l'objet (prendre le plus grand)
  const arrays = Object.values(parsed).filter((v) => Array.isArray(v) && v.length > 0)
  if (arrays.length > 0) return arrays.sort((a, b) => b.length - a.length)[0]

  // Cas 4 : objet numéroté { "1": {...}, "2": {...} }
  const values = Object.values(parsed)
  if (values.length >= 2 && values.every((v) => typeof v === 'object' && v !== null && !Array.isArray(v))) {
    return values.map((v, i) => ({ id: i + 1, ...v }))
  }

  throw new Error('Format de réponse inattendu. Réessaie — le modèle génère parfois une structure différente.')
}

async function callOllama(prompt) {
  const url = USE_PROXY ? apiUrl('/api/proxy/generate') : `${OLLAMA_URL}/api/generate`
  const headers = USE_PROXY ? API_HEADERS : OLLAMA_HEADERS
  const body = USE_PROXY
    ? JSON.stringify({ model: MODEL, prompt, stream: false })
    : JSON.stringify({ model: MODEL, prompt, stream: false })
  const res = await fetch(url, { method: 'POST', headers, body })
  if (!res.ok) throw new Error(`Ollama inaccessible (HTTP ${res.status})`)
  const data = await res.json()
  return data.response ?? ''
}

export function useOllama() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  async function generateSituations(config, count = 3, questionsPerScenario = 3) {
    setLoading(true)
    setError(null)
    try {
      const genUrl = USE_PROXY ? apiUrl('/api/proxy/generate') : `${OLLAMA_URL}/api/generate`
      const genHeaders = USE_PROXY ? API_HEADERS : OLLAMA_HEADERS
      const res = await fetch(genUrl, {
        method: 'POST',
        headers: genHeaders,
        body: JSON.stringify({
          model: MODEL,
          prompt: buildPrompt(config, count, questionsPerScenario),
          stream: false,
          format: 'json',
        }),
      })

      if (!res.ok) {
        throw new Error(`Ollama inaccessible (HTTP ${res.status}). Vérifiez qu'Ollama tourne sur le port 11434 et que le modèle ${MODEL} est installé.`)
      }

      const data = await res.json()
      const situations = extractSituations(data.response)

      if (!situations || situations.length < 1) {
        throw new Error(`Aucun scénario reçu. Réessaie.`)
      }

      // Si les scénarios n'ont pas de questions (ancien format plat), les adapter
      if (!situations[0]?.questions) {
        return situations.map((s, i) => ({
          ...s,
          id: i + 1,
          questions: [{
            id: `${i + 1}-1`,
            type: 'drag',
            texte: s.texte ?? '',
            bonneReponse: normalizeReponse(s.bonneReponse, s.categorie),
            explication: s.explication ?? '',
          }],
        }))
      }

      // Normaliser les ids et bonneReponse (seules valeurs valides : "ia" | "humain")
      return situations.map((s, i) => ({
        ...s,
        id: i + 1,
        questions: (s.questions ?? []).map((q, j) => ({
          ...q,
          id: `${i + 1}-${j + 1}`,
          type: q.type ?? 'drag',
          bonneReponse: q.type === 'free' ? undefined
            : q.type === 'mcq' ? (q.bonneReponse ?? 'A')
            : normalizeReponse(q.bonneReponse, s.categorie),
        })),
      }))
    } catch (e) {
      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        setError(`Impossible de contacter Ollama. Assurez-vous qu'Ollama est lancé (ollama serve) et que le modèle ${MODEL} est disponible.`)
      } else {
        setError(e.message)
      }
      return null
    } finally {
      setLoading(false)
    }
  }

  async function analyzeAnswer(questionTexte, modelAnswer, userAnswer) {
    setAnalyzing(true)
    try {
      const prompt = `Tu es un expert en sensibilisation à l'IA en entreprise. Évalue la réponse d'un employé.

Question posée : "${questionTexte}"

Réponse de l'employé : "${userAnswer}"

Réponse de référence : "${modelAnswer}"

Donne une évaluation courte (3-4 phrases maximum) en français :
- Commence par un jugement global (ex: "Bonne intuition", "Réponse partielle", "Réflexe correct"...)
- Cite ce qui est juste dans la réponse de l'employé
- Indique ce qui manque ou pourrait être amélioré
- Termine par un conseil concret

Réponds UNIQUEMENT avec le texte de l'évaluation, sans JSON, sans bullet points, sans titre.`

      const result = await callOllama(prompt)
      return result.trim()
    } catch (e) {
      return null
    } finally {
      setAnalyzing(false)
    }
  }

  return { generateSituations, analyzeAnswer, loading, error, analyzing }
}
