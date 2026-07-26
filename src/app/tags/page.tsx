import type { Metadata } from 'next'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { TagGraph } from '../components/tagGraph/TagGraph'
import { config } from '../config'
import { buildGraph } from '../util/graph'
import { getPosts, getTopTags } from '../util/posts'

export const metadata: Metadata = {
  title: `Tag Graph | ${config.title}`,
  description: 'An interactive, force-directed graph of every post and tag on the blog — explore how topics connect.',
  alternates: { canonical: `${config.url}/tags` },
}

export default async function TagsPage() {
  const posts = await getPosts()
  const topTags = getTopTags(posts)
  const { nodes, links } = buildGraph(posts, topTags)

  return (
    <>
      <Header />
      <Hero title="🔖 Tag Graph" subtitle="every post, every tag, connected" />
      <main className="py-5">
        <TagGraph nodes={nodes} links={links} />
      </main>
    </>
  )
}
