/**
 * Cloudflare Worker: Host-based routing for domain portfolio.
 * Routes each custom domain to its specific landing page.
 * Replaces the Netlify Edge Function.
 */

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
      // Rewrite to the domain-specific landing page
      const pageUrl = new URL(`/pages/${slug}.html`, url.origin);
      
      // Fetch the landing page
      const response = await fetch(pageUrl.toString(), {
        headers: request.headers,
      });

      // If landing page exists, return it
      if (response.status === 200) {
        return new Response(response.body, {
          status: 200,
          headers: {
            ...Object.fromEntries(response.headers),
            'X-Domain-Router': domain,
          },
        });
      }
    }

    // For non-root paths or if no landing page found, pass through
    return fetch(request);
  },
};
