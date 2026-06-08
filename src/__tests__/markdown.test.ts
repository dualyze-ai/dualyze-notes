import {
  removeFrontmatter,
  extractFrontmatterTags,
  extractInlineTags,
  extractHeadings,
  extractWikilinks,
  removeCodeBlocks,
} from '../utils/markdown';

describe('removeFrontmatter', () => {
  it('removes frontmatter block', () => {
    const input = '---\ntitle: Test\n---\nBody text';
    expect(removeFrontmatter(input)).toBe('Body text');
  });

  it('returns content unchanged when no frontmatter', () => {
    const input = 'Just body text';
    expect(removeFrontmatter(input)).toBe('Just body text');
  });
});

describe('extractFrontmatterTags', () => {
  it('extracts list-style tags', () => {
    const input = '---\ntags:\n  - ai\n  - obsidian\n---\nBody';
    expect(extractFrontmatterTags(input)).toEqual(['ai', 'obsidian']);
  });

  it('extracts inline-style tags', () => {
    const input = '---\ntags: [ai, obsidian]\n---\nBody';
    expect(extractFrontmatterTags(input)).toEqual(['ai', 'obsidian']);
  });

  it('returns empty array when no tags', () => {
    const input = '---\ntitle: Test\n---\nBody';
    expect(extractFrontmatterTags(input)).toEqual([]);
  });

  it('returns empty array when no frontmatter', () => {
    expect(extractFrontmatterTags('Just body')).toEqual([]);
  });
});

describe('extractInlineTags', () => {
  it('extracts simple inline tags', () => {
    const input = 'This is #ai and #obsidian content';
    expect(extractInlineTags(input)).toEqual(['#ai', '#obsidian']);
  });

  it('extracts nested tags', () => {
    const input = 'See #obsidian/plugin for details';
    expect(extractInlineTags(input)).toEqual(['#obsidian/plugin']);
  });

  it('returns empty array when no tags', () => {
    expect(extractInlineTags('No tags here')).toEqual([]);
  });
});

describe('extractHeadings', () => {
  it('extracts mixed H1-H3 headings', () => {
    const input = '# Title\n## Section\n### Sub\nBody text';
    expect(extractHeadings(input)).toEqual(['Title', 'Section', 'Sub']);
  });

  it('returns empty array when no headings', () => {
    expect(extractHeadings('Just body text')).toEqual([]);
  });
});

describe('extractWikilinks', () => {
  it('extracts simple wikilinks', () => {
    const input = 'See [[Note A]] and [[Note B]]';
    expect(extractWikilinks(input)).toEqual(['Note A', 'Note B']);
  });

  it('extracts target without alias', () => {
    const input = 'See [[Note|Alias Text]]';
    expect(extractWikilinks(input)).toEqual(['Note']);
  });

  it('returns empty array when no wikilinks', () => {
    expect(extractWikilinks('No links here')).toEqual([]);
  });
});

describe('removeCodeBlocks', () => {
  it('removes fenced code blocks', () => {
    const input = 'Before\n```\ncode here\n```\nAfter';
    expect(removeCodeBlocks(input)).toBe('Before\n\nAfter');
  });

  it('returns content unchanged when no code blocks', () => {
    const input = 'Just plain text';
    expect(removeCodeBlocks(input)).toBe('Just plain text');
  });
});
