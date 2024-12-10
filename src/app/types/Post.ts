export interface Post {
  id: string
  title: string
  description?: string
  thumbnailImageUrl?: string
  slug: string
  tags?: string[]
  date: Date
  content: string
}