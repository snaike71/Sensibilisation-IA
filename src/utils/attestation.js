import { jsPDF } from 'jspdf'

export function downloadAttestation({ collaboratorNom, moduleTitre, score, total, pct, orgNom }) {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297, H = 210

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, W, H, 'F')

  doc.setDrawColor(5, 17, 243)
  doc.setLineWidth(1.2)
  doc.roundedRect(8, 8, W - 16, H - 16, 4, 4, 'S')

  doc.setDrawColor(196, 238, 242)
  doc.setLineWidth(0.4)
  doc.roundedRect(11, 11, W - 22, H - 22, 3, 3, 'S')

  doc.setTextColor(5, 17, 243)
  doc.setFontSize(90)
  doc.setFont('helvetica', 'bold')
  doc.setGState(doc.GState({ opacity: 0.04 }))
  doc.text('lhctrl.', W / 2, H / 2 + 14, { align: 'center', angle: 330 })
  doc.setGState(doc.GState({ opacity: 1 }))

  doc.setTextColor(5, 17, 243)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('lhctrl.', W / 2, 26, { align: 'center' })

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(155, 155, 150)
  doc.text('SENSIBILISATION À L\'INTELLIGENCE ARTIFICIELLE', W / 2, 33, { align: 'center', charSpace: 1.5 })

  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(13, 13, 13)
  doc.text('Attestation de réussite', W / 2, 52, { align: 'center' })

  doc.setDrawColor(5, 17, 243)
  doc.setLineWidth(0.5)
  doc.line(W / 2 - 40, 56, W / 2 + 40, 56)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(91, 91, 87)
  doc.text('Décernée à', W / 2, 68, { align: 'center' })

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 17, 243)
  doc.text(collaboratorNom, W / 2, 79, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(91, 91, 87)
  doc.text('pour avoir complété avec succès le module', W / 2, 91, { align: 'center' })

  doc.setFillColor(230, 231, 254)
  doc.roundedRect(W / 2 - 60, 95, 120, 16, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 17, 243)
  doc.text(moduleTitre, W / 2, 105, { align: 'center', maxWidth: 110 })

  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(12, 138, 77)
  doc.text(`${pct}%`, W / 2 - 25, 130, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(155, 155, 150)
  doc.text('SCORE OBTENU', W / 2 - 25, 136, { align: 'center', charSpace: 0.8 })

  doc.setDrawColor(232, 232, 228)
  doc.setLineWidth(0.3)
  doc.line(W / 2, 122, W / 2, 138)

  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(12, 138, 77)
  doc.text(`${score}/${total}`, W / 2 + 25, 130, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(155, 155, 150)
  doc.text('BONNES RÉPONSES', W / 2 + 25, 136, { align: 'center', charSpace: 0.8 })

  doc.setDrawColor(232, 232, 228)
  doc.setLineWidth(0.3)
  doc.line(20, 156, W - 20, 156)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(155, 155, 150)
  doc.text(`Délivré le ${date}`, 22, 163)
  doc.text(orgNom || 'Organisation', W / 2, 163, { align: 'center' })
  doc.text('lhctrl. — Sensibilisation IA', W - 22, 163, { align: 'right' })

  const nomFichier = `Attestation_${collaboratorNom.replace(/\s+/g, '_')}_${moduleTitre.replace(/\s+/g, '_').slice(0, 20)}.pdf`
  doc.save(nomFichier)
}
