export interface TagNode {
  id: string
  kind: 'tag'
  label: string
  count: number
  radius: number
  href: string
}

export interface PostNode {
  id: string
  kind: 'post'
  label: string
  radius: number
  href: string
  tags: string[]
}

export type GraphNode = TagNode | PostNode

export interface GraphLink {
  source: string
  target: string
}

export interface Graph {
  nodes: GraphNode[]
  links: GraphLink[]
}
