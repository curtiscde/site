import { Post } from '../../types';

interface IAdjacentPosts {
  previousPost: Post | null,
  nextPost: Post | null,
}

function getPreviousPost(sortedPosts: Array<Post>, postDate: Date): (Post | null) {
  const previousPosts = sortedPosts.filter((p) => p.date < postDate);
  return previousPosts.length ? previousPosts.reduce((a, t) => (t.date > a.date ? t : a)) : null;
}

function getNextPost(sortedPosts: Array<Post>, postDate: Date): (Post | null) {
  const previousPosts = sortedPosts.filter((p) => p.date > postDate);
  return previousPosts.length ? previousPosts.reduce((a, t) => (t.date < a.date ? t : a)) : null;
}

export function getAdjacentPosts(posts: Array<Post>, post: Post): IAdjacentPosts {
  const sortedPosts = posts.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    previousPost: getPreviousPost(sortedPosts, post.date),
    nextPost: getNextPost(sortedPosts, post.date),
  };
}
