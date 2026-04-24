import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(process.cwd())
const DATA_FILE = path.join(ROOT, 'data', 'concepts.json')
const GLOSSARY_DIR = path.join(ROOT, 'pages', 'glossary')

export interface Concept {
  name: string
  definition: string
  synonyms: string[]
  related: string[]
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function readConcepts(): Concept[] {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

export function writeConcepts(concepts: Concept[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(concepts, null, 2) + '\n')
}

function escapeForMdx(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildMdx(concept: Concept, allConcepts: Concept[]): string {
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

export function regenerateGlossary(concepts: Concept[]): void {
  if (!fs.existsSync(GLOSSARY_DIR)) {
    fs.mkdirSync(GLOSSARY_DIR, { recursive: true })
  }

  // Remove stale MDX files
  const currentSlugs = new Set(concepts.map(c => toSlug(c.name)))
  for (const file of fs.readdirSync(GLOSSARY_DIR)) {
    if (!file.endsWith('.mdx')) continue
    const slug = file.replace('.mdx', '')
    if (!currentSlugs.has(slug)) {
      fs.unlinkSync(path.join(GLOSSARY_DIR, file))
    }
  }

  // Write MDX files
  for (const concept of concepts) {
    const slug = toSlug(concept.name)
    fs.writeFileSync(path.join(GLOSSARY_DIR, `${slug}.mdx`), buildMdx(concept, concepts))
  }

  // Write _meta.json (alphabetical)
  const sorted = [...concepts].sort((a, b) => a.name.localeCompare(b.name))
  const meta: Record<string, string> = {}
  for (const concept of sorted) {
    meta[toSlug(concept.name)] = concept.name
  }
  fs.writeFileSync(path.join(GLOSSARY_DIR, '_meta.json'), JSON.stringify(meta, null, 2) + '\n')
}
