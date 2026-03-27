/**
 * Cloudflare Worker: Host-based routing for domain portfolio.
 * Routes each custom domain to its specific landing page.
 * Fetches directly from the Pages project to avoid recursive fetch/522 errors.
 */

const PAGES_ORIGIN = 'https://domain-portfolio-ezl.pages.dev';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();

    // Strip www prefix
    const domain = hostname.replace(/^www\./, '');

    // Convert domain to page slug: domain.com -> domain_com
    const slug = domain.replace(/\./g, '_');

    // Check if requesting the root path
    if (url.pathname === '/' || url.pathname === '') {
      // Fetch landing page directly from Pages project (not url.origin)
      const pageUrl = `${PAGES_ORIGIN}/pages/${slug}.html`;
      
      try {
        const response = await fetch(pageUrl, {
          cf: { cacheTtl: 300 },
        });

        // If landing page exists, return it
        if (response.ok) {
          return new Response(response.body, {
            status: 200,
            headers: {
              ...Object.fromEntries(response.headers),
              'Content-Type': 'text/html; charset=utf-8',
              'X-Domain-Router': domain,
              'Cache-Control': 'public, max-age=300',
            },
          });
        }
      } catch (e) {
        // If fetch fails, fall through to passthrough
      }
    }

    // For non-root paths (logos, assets), fetch from Pages origin
    if (url.pathname !== '/' && url.pathname !== '') {
      const assetUrl = `${PAGES_ORIGIN}${url.pathname}`;
      try {
        const response = await fetch(assetUrl, {
          cf: { cacheTtl: 86400 },
        });
        if (response.ok) {
          return new Response(response.body, {
            status: response.status,
            headers: response.headers,
          });
        }
      } catch (e) {
        // Fall through
      }
    }

    // Final fallback: return the portfolio index
    const indexResponse = await fetch(`${PAGES_ORIGIN}/`, {
      cf: { cacheTtl: 300 },
    });
    return new Response(indexResponse.body, {
      status: 200,
      headers: {
        ...Object.fromEntries(indexResponse.headers),
        'Content-Type': 'text/html; charset=utf-8',
        'X-Domain-Router': domain,
      },
    });
  },
};
