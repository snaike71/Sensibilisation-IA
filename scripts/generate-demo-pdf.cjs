const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 50, size: 'A4' })
const outputPath = path.join(__dirname, '..', 'demo-company-context.pdf')
doc.pipe(fs.createWriteStream(outputPath))

const DARK = '#1a1a2e'
const BLUE = '#3b5bdb'
const GRAY = '#6c757d'
const LIGHT = '#f8f9fa'

// Header band
doc.rect(0, 0, 595, 80).fill(DARK)
doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
  .text('NEXAFLOW SAS', 50, 28)
doc.fontSize(10).fillColor('#aaaacc').font('Helvetica')
  .text('Guide interne — Usages numériques & Intelligence Artificielle', 50, 55)

// Subtitle
doc.moveDown(2)
doc.fontSize(14).fillColor(BLUE).font('Helvetica-Bold')
  .text('CHARTE D\'USAGE DES OUTILS IA ET NUMÉRIQUES', { align: 'center' })
doc.moveDown(0.3)
doc.fontSize(10).fillColor(GRAY).font('Helvetica')
  .text('Version 2.1 — Juin 2026 — Usage interne confidentiel', { align: 'center' })

// Separator
doc.moveDown(0.8)
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(BLUE).lineWidth(2).stroke()
doc.moveDown(1)

// Section: Présentation
doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text('1. Présentation de l\'entreprise')
doc.moveDown(0.4)
doc.fontSize(10).fillColor('#333333').font('Helvetica').text(
  'NEXAFLOW SAS est une société de conseil en transformation digitale fondée en 2015, basée à Lyon (siège social) avec des bureaux à Paris et Bordeaux. L\'entreprise accompagne les PME et ETI dans leur modernisation numérique et l\'adoption de solutions cloud.\n\n' +
  'Effectif : 340 collaborateurs répartis sur 3 sites.\n' +
  'Secteur : Conseil & Services Numériques (ESN).\n' +
  'Clients principaux : secteurs bancaire, santé, industrie manufacturière et collectivités territoriales.',
  { align: 'justify' }
)

doc.moveDown(1)

// Section: Outils utilisés
doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text('2. Outils numériques et IA déployés')
doc.moveDown(0.4)
const tools = [
  ['Microsoft 365', 'Suite complète : Teams, Outlook, SharePoint, OneDrive'],
  ['GitHub Copilot', 'Assistant IA pour les équipes de développement (depuis 2024)'],
  ['Microsoft Copilot', 'Assistant IA intégré dans Teams et Word pour les équipes projet'],
  ['Salesforce CRM', 'Gestion de la relation client, devis et suivi commercial'],
  ['Jira / Confluence', 'Gestion de projets agiles et documentation interne'],
  ['PowerBI', 'Tableaux de bord analytiques et reporting client'],
  ['ChatGPT Pro', 'Accès accordé aux managers et chefs de projet pour des usages rédactionnels'],
]
tools.forEach(([name, desc]) => {
  doc.fontSize(10).fillColor(BLUE).font('Helvetica-Bold').text(`• ${name}  `, { continued: true })
  doc.fillColor('#444444').font('Helvetica').text(desc)
})

doc.moveDown(1)

// Section: Règles d'usage IA
doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text('3. Règles d\'usage de l\'IA — Points d\'attention')
doc.moveDown(0.4)
doc.fontSize(10).fillColor('#333333').font('Helvetica').text(
  'L\'entreprise traite des données sensibles pour le compte de ses clients, notamment dans les secteurs de la santé (données de patients anonymisées) et de la banque (données financières). Les règles suivantes s\'appliquent à tous les collaborateurs :\n',
  { align: 'justify' }
)
const rules = [
  'Ne jamais saisir de données personnelles ou confidentielles client dans un outil IA public (ChatGPT, Gemini, etc.).',
  'Toute utilisation de GitHub Copilot doit exclure les fichiers contenant des informations client.',
  'Les résumés automatiques générés par Copilot dans Teams doivent être relus avant diffusion.',
  'Les emails générés par IA à destination de clients doivent obligatoirement être validés par un humain.',
  'Les décisions contractuelles, juridiques ou financières ne peuvent pas être déléguées à un outil IA.',
  'Tout collaborateur doit signaler au RSSI tout usage d\'IA non référencé dans la liste des outils approuvés.',
]
rules.forEach((r) => {
  doc.fontSize(10).fillColor('#333333').font('Helvetica').text(`  → ${r}`, { align: 'justify' })
  doc.moveDown(0.2)
})

doc.moveDown(0.5)

// Section: Contexte stratégique
doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold').text('4. Contexte stratégique et enjeux 2026')
doc.moveDown(0.4)
doc.fontSize(10).fillColor('#333333').font('Helvetica').text(
  'NEXAFLOW vient de lancer son plan de transformation "NexaAI 2026" visant à intégrer l\'IA dans 70% des projets clients d\'ici fin d\'année. Dans ce contexte, une montée en compétence de l\'ensemble des collaborateurs sur les bonnes pratiques IA est prioritaire.\n\n' +
  'Points de vigilance identifiés par le RSSI :\n' +
  '  - Risque de fuite de données via des outils IA non approuvés (shadow IT)\n' +
  '  - Confiance excessive envers les sorties IA sans vérification humaine\n' +
  '  - Manque de discernement sur les tâches pouvant ou non être déléguées à l\'IA\n' +
  '  - Enjeux RGPD liés à l\'usage de l\'IA dans le traitement de données clients',
  { align: 'justify' }
)

doc.moveDown(1)

// Footer
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').lineWidth(1).stroke()
doc.moveDown(0.5)
doc.fontSize(8).fillColor(GRAY).font('Helvetica')
  .text('NEXAFLOW SAS — Document confidentiel à usage interne uniquement — Ne pas diffuser hors de l\'entreprise', { align: 'center' })

doc.end()
console.log('PDF généré :', outputPath)
