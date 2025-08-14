import { useParams, Link } from "react-router-dom";
import { getArticleBySlug } from "@/services/news";
import { marked } from "marked";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { Separator } from "@/components/ui/separator";

marked.setOptions({ breaks: true, gfm: true });

const NewsArticle = () => {
  const { slug } = useParams();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <main className="container mx-auto py-10">
        <p className="text-muted-foreground">Article not found.</p>
        <Link to="/" className="underline">Return home</Link>
      </main>
    );
  }

  const html = marked.parse(article.content) as string;
  const isoDate = new Date(article.date).toISOString();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    datePublished: isoDate,
    dateModified: isoDate,
    image: article.image ? [article.image] : undefined,
    author: [{ "@type": "Person", name: "TechPulse Staff" }],
  } as const;

  return (
    <>
      <SEO
        title={article.title}
        description={article.summary}
        image={article.image}
        type="article"
      />
      <main className="container mx-auto max-w-3xl py-10">
        <article className="max-w-none leading-7">
          <h1 className="mb-2 text-3xl font-bold leading-tight tracking-tight">
            {article.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(article.date).toLocaleDateString()}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
          {article.image ? (
            <img
              src={article.image}
              alt={`${article.title} thumbnail`}
              loading="lazy"
              className="w-full rounded-lg border my-6"
            />
          ) : null}
          <Separator className="my-6" />
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
};

export default NewsArticle;
