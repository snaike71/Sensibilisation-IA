import * as pdfjsLib from 'pdfjs-dist'

// Utiliser le worker depuis unpkg pour éviter les problèmes de chargement sous Nginx
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

/**
 * Extrait le texte brut complet d'un fichier PDF (File ou Blob).
 */
export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const parts = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    parts.push(content.items.map((it) => it.str).join(' '))
  }
  return parts.join('\n').replace(/\s+/g, ' ').trim()
}
