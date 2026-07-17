export const SITE_NAME = 'Zylowalls';
export const SITE_BRAND = 'Zylowalls Premium Wall Decor';
export const SITE_DESCRIPTION =
	'Shop premium Zylowalls wooden calligraphy, 3D acrylic wall art, and laser-cut wood panels for modern home decoration and luxury office interiors.';
export const SITE_KEYWORDS =
	'wall art, wood calligraphy, acrylic wall art, 3D calligraphy, laser-cut wall panels, home decoration, islamic wall art, Zylowalls';
export const SITE_IMAGE = '/image.png';
export const TIKTOK_URL = 'https://www.tiktok.com/@zylowalls';
export const PRIMARY_WHATSAPP_URL = 'https://wa.me/923116857822';
export const SECONDARY_WHATSAPP_URL = 'https://wa.me/923346657779';


export function cleanOrigin(origin: string) {
	return String(origin || '').replace(/\/+$/, '');
}

export function absoluteUrl(pathOrUrl: string | null | undefined, origin: string) {
	const value = String(pathOrUrl || '').trim();

	if (!value) return cleanOrigin(origin);
	if (/^https?:\/\//i.test(value)) return value;

	return `${cleanOrigin(origin)}${value.startsWith('/') ? value : `/${value}`}`;
}

export function metaDescription(value: string | null | undefined, fallback = SITE_DESCRIPTION) {
	const source = String(value || fallback)
		.replace(/\s+/g, ' ')
		.trim();

	return source.length > 158 ? `${source.slice(0, 155).trim()}...` : source;
}

export function jsonLdScript(data: unknown) {
	return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

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
