// SSDK SEO Engine - Manages dynamic page titles, descriptions, metadata and JSON-LD crawlers schemas
// Compiles dynamic Open Graph blocks and formats local sitemap XML indices.

export class SEOEngine {
  constructor() {
    this.core = null;
  }

  async init(core) {
    this.core = core;
  }

  /**
   * Enterprise Metadata Injector
   */
  updateMetadata(tool) {
    if (!tool) return;

    const url = window.location.href;
    const siteName = "SSDK TOOLS HUB";
    const author = tool.author || "SSDK";
    
    // 1. Title & Meta Description
    document.title = tool.seoTitle || `${tool.name} • Free ${tool.category} - ${siteName}`;
    this.setStandardMeta("description", tool.seoDescription || tool.description);
    
    // 2. Keywords
    if (tool.keywords && Array.isArray(tool.keywords)) {
      this.setStandardMeta("keywords", tool.keywords.join(", "));
    }

    // 3. Canonical URL
    this.setCanonicalUrl(url);

    // 4. Open Graph
    this.setOGMeta("og:title", tool.seoTitle || `${tool.name} • ${siteName}`);
    this.setOGMeta("og:description", tool.seoDescription || tool.description);
    this.setOGMeta("og:type", "website");
    this.setOGMeta("og:url", url);
    this.setOGMeta("og:site_name", siteName);
    if (tool.ogImage) this.setOGMeta("og:image", tool.ogImage);

    // 5. Twitter Cards
    this.setTwitterMeta("twitter:card", "summary_large_image");
    this.setTwitterMeta("twitter:title", tool.seoTitle || `${tool.name} • ${siteName}`);
    this.setTwitterMeta("twitter:description", tool.seoDescription || tool.description);
    if (tool.ogImage) this.setTwitterMeta("twitter:image", tool.ogImage);

    // 6. Schema.org JSON-LD
    this.injectEnterpriseJSONLD(tool, url, author);
  }

  setStandardMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.content = content;
  }

  setOGMeta(property, content) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.content = content;
  }

  setTwitterMeta(name, content) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.content = content;
  }

  setCanonicalUrl(url) {
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
    }
    // Clean URL parameters for canonical
    el.href = url.split("?")[0].split("#")[0];
  }

  injectEnterpriseJSONLD(tool, url, author) {
    // Remove existing schemas
    document.querySelectorAll(".ssdk-jsonld-schema").forEach(el => el.remove());

    const schemas = [];

    // WebApplication Schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": tool.name,
      "description": tool.seoDescription || tool.description,
      "url": url,
      "applicationCategory": tool.category || "DeveloperApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "author": {
        "@type": "Organization",
        "name": author
      },
      "softwareVersion": tool.version || "1.0.0",
      "dateModified": tool.lastUpdated || new Date().toISOString().split("T")[0]
    });

    // BreadcrumbList Schema
    if (tool.category) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": window.location.origin
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": tool.category,
            "item": `${window.location.origin}/categories/${tool.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": tool.name,
            "item": url
          }
        ]
      });
    }

    // Inject all schemas
    schemas.forEach((schemaObj, index) => {
      const script = document.createElement("script");
      script.className = "ssdk-jsonld-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schemaObj, null, 2);
      document.head.appendChild(script);
    });
  }

  /**
   * Generates a standard XML sitemap for search crawlers indexing.
   */
  async generateSitemapXML() {
    const config = this.core.getEngine("config");
    const tools = await config.getTools();
    const domain = window.location.origin;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add homepage
    xml += `  <url>\n    <loc>${domain}/index.html</loc>\n    <priority>1.00</priority>\n  </url>\n`;

    // Add static sheets
    const pages = ["about.html", "contact.html", "faq.html", "login.html"];
    pages.forEach(p => {
      xml += `  <url>\n    <loc>${domain}/pages/${p}</loc>\n    <priority>0.50</priority>\n  </url>\n`;
    });

    // Add all registered tools
    tools.forEach(t => {
      xml += `  <url>\n    <loc>${domain}/${t.url}</loc>\n    <priority>0.80</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
  }
}
