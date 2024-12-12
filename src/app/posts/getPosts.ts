import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, postSchema } from '../types/Post';
import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('javascript', javascript);

export function getPosts() {
  const files = fs.readdirSync(path.join('posts'));

  const posts: Post[] = files.map((filename) => {
    const markdownWithMeta = fs.readFileSync(
      path.join('posts', filename),
      'utf-8',
    );

    const { content, data } = matter(markdownWithMeta);

    return postSchema.parse({ ...data, content })
  });

  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}
