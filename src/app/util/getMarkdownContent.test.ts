import path from 'path';
import fs from 'fs';
import { getMarkdownContent } from './getMarkdownContent';

jest.mock('fs');

const readFileSync = fs.readFileSync as jest.Mock;

describe('getMarkdownContent', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reads the file from the content directory relative to cwd', () => {
    readFileSync.mockReturnValue('# Hello');
    getMarkdownContent('uses.md');
    expect(readFileSync).toHaveBeenCalledWith(
      path.join(process.cwd(), 'content', 'uses.md'),
      'utf-8',
    );
  });

  it('converts markdown to HTML', () => {
    readFileSync.mockReturnValue('# Hello');
    const html = getMarkdownContent('uses.md');
    expect(html).toContain('<h1>Hello</h1>');
  });

  it('renders markdown inline formatting and links', () => {
    readFileSync.mockReturnValue('Some **bold** text and a [link](https://example.com).');
    const html = getMarkdownContent('uses.md');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it('returns a string', () => {
    readFileSync.mockReturnValue('plain text');
    expect(typeof getMarkdownContent('uses.md')).toBe('string');
  });

  it('returns an empty string for empty file content', () => {
    readFileSync.mockReturnValue('');
    expect(getMarkdownContent('empty.md')).toBe('');
  });

  it('propagates errors when the file cannot be read', () => {
    readFileSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });
    expect(() => getMarkdownContent('missing.md')).toThrow('ENOENT');
  });
});
