import { Post, TagCount } from '../../types'
import { buildGraph } from './buildGraph'
import { GraphNode, PostNode, TagNode } from './types'

function newPost(slug: string, title: string, tags: string[]): Post {
  return {
    title, slug, content: 'foo', date: new Date('2024-01-01'), tags, imageThumbnailUrl: undefined,
  } as unknown as Post
}

function newTag(tag: string, count: number): TagCount {
  return { tag, count, smartScore: count }
}

const isTag = (n: GraphNode): n is TagNode => n.kind === 'tag'
const isPost = (n: GraphNode): n is PostNode => n.kind === 'post'

describe('buildGraph', () => {
  const posts: Post[] = [
    newPost('a', 'Post A', ['react', 'testing']),
    newPost('b', 'Post B', ['react']),
    newPost('c', 'Post C', ['orphan-tag']),
  ]
  const tags: TagCount[] = [newTag('react', 2), newTag('testing', 1)]

  it('returns one node per tag and one per post', () => {
    const { nodes } = buildGraph(posts, tags)
    expect(nodes.filter(isTag)).toHaveLength(tags.length)
    expect(nodes.filter(isPost)).toHaveLength(posts.length)
    expect(nodes).toHaveLength(tags.length + posts.length)
  })

  it('builds tag nodes with the expected shape and radius', () => {
    const { nodes } = buildGraph(posts, tags)
    const react = nodes.find((n) => n.id === 'tag:react') as TagNode

    expect(react).toEqual({
      id: 'tag:react',
      kind: 'tag',
      label: 'react',
      count: 2,
      radius: 5 + Math.sqrt(2) * 4.2,
      href: '/tag/react',
    })
  })

  it('builds post nodes with the expected shape and fixed radius', () => {
    const { nodes } = buildGraph(posts, tags)
    const postA = nodes.find((n) => n.id === 'post:a') as PostNode

    expect(postA).toEqual({
      id: 'post:a',
      kind: 'post',
      label: 'Post A',
      radius: 4.5,
      href: '/post/a',
      tags: ['react', 'testing'],
    })
  })

  it('creates one link per (post, existing tag) pair', () => {
    const { links } = buildGraph(posts, tags)
    // Post A → react + testing (2); Post B → react (1); Post C → orphan-tag (0, ignored)
    expect(links).toHaveLength(3)
    expect(links).toContainEqual({ source: 'post:a', target: 'tag:react' })
    expect(links).toContainEqual({ source: 'post:a', target: 'tag:testing' })
    expect(links).toContainEqual({ source: 'post:b', target: 'tag:react' })
  })

  it('ignores post tags that have no corresponding tag node', () => {
    const { links, nodes } = buildGraph(posts, tags)
    expect(nodes.some((n) => n.id === 'tag:orphan-tag')).toBe(false)
    expect(links.some((l) => l.target === 'tag:orphan-tag')).toBe(false)
  })

  it('produces a fully JSON-serialisable graph (round-trips)', () => {
    const graph = buildGraph(posts, tags)
    expect(JSON.parse(JSON.stringify(graph))).toEqual(graph)
  })

  it('returns empty nodes and links for no posts and no tags', () => {
    expect(buildGraph([], [])).toEqual({ nodes: [], links: [] })
  })

  it('still emits tag nodes when there are tags but no posts', () => {
    const { nodes, links } = buildGraph([], tags)
    expect(nodes).toHaveLength(tags.length)
    expect(nodes.every(isTag)).toBe(true)
    expect(links).toHaveLength(0)
  })
})
