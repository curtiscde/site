import type { Metadata } from 'next'
import { config } from '../config'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { getMarkdownContent } from '../util/getMarkdownContent'
import '../components/ContentPage.scss'

export const metadata: Metadata = {
  title: `Uses | ${config.title}`,
  description: 'Hardware, software, and tools I use day-to-day.',
}

export default function Uses() {
  const html = getMarkdownContent('uses.md')
  return (
    <>
      <Header />
      <Hero compact />
      <main
        className="content-page container mx-auto px-4 py-8 prose max-w-3xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  )
}
