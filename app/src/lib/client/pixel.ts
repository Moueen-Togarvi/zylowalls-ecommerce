// Thin wrappers around the Meta (fbq) and TikTok (ttq) pixel snippets injected in
// src/routes/+layout.svelte. Every call is a no-op when the pixel scripts haven't
// loaded (blocked by an ad blocker, pixel ID not configured, still loading, etc.)
// so callers never need to guard against `window.fbq`/`window.ttq` being missing.

type PixelItem = {
	id: string;
	name?: string;
	price?: number;
	quantity?: number;
};

const CURRENCY = 'PKR';

function callFbq(...args: unknown[]) {
	if (typeof window === 'undefined') return;
	const fbq = (window as any).fbq;
	if (typeof fbq === 'function') fbq(...args);
}

function callTtq(method: string, ...args: unknown[]) {
	if (typeof window === 'undefined') return;
	const ttq = (window as any).ttq;
	if (ttq && typeof ttq[method] === 'function') ttq[method](...args);
}

function lineValue(item: PixelItem) {
	return Number(item.price || 0) * Number(item.quantity || 1);
}

export function trackViewContent(item: PixelItem) {
	callFbq('track', 'ViewContent', {
		content_ids: [item.id],
		content_name: item.name,
		content_type: 'product',
		value: Number(item.price || 0),
		currency: CURRENCY
	});
	callTtq('track', 'ViewContent', {
		contents: [{ content_id: item.id, content_name: item.name, quantity: 1, price: item.price }],
		value: Number(item.price || 0),
		currency: CURRENCY
	});
}

export function trackAddToCart(item: PixelItem) {
	const value = lineValue(item);
	callFbq('track', 'AddToCart', {
		content_ids: [item.id],
		content_name: item.name,
		content_type: 'product',
		value,
		currency: CURRENCY
	});
	callTtq('track', 'AddToCart', {
		contents: [
			{ content_id: item.id, content_name: item.name, quantity: item.quantity || 1, price: item.price }
		],
		value,
		currency: CURRENCY
	});
}

export function trackInitiateCheckout(items: PixelItem[], value: number) {
	callFbq('track', 'InitiateCheckout', {
		content_ids: items.map((item) => item.id),
		contents: items.map((item) => ({ id: item.id, quantity: item.quantity || 1 })),
		content_type: 'product',
		num_items: items.reduce((total, item) => total + Number(item.quantity || 1), 0),
		value,
		currency: CURRENCY
	});
	callTtq('track', 'InitiateCheckout', {
		contents: items.map((item) => ({
			content_id: item.id,
			content_name: item.name,
			quantity: item.quantity || 1,
			price: item.price
		})),
		value,
		currency: CURRENCY
	});
}

export function trackPurchase(orderId: string, value: number, items: PixelItem[]) {
	const eventOptions = { eventID: orderId };
	callFbq(
		'track',
		'Purchase',
		{
			content_ids: items.map((item) => item.id),
			contents: items.map((item) => ({ id: item.id, quantity: item.quantity || 1 })),
			content_type: 'product',
			value,
			currency: CURRENCY
		},
		eventOptions
	);
	callTtq(
		'track',
		'CompletePayment',
		{
			contents: items.map((item) => ({
				content_id: item.id,
				content_name: item.name,
				quantity: item.quantity || 1,
				price: item.price
			})),
			value,
			currency: CURRENCY
		},
		{ event_id: orderId }
	);
}
