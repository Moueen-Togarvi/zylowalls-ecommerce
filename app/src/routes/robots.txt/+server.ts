import { env } from '$env/dynamic/private';
import { cleanOrigin } from '$lib/shared/seo';
import type { RequestHandler } from './$types';

function siteOrigin(requestOrigin: string) {
	return cleanOrigin(env.SITE_URL || env.PUBLIC_SITE_URL || env.APP_URL || requestOrigin);
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = siteOrigin(url.origin);
	const body = `# Zylowalls – robots.txt
# https://zylowalls.com

# ──────────────────────────────────────────────
# All well-behaved crawlers
# ──────────────────────────────────────────────
User-agent: *
Allow: /
Disallow: /zylowalls-secure-admin-7k9x2p/
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /login
Disallow: /track
Disallow: /wishlist
Disallow: /search
Disallow: /api/

# ──────────────────────────────────────────────
# Googlebot – explicit rules for better indexing
# ──────────────────────────────────────────────
User-agent: Googlebot
Allow: /
Disallow: /zylowalls-secure-admin-7k9x2p/
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /login
Disallow: /track
Disallow: /wishlist
Disallow: /search
Disallow: /api/

# ──────────────────────────────────────────────
# Bingbot
# ──────────────────────────────────────────────
User-agent: Bingbot
Allow: /
Disallow: /zylowalls-secure-admin-7k9x2p/
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /login
Disallow: /track
Disallow: /wishlist

# ──────────────────────────────────────────────
# Aggressive / AI scrapers – slow down
# ──────────────────────────────────────────────
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Crawl-delay: 30

User-agent: SemrushBot
Crawl-delay: 10

User-agent: AhrefsBot
Crawl-delay: 10

# ──────────────────────────────────────────────
# Sitemap
# ──────────────────────────────────────────────
Sitemap: ${origin}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=0, s-maxage=3600'
		}
	});
};
