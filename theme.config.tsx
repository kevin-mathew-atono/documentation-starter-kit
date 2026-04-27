import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

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
    return {
      titleTemplate: '%s – Atono Glossary',
      description: 'Complete reference for every concept and feature in Atono.',
      openGraph: {
        siteName: 'Atono Glossary',
      },
    }
  },
  main: ({ children }) => (
    <div className="rm-Markdown markdown-body" data-testid="RDMD">{children}</div>
  ),
}

export default config
