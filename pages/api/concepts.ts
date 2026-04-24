import type { NextApiRequest, NextApiResponse } from 'next'
import {
  readConcepts,
  writeConcepts,
  regenerateGlossary,
  toSlug,
  type Concept,
} from '../../lib/concepts'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const concepts = readConcepts()
    return res.status(200).json(concepts)
  }

  if (req.method === 'POST') {
    const { name, definition, synonyms, related } = req.body as Partial<Concept>

    if (!name?.trim() || !definition?.trim()) {
      return res.status(400).json({ error: 'name and definition are required' })
    }

    const concepts = readConcepts()
    const slug = toSlug(name.trim())

    if (concepts.some(c => toSlug(c.name) === slug)) {
      return res.status(409).json({ error: `Concept "${name}" already exists` })
    }

    const concept: Concept = {
      name: name.trim(),
      definition: definition.trim(),
      synonyms: Array.isArray(synonyms) ? synonyms.filter(Boolean) : [],
      related: Array.isArray(related) ? related.filter(Boolean) : [],
    }

    concepts.push(concept)
    writeConcepts(concepts)
    regenerateGlossary(concepts)

    return res.status(201).json(concept)
  }

  if (req.method === 'DELETE') {
    const slug = req.query.slug as string

    if (!slug) {
      return res.status(400).json({ error: 'slug query param is required' })
    }

    const concepts = readConcepts()
    const idx = concepts.findIndex(c => toSlug(c.name) === slug)

    if (idx === -1) {
      return res.status(404).json({ error: `No concept found with slug "${slug}"` })
    }

    const [removed] = concepts.splice(idx, 1)
    writeConcepts(concepts)
    regenerateGlossary(concepts)

    return res.status(200).json(removed)
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
