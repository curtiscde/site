import { z } from "zod"
import showdown from 'showdown';
import { config } from "../config";

const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

const convert = new showdown.Converter({
  simplifiedAutoLink: true
});

export const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  slug: z.string(),
  tags: z.string().array(),
  date: z.date(),
  content: z.string(),
}).transform((post) => {

  const { date, image: imageThumbnailUrl, slug, ...rest } = post

  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const dateFormatted = `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  const contentHtml = convert.makeHtml(post.content);

  return {
    ...rest,
    date,
    dateFormatted,
    contentHtml,
    imageThumbnailUrl,
    slug,
    url: `${config.url}/post/${slug}`
  }
})

export type Post = z.infer<typeof postSchema>
