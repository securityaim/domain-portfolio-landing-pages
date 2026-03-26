// Netlify Edge Function: Route custom domains to their landing pages
// Maps Host header to /pages/{domain_slug}.html
export default async (request, context) => {
  const url = new URL(request.url);
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  
  // Don't rewrite the main Netlify subdomain — serve portfolio index
  if (host.includes('netlify.app') || host.includes('netlify.com')) {
    return;
  }
  
  // Convert domain to page slug: wzi.ai -> wzi_ai
  const slug = host.replace(/\./g, '_');
  const pagePath = `/pages/${slug}.html`;
  
  // Rewrite to the domain-specific landing page
  return context.rewrite(pagePath);
};

export const config = {
  path: "/*",
};
