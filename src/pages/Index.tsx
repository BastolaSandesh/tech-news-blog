import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { getAllArticles } from "@/services/news";
import SEO from "@/components/SEO";

const Index = () => {
  const articles = getAllArticles();
  return (
    <>
      <SEO title="Latest Technology News" description="Read the latest technology news, analysis, and insights from TechPulse." />
      <main className="container mx-auto py-10">
        <h1 className="sr-only">Latest Technology News</h1>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((a) => (
            <Link key={a.slug} to={`/news/${a.slug}`} className="group">
              <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
                {a.image ? (
                  <img
                    src={a.image}
                    alt={`${a.title} thumbnail`}
                    loading="lazy"
                    className="w-full h-48 object-cover"
                  />
                ) : null}
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold leading-snug group-hover:underline">
                    {a.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(a.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {a.summary}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
};

export default Index;
