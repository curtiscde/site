import { Post, TagCount } from '../../types'
import { Graph, GraphLink, GraphNode, PostNode, TagNode } from './types'

const TAG_RADIUS_BASE = 5
const TAG_RADIUS_SCALE = 4.2
const POST_RADIUS = 4.5

const tagId = (tag: string) => `tag:${tag}`
const postId = (slug: string) => `post:${slug}`

/**
 * Builds a JSON-serialisable force-graph model from posts and their tags.
 *
 * Every entry in `tags` becomes a tag node; every post becomes a post node.
 * A link is created for each (post, tag) pair where the tag has a node —
 * post tags with no corresponding tag node are ignored.
 */
export function buildGraph(posts: Post[], tags: TagCount[]): Graph {
  const tagNodes: TagNode[] = tags.map(({ tag, count }) => ({
    id: tagId(tag),
    kind: 'tag',
    label: tag,
    count,
    radius: TAG_RADIUS_BASE + Math.sqrt(count) * TAG_RADIUS_SCALE,
    href: `/tag/${tag}`,
  }))

  const knownTags = new Set(tags.map(({ tag }) => tag))

  const postNodes: PostNode[] = posts.map((post) => ({
    id: postId(post.slug),
    kind: 'post',
    label: post.title,
    radius: POST_RADIUS,
    href: `/post/${post.slug}`,
    tags: post.tags,
  }))

  const links: GraphLink[] = []
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!knownTags.has(tag)) return
      links.push({ source: postId(post.slug), target: tagId(tag) })
    })
  })

  const nodes: GraphNode[] = [...tagNodes, ...postNodes]

  return { nodes, links }
}
