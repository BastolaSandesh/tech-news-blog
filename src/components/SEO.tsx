import { Helmet } from "react-helmet-async";

type SEOProps = {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: string;
};

const siteName = "TechPulse";
const defaultDescription = "TechPulse delivers the latest technology news, insights, and analysis.";

export const SEO = ({
  title = siteName,
  description = defaultDescription,
  canonical,
  image = "/images/news/ai-microchip-thumb.jpg",
  type = "website",
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const url = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical || url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonical || url ? <meta property="og:url" content={(canonical || url) as string} /> : null}
      <meta property="og:type" content={type} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
};

export default SEO;
