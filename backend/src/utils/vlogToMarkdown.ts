import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { Vlog } from '../types/Vlog';

export async function convertVlogToMarkdown(vlog: Vlog): Promise<void> {
  // Create slug from title
  const slug = vlog.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Create frontmatter
  const frontmatter = {
    title: vlog.title,
    date: vlog.timestamp,
    summary: vlog.keyTakeaways[0],
    tags: extractTags(vlog.content),
  };

  // Create markdown content
  const markdown = `---\n${yaml.stringify(frontmatter)}---\n\n${vlog.content}`;

  // Ensure directory exists
  const contentDir = path.join(__dirname, '../../../src/content/news');
  await fs.mkdir(contentDir, { recursive: true });

  // Write markdown file
  const filePath = path.join(contentDir, `${slug}.md`);
  await fs.writeFile(filePath, markdown, 'utf8');
}

function extractTags(content: string): string[] {
  const keywords = {
    gaming: ['game', 'playstation', 'xbox', 'nintendo', 'gaming'],
    tech: ['technology', 'tech', 'digital'],
    ai: ['ai', 'artificial intelligence', 'machine learning'],
    space: ['space', 'rocket', 'satellite'],
    cybersecurity: ['security', 'cyber', 'hack'],
    business: ['startup', 'business', 'company'],
    innovation: ['innovation', 'development', 'research'],
  };

  const tags = new Set<string>();
  const contentLower = content.toLowerCase();

  for (const [category, terms] of Object.entries(keywords)) {
    if (terms.some(term => contentLower.includes(term))) {
      tags.add(category);
    }
  }

  return Array.from(tags);
}
