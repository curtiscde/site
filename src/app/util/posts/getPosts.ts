import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, postSchema } from '../../types';

interface ContentFile {
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

export function getPosts() {
  const fileContents = readFilesRecursively(path.join('posts'))

  const posts: Post[] = fileContents.reduce((files: Post[], file: ContentFile) => {
    try {
      const { content, data } = matter(file);
      files.push(postSchema.parse({ ...data, content }))
      return files
    } catch (e) {
      console.error(`error parsing post: ${file.filename}`, e)
      return files
    }
  }, [] as Post[])

  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}
