import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, postSchema } from '../../types';

export interface ContentFile {
  filename: string
  content: string
}

function readFilesRecursively(dir: string): ContentFile[] {
  let fileContents: ContentFile[] = []

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fileContents = fileContents.concat(...readFilesRecursively(fullPath))
    } else {
      if (fullPath.endsWith('.md')) {
        fileContents.push({
          filename: fullPath,
          content: fs.readFileSync(fullPath, 'utf-8')
        });
      }
    }
  });

  return fileContents
}

export function parsePosts(files: ContentFile[]): Post[] {
  const posts = files.reduce((acc: Post[], file: ContentFile) => {
    try {
      const { content, data } = matter(file);
      acc.push(postSchema.parse({ ...data, content }))
      return acc
    } catch (e) {
      console.error(`error parsing post: ${file.filename}`, e)
      return acc
    }
  }, [])

  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getPosts(): Post[] {
  return parsePosts(readFilesRecursively(path.join('posts')))
}
