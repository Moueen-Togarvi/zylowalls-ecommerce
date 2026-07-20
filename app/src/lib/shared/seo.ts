// ─── Brand & Site Constants ──────────────────────────────────────────────────
export const SITE_NAME = 'Zylowalls';
export const SITE_BRAND = 'Zylowalls Premium Wall Decor';
export const SITE_DESCRIPTION =
	'Shop premium Zylowalls wooden calligraphy, 3D acrylic wall art, and laser-cut wood panels for modern home decoration and luxury office interiors.';
export const SITE_KEYWORDS =
	'wall art Pakistan, wood calligraphy, acrylic wall art, 3D calligraphy, laser-cut wall panels, home decoration Pakistan, islamic wall art, wooden wall decor, Zylowalls, wall art Lahore, wall art Karachi, handcrafted wall decor, premium wall art';
export const SITE_IMAGE = '/image.png';
export const SITE_TWITTER = '@zylowalls';
export const TIKTOK_URL = 'https://www.tiktok.com/@zylowalls';
export const PRIMARY_WHATSAPP_URL = 'https://wa.me/923703772463';
export const SECONDARY_WHATSAPP_URL = 'https://wa.me/923703772463';

// ─── Geo Targeting (Pakistan) ─────────────────────────────────────────────────
export const GEO_REGION = 'PK';
export const GEO_PLACENAME = 'Pakistan';
export const GEO_POSITION = '30.3753;69.3451';
export const ICBM = '30.3753, 69.3451';
export const THEME_COLOR = '#1b1918';

// ─── URL Utilities ────────────────────────────────────────────────────────────
export function cleanOrigin(origin: string) {
	return String(origin || '').replace(/\/+$/, '');
}

export function absoluteUrl(pathOrUrl: string | null | undefined, origin: string) {
	const value = String(pathOrUrl || '').trim();

	if (!value) return cleanOrigin(origin);
	if (/^https?:\/\//i.test(value)) return value;

	return `${cleanOrigin(origin)}${value.startsWith('/') ? value : `/${value}`}`;
}

// ─── Meta Helpers ─────────────────────────────────────────────────────────────
export function metaDescription(value: string | null | undefined, fallback = SITE_DESCRIPTION) {
	const source = String(value || fallback)
		.replace(/\s+/g, ' ')
		.trim();

	return source.length > 158 ? `${source.slice(0, 155).trim()}...` : source;
}

// ─── JSON-LD Helpers ──────────────────────────────────────────────────────────
export function jsonLdScript(data: unknown) {
	return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}<\/script>`;
}

/**
 * Build a BreadcrumbList JSON-LD script.
 * @param items - Array of { name, url } in order from root to current page.
 */
export function breadcrumbJsonLd(
	items: Array<{ name: string; url: string }>,
	origin: string
) {
	return jsonLdScript({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.url, origin)
		}))
	});
}

/**
 * Build a FAQPage JSON-LD script.
 * @param faqs - Array of { question, answer } pairs.
 */
export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
	return jsonLdScript({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.answer
			}
		}))
	});
}

/**
 * Build a LocalBusiness JSON-LD script for Zylowalls.
 */
export function localBusinessJsonLd(origin: string) {
	return jsonLdScript({
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name: SITE_NAME,
		alternateName: SITE_BRAND,
		description: SITE_DESCRIPTION,
		url: absoluteUrl('/', origin),
		logo: absoluteUrl(SITE_IMAGE, origin),
		image: absoluteUrl(SITE_IMAGE, origin),
		telephone: '+92-370-3772463',
		email: 'info@zylowalls.com',
		priceRange: '₨₨',
		currenciesAccepted: 'PKR',
		paymentAccepted: 'Cash, Bank Transfer, JazzCash, EasyPaisa',
		address: {
			'@type': 'PostalAddress',
			addressCountry: 'PK',
			addressRegion: 'Punjab',
			addressLocality: 'Pakistan'
		},
		geo: {
			'@type': 'GeoCoordinates',
			latitude: 30.3753,
			longitude: 69.3451
		},
		areaServed: {
			'@type': 'Country',
			name: 'Pakistan'
		},
		openingHoursSpecification: {
			'@type': 'OpeningHoursSpecification',
			dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
			opens: '09:00',
			closes: '21:00'
		},
		sameAs: [TIKTOK_URL, PRIMARY_WHATSAPP_URL]
	});
}

// ─── Sitemap / XML Helpers ────────────────────────────────────────────────────
export function xmlEscape(value: string | number | Date | null | undefined) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export function isoDate(value: Date | string | null | undefined) {
	const date = value ? new Date(value) : new Date();

	return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
