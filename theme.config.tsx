import React from 'react'
import { useRouter } from 'next/router'
import { DocsThemeConfig } from 'nextra-theme-docs'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://documentation-starter-kit-gilt-chi.vercel.app'

const config: DocsThemeConfig = {
  head: (
    <>
      <meta name="readme-subdomain" content="atono" />
      <meta name="readme-repo" content="atono-e6ac7ee0af02" />
      <meta name="readme-version" content="1.0" />
      <meta name="loadedProject" content="atono" />
    </>
  ),
  logo: <span style={{ fontWeight: 700 }}>Atono Glossary</span>,
  project: {
    link: 'https://github.com/shuding/nextra-docs-template',
  },
  docsRepositoryBase: 'https://github.com/shuding/nextra-docs-template',
  footer: {
    text: 'Atono Glossary',
  },
  useNextSeoProps() {
    const { asPath } = useRouter()
    const canonicalUrl = `${BASE_URL}${asPath}`
    return {
      titleTemplate: '%s – Atono Glossary',
      description: 'Complete reference for every concept and feature in Atono.',
      canonical: canonicalUrl,
      openGraph: {
        siteName: 'Atono Glossary',
        url: canonicalUrl,
      },
    }
  },
  main: ({ children }) => (
    <div className="rm-Markdown markdown-body" data-testid="RDMD">{children}</div>
  ),
}

export default config
