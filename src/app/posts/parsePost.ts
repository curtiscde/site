import { Post } from '../types/Post';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parsePost = ({ date, description, id, title, slug, tags, image }: any, content: string): Post => {
  const post: Post = {
    content,
    date: new Date(date),
    description,
    id,
    title,
    slug,
    tags,
  };

  if (image) {
    post.thumbnailImageUrl = image;
  }

  return post;
}
