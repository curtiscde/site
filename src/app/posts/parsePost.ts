import { Post } from '../types/Post';

// @ts-expect-error any for now
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
