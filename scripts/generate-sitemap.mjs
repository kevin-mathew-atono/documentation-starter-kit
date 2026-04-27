#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'out')
const BASE_URL = process.env.SITE_URL || 'https://documentation-starter-kit-gilt-chi.vercel.app'

function collectUrls(dir, base = '') {
  const urls = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      urls.push(...collectUrls(path.join(dir, entry.name), `${base}/${entry.name}`))
    } else if (entry.name.endsWith('.html') && entry.name !== '404.html') {
      const slug = entry.name === 'index.html' ? base || '/' : `${base}/${entry.name.replace('.html', '')}`
      urls.push(slug || '/')
    }
  }
  return urls
}

const urls = collectUrls(OUT_DIR)

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>\n    <loc>${BASE_URL}${url}</loc>\n  </url>`).join('\n')}
</urlset>`

fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), sitemap)
console.log(`sitemap.xml written with ${urls.length} URLs`)
