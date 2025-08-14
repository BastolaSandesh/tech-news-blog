const currentYear = new Date().getFullYear();

export const Footer = () => {
  return (
    <footer className="border-t mt-10">
      <div className="container mx-auto py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <p>
          © {currentYear} TechPulse. All rights reserved. • Licensed under MIT
        </p>
        <nav className="flex items-center gap-4">
          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Twitter
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="/rss.xml"
            className="hover:text-foreground transition-colors"
            aria-label="RSS Feed"
          >
            RSS
          </a>
          <a
            href="/sitemap.xml"
            className="hover:text-foreground transition-colors"
            aria-label="Sitemap"
          >
            Sitemap
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
