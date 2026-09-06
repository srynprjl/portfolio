/**
 * Builds `public/resume.pdf` and `public/resume.docx` from
 * `app/data/data.json`, so the downloadable resume always matches
 * the site. Runs as part of `npm run build`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import PDFDocument from 'pdfkit'

const read = (name) =>
  JSON.parse(readFileSync(new URL(`../app/data/${name}.json`, import.meta.url), 'utf8'))
const profile = read('profile')
const skills = read('skills')
const experience = read('experience')
const education = read('education')
const projects = read('projects')
const socials = read('socials')
const socialUrl = (id) => {
  const found = socials.find(
    (s) => s.id === id && s.hide !== true && String(s.url).trim() !== '',
  )
  return found ? found.url : ''
}
const emailAddress = () => socialUrl('email').replace(/^mailto:/, '')
const resumeProjects = projects.filter((p) => p.hideFromResume !== true)
const fullName = `${profile.firstName} ${profile.lastName}`
const contactLine = [
  profile.location,
  emailAddress(),
  socialUrl('linkedin'),
  socialUrl('github'),
]
  .filter((part) => part.trim() !== '')
  .join('  |  ')

/* ---------------- PDF (pdfkit) ---------------- */

function buildPdf() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 55, right: 55 } })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const heading = (text) => {
      doc.moveDown(1.2)
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000').text(text.toUpperCase())
      doc.moveTo(doc.page.margins.left, doc.y + 4).lineTo(doc.page.width - doc.page.margins.right, doc.y + 4).strokeColor('#000000').lineWidth(1).stroke()
      doc.moveDown(0.7)
    }
    const body = (text) => {
      doc.font('Helvetica').fontSize(10).fillColor('#222222').text(text, { lineGap: 3 })
    }

    doc.font('Helvetica-Bold').fontSize(26).fillColor('#000000').text(fullName)
    doc.font('Helvetica').fontSize(11).fillColor('#333333').text(profile.title)
    doc.moveDown(0.4)
    doc.fontSize(9).fillColor('#555555').text(contactLine)

    heading('Summary')
    body(profile.bio)

    heading('Skills')
    body(`Languages: ${skills.languages.join(', ')}`)
    body(`Frameworks & Tools: ${skills.frameworks.join(', ')}`)
    body(`Applications: ${skills.tools.join(', ')}`)
    body(`Practices: ${skills.traits.join(', ')}`)

    if (experience.length > 0) {
      heading('Experience')
      for (const item of experience) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(`${item.role}, ${item.organization}`)
        doc.font('Helvetica').fontSize(9).fillColor('#555555').text(item.period)
        body(item.summary)
        doc.moveDown(0.4)
      }
    }

    heading('Education')
    for (const item of education) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(item.institution)
      doc.font('Helvetica').fontSize(9).fillColor('#555555').text(`${item.degree}, ${item.location}`)
      body(item.expected ? `Expected: ${item.expected}` : `Completed: ${item.completed}`)
      doc.moveDown(0.4)
    }

    heading('Projects')
    for (const project of resumeProjects) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(`${project.title} (${project.date})`)
      body(project.summary)
      doc.font('Helvetica').fontSize(9).fillColor('#555555').text(`Built with: ${project.chips.join(', ')}`)
      for (const source of project.sources.filter((s) => s.url.trim() !== '')) {
        doc.text(`${source.label}: ${source.url}`)
      }
      doc.moveDown(0.4)
    }

    doc.end()
  })
}

/* ---------------- DOCX (docx) ---------------- */

async function buildDocx() {
  const heading = (text) =>
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true })] })
  const body = (text) => new Paragraph({ children: [new TextRun({ text })] })

  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: fullName, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: profile.title })] }),
    new Paragraph({
      children: [
        new TextRun({
          text: contactLine,
          size: 18,
        }),
      ],
    }),
    heading('Summary'),
    body(profile.bio),
    heading('Skills'),
    body(`Languages: ${skills.languages.join(', ')}`),
    body(`Frameworks & Tools: ${skills.frameworks.join(', ')}`),
    body(`Applications: ${skills.tools.join(', ')}`),
    body(`Practices: ${skills.traits.join(', ')}`),
  ]

  if (experience.length > 0) {
    children.push(heading('Experience'))
    for (const item of experience) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `${item.role}, ${item.organization}`, bold: true })] }),
        body(`${item.period}${item.location ? `, ${item.location}` : ''}`),
        body(item.summary),
      )
    }
  }

  children.push(heading('Education'))
  for (const item of education) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: item.institution, bold: true })] }),
      body(`${item.degree}, ${item.location}`),
      body(item.expected ? `Expected: ${item.expected}` : `Completed: ${item.completed}`),
    )
  }

  children.push(heading('Projects'))
  for (const project of resumeProjects) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: `${project.title} (${project.date})`, bold: true })] }),
      body(project.summary),
      body(`Built with: ${project.chips.join(', ')}`),
    )
    for (const source of project.sources.filter((s) => s.url.trim() !== '')) {
      children.push(body(`${source.label}: ${source.url}`))
    }
  }

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBuffer(doc)
}

/* ---------------- run ---------------- */

const pdf = await buildPdf()
writeFileSync(new URL('../public/resume.pdf', import.meta.url), pdf)
const docx = await buildDocx()
writeFileSync(new URL('../public/resume.docx', import.meta.url), docx)
console.log('[resume] wrote public/resume.pdf + public/resume.docx')
