import { z } from "zod"
import { marked } from 'marked';
import { config } from "../config";

export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

marked.setOptions({ gfm: true });

export const rawPostSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  slug: z.string(),
  tags: z.string().array(),
  date: z.date(),
  content: z.string(),
  author: z.string().optional(),
})

export type RawPost = z.infer<typeof rawPostSchema>

export function transformPost(post: RawPost) {
  const { date, image: imageThumbnailUrl, slug, ...rest } = post

  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const dateFormatted = `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  const contentHtml = marked.parse(post.content, { async: false });

  const path = `/post/${slug}`
  const url = `${config.url}${path}`

  return {
    ...rest,
    date,
    dateFormatted,
    contentHtml,
    imageThumbnailUrl,
    slug,
    path,
    url
  }
}

export const postSchema = rawPostSchema.transform(transformPost)

export type Post = z.infer<typeof postSchema>
