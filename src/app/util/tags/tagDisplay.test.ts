import { getPosts } from '../posts';
import { displayTag, mappedTagSlugs } from './tagDisplay';

describe('displayTag', () => {
  it('should map a slug that is not how the thing is written', () => {
    expect(displayTag('c-sharp')).toBe('c#');
    expect(displayTag('console-log')).toBe('console.log');
  });

  it('should return an unmapped tag unchanged', () => {
    expect(displayTag('javascript')).toBe('javascript');
    expect(displayTag('asp.net')).toBe('asp.net');
  });

  // These lost a dot to their slug but are written that way in the wild — chartjs.org
  // is the project's own domain. They are left alone on purpose, so a future pass that
  // "helpfully" restores the dots has to delete this test first.
  it('should leave slugs alone that people genuinely write that way', () => {
    expect(displayTag('nodejs')).toBe('nodejs');
    expect(displayTag('nextjs')).toBe('nextjs');
    expect(displayTag('chartjs')).toBe('chartjs');
    expect(displayTag('lastfm')).toBe('lastfm');
  });

  it('should return an unknown tag unchanged rather than throwing', () => {
    expect(displayTag('a-tag-that-does-not-exist')).toBe('a-tag-that-does-not-exist');
  });
});

describe('the display map', () => {
  /**
   * Catches the quiet failure: a tag gets renamed or retired in frontmatter and its
   * entry here is left behind, so the map claims to fix something no post uses. It
   * cannot catch the mirror case — a new post inventing an unmapped slug variant —
   * which is why BLOG_METADATA_GUIDE.md documents adding one at authoring time.
   */
  it('should have no entry for a tag no post uses', () => {
    const tagsInUse = new Set(getPosts().flatMap((post) => post.tags ?? []));
    const orphans = mappedTagSlugs().filter((slug) => !tagsInUse.has(slug));

    expect(orphans).toEqual([]);
  });
});
