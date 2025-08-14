import { parse as parseYAML } from "yaml";

export type Article = {
  slug: string;
  title: string;
  date: string; // ISO
  summary: string;
  tags: string[];
  image?: string;
  content: string; // markdown
};

// Vite will inline raw markdown at build time
const files = import.meta.glob("/src/content/news/*.md", { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function splitFrontMatter(raw: string) {
  if (raw.startsWith("---")) {
    const end = raw.indexOf("\n---", 3);
    if (end !== -1) {
      const fm = raw.slice(3, end + 1).trim();
      const body = raw.slice(end + 4).trimStart();
      return { fm, body } as const;
    }
  }
  return { fm: undefined, body: raw } as const;
}

function parseArticle(path: string, raw: string): Article | null {
  try {
    const { fm, body } = splitFrontMatter(raw);
    let data: Record<string, unknown> = {};
    
    try {
      if (fm) {
        // Add quotes around any value containing a colon
        const fixedFm = fm.replace(/^(\w+):\s*([^"'].+?)$/gm, (_, key, value) => {
          if (value.includes(':')) {
            return `${key}: "${value.replace(/"/g, '\\"')}"`;
          }
          return `${key}: ${value}`;
        });
        data = parseYAML(fixedFm) as Record<string, unknown>;
      }
    } catch (yamlError) {
      console.error(`YAML parsing error in ${path}:`, yamlError);
      // Continue with empty data object
    }

    const fileName = path.split("/").pop() || "";
    const fallbackSlug = fileName.replace(/\.md$/, "");
    
    // Ensure required fields are properly escaped strings
    const slug = String(data.slug || fallbackSlug).trim();
    const title = String(data.title || fallbackSlug)
      .replace(/\n/g, ' ')
      .trim();
    const date = String(data.date || new Date().toISOString()).trim();
    const summary = String(data.summary || "").trim();
    
    // Handle tags
    const tagsRaw = data.tags;
    const tags = Array.isArray(tagsRaw)
      ? (tagsRaw as unknown[]).map((t) => String(t).trim())
      : typeof tagsRaw === "string"
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    
    // Optional image field
    const image = typeof data.image === "string" ? data.image.trim() : undefined;

    // Validate required fields
    if (!slug || !title) {
      console.error(`Missing required fields in ${path}`);
      return null;
    }

    return { slug, title, date, summary, tags, image, content: body };
  } catch (error) {
    console.error(`Error parsing article ${path}:`, error);
    return null;
  }
}

export function getAllArticles(): Article[] {
  const items: Article[] = Object.entries(files)
    .map(([path, raw]) => parseArticle(path, raw))
    .filter(Boolean) as Article[];
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}
