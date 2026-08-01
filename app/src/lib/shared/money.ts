export const formatMoney = (value: number | string | null | undefined) => {
	const amount = Number(value ?? 0);

	return `Rs. ${new Intl.NumberFormat('en-PK', {
		maximumFractionDigits: 0
	}).format(amount)}`;
};

/**
 * Pricing rules. These are the single source of truth for what a product costs,
 * and they mirror the checkout action in src/routes/checkout/+page.server.ts,
 * which charges `salePrice ?? price` straight from the database. Anything that
 * displays a price or puts one in the cart must go through these helpers —
 * inventing a discount on the client makes the displayed price disagree with
 * the amount actually charged.
 */
export const listPrice = (product: { price?: unknown }) => {
	const price = Number(product?.price ?? 0);
	return Number.isFinite(price) ? price : 0;
};

export const salePriceOf = (product: { price?: unknown; salePrice?: unknown }) => {
	const sale = Number(product?.salePrice);
	if (!Number.isFinite(sale) || sale <= 0) return null;

	const list = listPrice(product);
	if (list > 0 && sale >= list) return null;

	return sale;
};

export const unitPrice = (product: { price?: unknown; salePrice?: unknown }) =>
	salePriceOf(product) ?? listPrice(product);

export const discountPercent = (product: { price?: unknown; salePrice?: unknown }) => {
	const sale = salePriceOf(product);
	const list = listPrice(product);
	if (sale === null || list <= 0) return 0;

	return Math.round(((list - sale) / list) * 100);
};
