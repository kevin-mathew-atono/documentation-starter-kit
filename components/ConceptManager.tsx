import React, { useEffect, useState, useCallback } from 'react'

interface Concept {
  name: string
  definition: string
  synonyms: string[]
  related: string[]
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const EMPTY_FORM = { name: '', definition: '', synonyms: '', related: '' }

export default function ConceptManager() {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')

  const fetchConcepts = useCallback(async () => {
    const res = await fetch('/api/concepts')
    const data = await res.json()
    setConcepts(data.sort((a: Concept, b: Concept) => a.name.localeCompare(b.name)))
    setLoading(false)
  }, [])

  useEffect(() => { fetchConcepts() }, [fetchConcepts])

  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setError('') }
    else { setError(msg); setSuccess('') }
    setTimeout(() => { setSuccess(''); setError('') }, 4000)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.definition.trim()) {
      flash('Name and definition are required.', 'error')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/concepts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        definition: form.definition.trim(),
        synonyms: form.synonyms.split(',').map(s => s.trim()).filter(Boolean),
        related: form.related.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { flash(data.error, 'error'); return }
    setForm(EMPTY_FORM)
    await fetchConcepts()
    flash(`"${data.name}" added successfully.`, 'success')
  }

  const handleDelete = async (concept: Concept) => {
    if (!confirm(`Delete "${concept.name}"? This will remove its glossary page.`)) return
    const slug = toSlug(concept.name)
    setDeleting(slug)
    const res = await fetch(`/api/concepts?slug=${slug}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(null)
    if (!res.ok) { flash(data.error, 'error'); return }
    await fetchConcepts()
    flash(`"${data.name}" deleted.`, 'success')
  }

  const filtered = concepts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.definition.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Add concept form */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, marginBottom: 32, background: '#fafafa' }}>
        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>Add a concept</h2>
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={labelStyle}>
              Name <span style={{ color: '#ef4444' }}>*</span>
              <input
                style={inputStyle}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Story Refinement"
                disabled={submitting}
              />
            </label>
            <label style={labelStyle}>
              Definition <span style={{ color: '#ef4444' }}>*</span>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                value={form.definition}
                onChange={e => setForm(f => ({ ...f, definition: e.target.value }))}
                placeholder="Plain-English description of the concept."
                disabled={submitting}
              />
            </label>
            <label style={labelStyle}>
              Synonyms <span style={{ color: '#9ca3af', fontWeight: 400 }}>(comma-separated, optional)</span>
              <input
                style={inputStyle}
                value={form.synonyms}
                onChange={e => setForm(f => ({ ...f, synonyms: e.target.value }))}
                placeholder="e.g. ACs, Acceptance Conditions"
                disabled={submitting}
              />
            </label>
            <label style={labelStyle}>
              Related concepts <span style={{ color: '#9ca3af', fontWeight: 400 }}>(comma-separated, optional)</span>
              <input
                style={inputStyle}
                value={form.related}
                onChange={e => setForm(f => ({ ...f, related: e.target.value }))}
                placeholder="e.g. Story, Epic, Sprint"
                disabled={submitting}
              />
            </label>
          </div>

          {error && <p style={{ color: '#dc2626', marginTop: 12, marginBottom: 0 }}>{error}</p>}
          {success && <p style={{ color: '#16a34a', marginTop: 12, marginBottom: 0 }}>{success}</p>}

          <button type="submit" style={buttonStyle} disabled={submitting}>
            {submitting ? 'Adding…' : 'Add concept'}
          </button>
        </form>
      </div>

      {/* Concept list */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          {loading ? 'Loading…' : `${concepts.length} concepts`}
        </h2>
        <input
          style={{ ...inputStyle, width: 220, marginTop: 0 }}
          placeholder="Filter concepts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {!loading && filtered.length === 0 && (
        <p style={{ color: '#6b7280' }}>No concepts match "{search}".</p>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(concept => {
          const slug = toSlug(concept.name)
          const isDeleting = deleting === slug
          return (
            <div
              key={slug}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                background: '#fff',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={`/glossary/${slug}`}
                  style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
                >
                  {concept.name}
                </a>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {concept.definition}
                </p>
              </div>
              <button
                onClick={() => handleDelete(concept)}
                disabled={isDeleting}
                style={{
                  flexShrink: 0,
                  padding: '4px 12px',
                  fontSize: 13,
                  border: '1px solid #fca5a5',
                  borderRadius: 4,
                  background: isDeleting ? '#f9fafb' : '#fff',
                  color: '#dc2626',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? '…' : 'Delete'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 14,
  fontWeight: 500,
}

const inputStyle: React.CSSProperties = {
  marginTop: 4,
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  background: '#fff',
}

const buttonStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '8px 20px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}
