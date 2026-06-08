export function removeFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return content;
  return content.slice(end + 4).trimStart();
}

export function extractFrontmatterTags(content: string): string[] {
  if (!content.startsWith('---')) return [];
  const end = content.indexOf('\n---', 3);
  if (end === -1) return [];
  const fm = content.slice(3, end);

  const listMatch = fm.match(/^tags:\s*\n((?:\s*-\s*.+\n?)*)/m);
  if (listMatch) {
    return listMatch[1]
      .split('\n')
      .map(l => l.replace(/^\s*-\s*/, '').trim())
      .filter(t => t.length > 0);
  }

  const inlineMatch = fm.match(/^tags:\s*\[(.+)\]/m);
  if (inlineMatch) {
    return inlineMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  const plainMatch = fm.match(/^tags:\s*(.+)/m);
  if (plainMatch) {
    return plainMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  return [];
}

export function extractInlineTags(body: string): string[] {
  const matches = body.match(/#[\p{L}\p{N}_/]+/gu);
  return matches ?? [];
}

export function extractHeadings(content: string): string[] {
  const lines = content.split('\n');
  return lines
    .filter(l => /^#{1,6}\s+/.test(l))
    .map(l => l.replace(/^#+\s+/, '').trim())
    .filter(h => h.length > 0);
}

export function extractWikilinks(content: string): string[] {
  const matches = [...content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)];
  return matches.map(m => m[1].trim());
}

export function removeCodeBlocks(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
}
