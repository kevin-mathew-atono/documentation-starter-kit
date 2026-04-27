#!/usr/bin/env node
/**
 * CLI concept manager — wraps the same logic used by the web UI (/manage).
 *
 * Usage:
 *   node scripts/manage-concepts.mjs generate          Regenerate all MDX files from data/concepts.json
 *   node scripts/manage-concepts.mjs list              List all concepts and their slugs
 *   node scripts/manage-concepts.mjs add               Interactively add a new concept
 *   node scripts/manage-concepts.mjs delete <slug>     Delete a concept by slug
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_FILE = path.join(ROOT, 'data', 'concepts.json')
const GLOSSARY_DIR = path.join(ROOT, 'pages', 'glossary')

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function readConcepts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

function writeConcepts(concepts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(concepts, null, 2) + '\n')
}

function escapeForMdx(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildMdx(concept, allConcepts) {
  const slugMap = Object.fromEntries(allConcepts.map(c => [c.name, toSlug(c.name)]))
  let content = `# ${concept.name}\n\n`
  content += `${escapeForMdx(concept.definition)}\n`
  if (concept.synonyms?.length > 0) {
    content += `\n## Also Known As\n\n`
    content += concept.synonyms.map(s => `- ${s}`).join('\n') + '\n'
  }
  if (concept.related?.length > 0) {
    content += `\n## Related Concepts\n\n`
    content += concept.related
      .map(name => {
        const slug = slugMap[name]
        return slug ? `- [${name}](/glossary/${slug})` : `- ${name}`
      })
      .join('\n') + '\n'
  }
  return content
}

function buildIndexMdx(concepts) {
  const sorted = [...concepts].sort((a, b) => a.name.localeCompare(b.name))
  const byLetter = {}
  for (const concept of sorted) {
    const letter = concept.name[0].toUpperCase()
    if (!byLetter[letter]) byLetter[letter] = []
    byLetter[letter].push(concept)
  }

  let content = `# Glossary\n\nA complete reference for every concept and feature in Atono — ${concepts.length} entries.\n\n`
  for (const letter of Object.keys(byLetter).sort()) {
    content += `## ${letter}\n\n`
    for (const concept of byLetter[letter]) {
      const summary = escapeForMdx(concept.definition.split('.')[0])
      content += `- [${concept.name}](/glossary/${toSlug(concept.name)}) — ${summary}.\n`
    }
    content += '\n'
  }
  return content
}

function generate() {
  const concepts = readConcepts()
  if (!fs.existsSync(GLOSSARY_DIR)) fs.mkdirSync(GLOSSARY_DIR, { recursive: true })

  const currentSlugs = new Set(concepts.map(c => toSlug(c.name)))
  currentSlugs.add('index')
  for (const file of fs.readdirSync(GLOSSARY_DIR)) {
    if (!file.endsWith('.mdx')) continue
    const slug = file.replace('.mdx', '')
    if (!currentSlugs.has(slug)) {
      fs.unlinkSync(path.join(GLOSSARY_DIR, `${slug}.mdx`))
      console.log(`Removed: ${slug}.mdx`)
    }
  }

  for (const concept of concepts) {
    fs.writeFileSync(path.join(GLOSSARY_DIR, `${toSlug(concept.name)}.mdx`), buildMdx(concept, concepts))
  }

  // Index page at /glossary
  fs.writeFileSync(path.join(GLOSSARY_DIR, 'index.mdx'), buildIndexMdx(concepts))

  const sorted = [...concepts].sort((a, b) => a.name.localeCompare(b.name))
  const meta = { index: 'Overview', ...Object.fromEntries(sorted.map(c => [toSlug(c.name), c.name])) }
  fs.writeFileSync(path.join(GLOSSARY_DIR, '_meta.json'), JSON.stringify(meta, null, 2) + '\n')

  console.log(`Generated ${concepts.length} concept pages, index, and _meta.json`)
}

function list() {
  const concepts = readConcepts()
  const sorted = [...concepts].sort((a, b) => a.name.localeCompare(b.name))
  console.log(`\n${sorted.length} concepts:\n`)
  for (const c of sorted) {
    console.log(`  ${toSlug(c.name).padEnd(40)} ${c.name}`)
  }
}

async function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function add() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log('\nAdd a new concept (Enter to skip optional fields)\n')
  const name = (await prompt(rl, 'Name: ')).trim()
  if (!name) { rl.close(); console.log('Aborted.'); return }
  const definition = (await prompt(rl, 'Definition: ')).trim()
  if (!definition) { rl.close(); console.log('Aborted.'); return }
  const synonymsRaw = (await prompt(rl, 'Synonyms (comma-separated, optional): ')).trim()
  const synonyms = synonymsRaw ? synonymsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
  const relatedRaw = (await prompt(rl, 'Related concepts (comma-separated, optional): ')).trim()
  const related = relatedRaw ? relatedRaw.split(',').map(s => s.trim()).filter(Boolean) : []
  rl.close()

  const concepts = readConcepts()
  const slug = toSlug(name)
  if (concepts.some(c => toSlug(c.name) === slug)) {
    console.log(`Error: concept "${name}" already exists (slug: ${slug})`)
    process.exit(1)
  }
  concepts.push({ name, definition, synonyms, related })
  writeConcepts(concepts)
  generate()
  console.log(`\nAdded "${name}" (slug: ${slug})`)
}

function deleteConcept(slug) {
  const concepts = readConcepts()
  const idx = concepts.findIndex(c => toSlug(c.name) === slug)
  if (idx === -1) {
    console.log(`Error: no concept with slug "${slug}"`)
    console.log('Run `node scripts/manage-concepts.mjs list` to see available slugs.')
    process.exit(1)
  }
  const name = concepts[idx].name
  concepts.splice(idx, 1)
  writeConcepts(concepts)
  generate()
  console.log(`Deleted "${name}" (slug: ${slug})`)
}

const [,, command, ...args] = process.argv

switch (command) {
  case 'generate': generate(); break
  case 'list':    list(); break
  case 'add':     await add(); break
  case 'delete':
    if (!args[0]) { console.log('Usage: node scripts/manage-concepts.mjs delete <slug>'); process.exit(1) }
    deleteConcept(args[0]); break
  default:
    console.log(`
Atono Glossary — Concept Manager (CLI)
The same operations are also available in the browser at /manage.

  generate          Regenerate all MDX pages from data/concepts.json
  list              List all concepts and their URL slugs
  add               Interactively add a new concept
  delete <slug>     Delete a concept by slug

Examples:
  node scripts/manage-concepts.mjs generate
  node scripts/manage-concepts.mjs list
  node scripts/manage-concepts.mjs add
  node scripts/manage-concepts.mjs delete acceptance-criteria
`)
}
