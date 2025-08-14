import SEO from "@/components/SEO";

const About = () => {
  return (
    <>
      <SEO title="About" description="About TechPulse technology news website" />
      <main className="container mx-auto max-w-3xl py-10">
        <h1 className="text-3xl font-bold mb-4">About TechPulse</h1>
        <p className="text-muted-foreground mb-4">
          TechPulse is a lightweight, fast, and modern technology news site. We
          curate the latest stories in AI, cybersecurity, cloud, and more. The
          site is open-source and content is powered by Markdown files for easy
          updates.
        </p>
        <p className="text-muted-foreground">
          Want to contribute? Add new articles in the <code>/src/content/news/</code> folder.
        </p>
      </main>
    </>
  );
};

export default About;
