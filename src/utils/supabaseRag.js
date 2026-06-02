import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL?.replace(/\/$/, '') || 'http://localhost:11434'
const EMBED_MODEL = 'nomic-embed-text'
const OLLAMA_HEADERS = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }

// Supabase client — null si les clés ne sont pas configurées
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null

export function isSupabaseConfigured() {
  return !!supabase
}

/**
 * Découpe un texte en chunks avec chevauchement.
 * chunkSize et overlap sont en nombre de mots (approx).
 */
export function chunkText(text, chunkSize = 150, overlap = 30) {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks = []
  let start = 0
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end === words.length) break
    start += chunkSize - overlap
  }
  return chunks
}

/**
 * Obtient le vecteur d'embedding d'un texte via Ollama nomic-embed-text.
 */
export async function embedText(text) {
  // Essayer d'abord /api/embed (Ollama >= 0.1.26), puis /api/embeddings (anciennes versions)
  for (const endpoint of [`${OLLAMA_URL}/api/embed`, `${OLLAMA_URL}/api/embeddings`]) {
    const body = endpoint.endsWith('/embed')
      ? JSON.stringify({ model: EMBED_MODEL, input: text })
      : JSON.stringify({ model: EMBED_MODEL, prompt: text })
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: OLLAMA_HEADERS,
      body,
    })
    if (!res.ok) continue
    const data = await res.json()
    // /api/embed retourne { embeddings: [[...]] }, /api/embeddings retourne { embedding: [...] }
    const vec = data.embeddings?.[0] ?? data.embedding
    if (vec) return vec
  }
  throw new Error(`Embedding Ollama échoué. Vérifiez que le modèle ${EMBED_MODEL} est installé : ollama pull nomic-embed-text`)
}

/**
 * Indexe un document PDF (texte déjà extrait) dans Supabase.
 * Retourne le nombre de chunks indexés.
 * onProgress(current, total) est appelé à chaque chunk.
 */
export async function indexDocument(fullText, sourceName, onProgress) {
  if (!supabase) throw new Error('Supabase non configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans le fichier .env')

  // Supprimer les anciens chunks de cette source (table documents du schéma collègue)
  await supabase.from('documents').delete().eq('filename', sourceName)

  const chunks = chunkText(fullText)

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i + 1, chunks.length)
    const embedding = await embedText(chunks[i])
    const { error } = await supabase.from('documents').insert({
      filename: sourceName,
      chunk: chunks[i],
      embedding,
    })
    if (error) throw new Error(`Erreur Supabase lors de l'insertion du chunk ${i + 1} : ${error.message}`)
  }

  return chunks.length
}

/**
 * Recherche les chunks les plus pertinents pour un texte de requête.
 * Retourne une chaîne concaténée des top-k passages.
 */
export async function retrieveContext(queryText, k = 5) {
  if (!supabase) return null

  let embedding
  try {
    embedding = await embedText(queryText)
  } catch {
    return null
  }

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: k,
  })

  if (error || !data?.length) return null

  return data
    .filter((d) => d.similarity > 0.3)
    .map((d) => d.content)
    .join('\n\n')
}
