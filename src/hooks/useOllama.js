import { useState } from 'react'

const OLLAMA_URL = 'http://localhost:11434'
const MODEL = 'gemma4:e2b'

// Normalise bonneReponse : seules "ia" et "humain" sont valides
function normalizeReponse(val, categorie) {
  if (val === 'ia') return 'ia'
  if (val === 'humain' || val === 'manuel') return 'humain'
  // Si le modèle met la catégorie comme réponse (danger/cyber/limite → humain, possibilite → ia)
  if (categorie === 'possibilite') return 'ia'
  return 'humain'
}

function buildPrompt({ companyName, sector, size, tools, context }, count = 3, questionsPerScenario = 3) {
  return `You are an expert in AI awareness training for employees. Generate exactly ${count} thematic scenarios in French for employees at "${companyName}", a ${size} company in the ${sector} sector using: ${tools}. Context: ${context || 'standard corporate environment'}.

Each scenario is a THEME with exactly ${questionsPerScenario} questions. IMPORTANT: mix different question types within each scenario.

Question types:
- "drag": employee must decide between delegating to AI ("ia") or keeping manual ("humain"). Short concrete situation (2-3 sentences).
- "mcq": multiple choice question with 4 options (A/B/C/D), exactly one is correct.
- "free": open-ended reflection question. No right/wrong answer — provide a model answer for self-assessment.

Scenario categories:
- "possibilite": AI automation (low risk tasks)
- "danger": data leaks, public AI tools misuse
- "limite": AI must not decide alone (HR, legal, medical, ethics)
- "cyber": phishing, deepfakes, AI fraud

Respond with a JSON object:
{
  "situations": [
    {
      "id": 1,
      "categorie": "<possibilite|danger|limite|cyber>",
      "titre": "Theme title (max 6 words in French)",
      "description": "1-2 sentences of context at ${companyName}.",
      "questions": [
        {
          "id": "1-1",
          "type": "drag",
          "texte": "Concrete situation at ${companyName} (2-3 sentences).",
          "bonneReponse": "ia",
          "explication": "2-3 sentences why this is correct."
        },
        {
          "id": "1-2",
          "type": "mcq",
          "texte": "A question about AI usage at ${companyName}?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "bonneReponse": "A",
          "explication": "2-3 sentences explaining the correct answer."
        },
        {
          "id": "1-3",
          "type": "free",
          "texte": "Open reflection question about a situation at ${companyName}?",
          "modelAnswer": "The ideal response is: 2-3 sentences.",
          "explication": "Key points to remember."
        }
      ]
    }
  ]
}

Rules:
- Each scenario has EXACTLY ${questionsPerScenario} questions
- Distribute types: at least 1 "drag", 1 "mcq", 1 "free" per scenario (adjust if questionsPerScenario < 3)
- For "drag": bonneReponse must be "ia" or "humain" only
- For "mcq": bonneReponse must be "A", "B", "C" or "D"
- For "free": no bonneReponse field, only modelAnswer
- All text in French, mention "${companyName}" naturally
- Return ONLY the JSON object, no extra text`
}

function extractSituations(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw

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

export function useOllama() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generateSituations(config, count = 3, questionsPerScenario = 3) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          prompt: buildPrompt(config, count, questionsPerScenario),
          stream: false,
          format: 'json',
        }),
      })

      if (!res.ok) {
        throw new Error(
          `Ollama inaccessible (HTTP ${res.status}). Vérifiez qu'Ollama tourne sur le port 11434 et que le modèle ${MODEL} est installé.`
        )
      }

      const data = await res.json()
      const situations = extractSituations(data.response)

      if (!situations || situations.length < 1) {
        throw new Error(`Aucun scénario reçu. Réessaie.`)
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

  return { generateSituations, loading, error }
}
