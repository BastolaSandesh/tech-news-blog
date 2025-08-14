import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import matter from "gray-matter";
import { componentTagger } from "lovable-tagger";

const makeFeedsPlugin = () => {
  return {
    name: "generate-feeds",
    apply: "build",
    generateBundle(this: any) {
      const baseUrl = process.env.SITE_URL || "https://your-domain.com";
      const contentDir = path.resolve(__dirname, "src/content/news");
      if (!fs.existsSync(contentDir)) return;
      const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));
      const posts = files
        .map((file) => {
          const raw = fs.readFileSync(path.join(contentDir, file), "utf-8");
          const { data } = matter(raw);
          const slug = (data.slug as string) || file.replace(/\.md$/, "");
          const title = (data.title as string) || slug;
          const date = (data.date as string) || new Date().toISOString();
          const summary = (data.summary as string) || "";
          return { slug, title, date, summary };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const urls = ["/", "/about", ...posts.map((p) => `/news/${p.slug}`)];
      const now = new Date().toISOString();

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
        urls
          .map(
            (u) =>
              `<url><loc>${baseUrl}${u}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>${u === "/" ? "1.0" : "0.8"}</priority></url>`
          )
          .join("") +
        `</urlset>`;

      const rssItems = posts
        .map(
          (p) => `\n  <item>\n    <title><![CDATA[${p.title}]]></title>\n    <link>${baseUrl}/news/${p.slug}</link>\n    <guid isPermaLink="true">${baseUrl}/news/${p.slug}</guid>\n    <pubDate>${new Date(p.date).toUTCString()}</pubDate>\n    <description><![CDATA[${p.summary}]]></description>\n  </item>`
        )
        .join("");

      const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>TechPulse RSS</title>\n  <link>${baseUrl}</link>\n  <description>Latest technology news from TechPulse</description>\n  <lastBuildDate>${now}</lastBuildDate>${rssItems}\n</channel>\n</rss>`;

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
      this.emitFile({ type: "asset", fileName: "rss.xml", source: rss });
    },
  } as const;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    minify: mode === 'production',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast'
          ]
        }
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger(), makeFeedsPlugin()].filter(Boolean) as any,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
