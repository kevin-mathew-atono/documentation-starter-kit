import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
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
    }
  },
}

export default config
