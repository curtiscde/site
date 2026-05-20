import fs from 'fs'
import path from 'path'
import { marked } from 'marked'

export function getMarkdownContent(filename: string): string {
  const filePath = path.join(process.cwd(), 'content', filename)
  const markdown = fs.readFileSync(filePath, 'utf-8')
  return marked(markdown) as string
}
