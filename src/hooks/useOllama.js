import { useState, useRef } from 'react'

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL?.replace(/\/$/, '') || 'http://localhost:11434'
const MODEL = 'gemma4:e2b'

// Si VITE_API_BASE est défini (mode Vercel+ngrok), on passe par le proxy backend
// pour éviter les problèmes CORS avec Ollama
const USE_PROXY = !!import.meta.env.VITE_API_BASE
import { apiUrl, API_HEADERS } from '../utils/api.js'

// En local, appels directs à Ollama sans header ngrok (Ollama local le refuse)
const OLLAMA_HEADERS = { 'Content-Type': 'application/json' }

// Normalise bonneReponse : seules "ia" et "humain" sont valides
function normalizeReponse(val, categorie) {
  if (val === 'ia') return 'ia'
  if (val === 'humain' || val === 'manuel') return 'humain'
  // Si le modèle met la catégorie comme réponse (danger/cyber/limite → humain, possibilite → ia)
  if (categorie === 'possibilite') return 'ia'
  return 'humain'
}

const CATEGORIES = ['danger', 'cyber', 'possibilite', 'limite']

function makeTypePlan(n) {
  // Cycle de types pour n questions (jusqu'à 10)
  const cycle = ['drag', 'mcq', 'free', 'drag', 'mcq', 'free', 'drag', 'mcq', 'free', 'mcq']
  return cycle.slice(0, n)
}

// Prompt pour UN SEUL thème (beaucoup plus fiable que tout générer d'un coup)
function buildSingleThemePrompt({ companyName, sector, size, tools, context, documentContext }, themeIndex, totalThemes, questionsPerScenario, usedCategories = []) {
  const docSection = documentContext
    ? `\n\nCONTEXTE DOCUMENTAIRE :\n---\n${documentContext.slice(0, 800)}\n---\n`
    : ''

  const availableCategories = CATEGORIES.filter(c => !usedCategories.includes(c))
  const categorie = availableCategories[themeIndex % availableCategories.length] || CATEGORIES[themeIndex % 4]

  const typePlan = makeTypePlan(questionsPerScenario)
  const typeList = typePlan.map((t, i) => `Q${i + 1}="${t}"`).join(', ')

  const exampleQuestions = typePlan.map((type, j) => {
    const qid = `1-${j + 1}`
    if (type === 'drag') return `{"id":"${qid}","type":"drag","texte":"Un collaborateur copie un contrat client dans ChatGPT pour en faire un résumé.","bonneReponse":"humain","explication":"Les données contractuelles sont confidentielles et ne doivent pas quitter le SI."}`
    if (type === 'mcq') return `{"id":"${qid}","type":"mcq","texte":"Question à choix multiple ?","options":["Option A","Option B","Option C","Option D"],"bonneReponse":"B","explication":"Explication courte."}`
    return `{"id":"${qid}","type":"free","texte":"Question ouverte ?","modelAnswer":"Réponse idéale en 2-3 phrases.","explication":"Points clés."}`
  }).join(',\n    ')

  return `Tu es un expert en sensibilisation à l'IA en entreprise.${docSection}

Génère UN SEUL thème de sensibilisation à l'IA (thème ${themeIndex + 1}/${totalThemes}) pour l'entreprise "${companyName}" (${size}, secteur : ${sector}, outils : ${tools}).
Contexte : ${context || 'environnement corporate standard'}.
Catégorie obligatoire : "${categorie}".
Nombre de questions : exactement ${questionsPerScenario}, types dans cet ordre : ${typeList}.

Retourne UNIQUEMENT ce JSON (remplace le contenu par du vrai contenu lié à ${companyName}) :
{"id":1,"categorie":"${categorie}","titre":"Titre du thème","description":"Description du contexte en 1-2 phrases.","questions":[
    ${exampleQuestions}
]}

RÈGLES STRICTES :
- drag : "texte" = une SITUATION CONCRÈTE à classer (phrase descriptive, PAS une question), "bonneReponse" = "ia" ou "humain" uniquement, pas de champ "options"
- mcq : "options" = tableau de 4 chaînes, "bonneReponse" = "A", "B", "C" ou "D"
- free : "modelAnswer" = réponse idéale, PAS de champ "bonneReponse"
- Exactement ${questionsPerScenario} questions dans "questions"
- Tout en français, contenu concret lié à ${companyName} et au secteur ${sector}
- RETOURNER UNIQUEMENT LE JSON, rien d'autre`
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
  const abortRef = useRef(null)

  function abortGeneration() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  // usecaseConfigs : tableau de configs (une par cas d'usage) pour génération multi-UC
  // Si fourni, génère 1 thème par config ; sinon comportement normal (count thèmes depuis config)
  async function generateSituations(config, count = 3, questionsPerScenario = 3, onProgress, usecaseConfigs = null) {
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    const totalThemes = usecaseConfigs ? usecaseConfigs.length : count

    setLoading(true)
    setError(null)
    const results = []
    const usedCategories = []

    try {
      for (let i = 0; i < totalThemes; i++) {
        if (signal.aborted) break
        onProgress?.(i, totalThemes)
        const themeConfig = usecaseConfigs ? usecaseConfigs[i] : config
        const prompt = buildSingleThemePrompt(themeConfig, i, totalThemes, questionsPerScenario, usedCategories)
        const genUrl = USE_PROXY ? apiUrl('/api/proxy/generate') : `${OLLAMA_URL}/api/generate`
        const genHeaders = USE_PROXY ? { ...API_HEADERS } : OLLAMA_HEADERS

        let situation = null
        let lastError = null

        // Jusqu'à 2 tentatives par thème
        for (let attempt = 0; attempt < 2; attempt++) {
          if (signal.aborted) break
          try {
            const res = await fetch(genUrl, {
              method: 'POST',
              headers: genHeaders,
              body: JSON.stringify({ model: MODEL, prompt, stream: false, format: 'json' }),
              signal,
            })
            if (!res.ok) throw new Error(`Ollama inaccessible (HTTP ${res.status})`)
            const data = await res.json()
            const parsed = JSON.parse(repairJSON(data.response))

            // Extraire le thème (peut être un objet direct ou dans un tableau)
            const raw = Array.isArray(parsed) ? parsed[0] : (parsed.situations?.[0] ?? parsed)

            if (!raw?.titre || !Array.isArray(raw.questions)) throw new Error('Structure invalide')

            // Normaliser les questions
            situation = {
              ...raw,
              id: i + 1,
              questions: raw.questions.slice(0, questionsPerScenario).map((q, j) => ({
                ...q,
                id: `${i + 1}-${j + 1}`,
                type: q.type ?? 'drag',
                bonneReponse: q.type === 'free' ? undefined
                  : q.type === 'mcq' ? (q.bonneReponse ?? 'A')
                  : normalizeReponse(q.bonneReponse, raw.categorie),
              })),
            }
            usedCategories.push(raw.categorie)
            break
          } catch (e) {
            if (e.name === 'AbortError') throw e
            lastError = e
          }
        }

        if (!situation && !signal.aborted) throw new Error(`Thème ${i + 1} : génération échouée. ${lastError?.message ?? ''}`)
        if (situation) results.push(situation)
      }

      onProgress?.(totalThemes, totalThemes)
      return results.length > 0 ? results : null
    } catch (e) {
      if (e.name === 'AbortError') {
        return null
      }
      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        setError(`Impossible de contacter Ollama. Assurez-vous qu'Ollama est lancé et que le modèle ${MODEL} est disponible.`)
      } else {
        setError(e.message)
      }
      return results.length > 0 ? results : null
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  async function generateRisques({ intitule, outil_ia, niveau_risque, description }) {
    const prompt = `Tu es expert en risques IA en entreprise.
Pour ce cas d'usage : "${intitule}" utilisant ${outil_ia || 'un outil IA'} (niveau de risque : ${niveau_risque || 'Modéré'})${description ? `, contexte : ${description}` : ''}.
Liste entre 3 et 5 mots-clés de risques très courts (1-2 mots chacun, ex: RGPD, Biais, Désinformation, Confidentialité, Hallucination).
Réponds UNIQUEMENT avec les mots-clés séparés par des virgules, sans phrase, sans explication.`
    try {
      const result = await callOllama(prompt)
      const tags = result.split(',').map(t => t.trim().replace(/[.\n"']/g, '')).filter(Boolean).slice(0, 5)
      return tags.length > 0 ? tags : null
    } catch {
      return null
    }
  }

  async function generateRecommendation({ intitule, outil_ia, niveau_risque, description, equipe }) {
    const prompt = `Tu es expert en sensibilisation à l'IA en entreprise.
Génère une recommandation courte (2 phrases maximum) pour sensibiliser une équipe${equipe ? ` ${equipe}` : ''} qui utilise ${outil_ia || 'un outil IA'} pour "${intitule}".
Niveau de risque identifié : ${niveau_risque || 'Modéré'}.${description ? `\nContexte : ${description}` : ''}
Réponds UNIQUEMENT avec la recommandation en français, sans titre, sans bullet point, sans JSON.`
    try {
      const result = await callOllama(prompt)
      return result.trim().slice(0, 400) || null
    } catch {
      return null
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

  return { generateSituations, analyzeAnswer, generateRecommendation, generateRisques, abortGeneration, loading, error, analyzing }
}
