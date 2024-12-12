import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, postSchema } from '../types/Post';

function readFilesRecursively(dir: string): string[] {
  let fileContents: string[] = []

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fileContents = fileContents.concat(...readFilesRecursively(fullPath))
    } else {
      fileContents.push(fs.readFileSync(fullPath, 'utf-8'))
    }
  });

  return fileContents
}

export function getPosts() {
  const fileContents = readFilesRecursively(path.join('posts'))

  const posts: Post[] = fileContents.map((fileContent) => {
    const { content, data } = matter(fileContent);
    return postSchema.parse({ ...data, content })
  });

  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}
