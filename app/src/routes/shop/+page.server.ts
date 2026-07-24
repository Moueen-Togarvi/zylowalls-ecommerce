import prisma from '$lib/server/prisma';
import {
	getFallbackCollections,
	getFallbackProducts,
	isDatabaseUnavailable,
	serializeStorefrontProduct,
	warnStorefrontFallback
} from '$lib/server/storefront-fallback';
import {
	defaultStorefrontSettings,
	getPublicStorefrontSettings,
	publicStorefrontSettingsFromValues
} from '$lib/server/store-settings';
import type { PageServerLoad } from './$types';

const productInclude = {
	images: { orderBy: { displayOrder: 'asc' } },
	variants: true,
	collections: true
} as const;

const SHOP_PAGE_SIZE = 8;

function requestedPageFrom(url: URL) {
	const requestedPage = Number(url.searchParams.get('page') ?? '1');

	return Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
}

function filtersFrom(url: URL) {
	const saleParam = String(url.searchParams.get('on-sale') ?? url.searchParams.get('sale') ?? '')
		.trim()
		.toLowerCase();

	return {
		q: String(url.searchParams.get('q') ?? '').trim(),
		category: String(
			url.searchParams.get('category') ?? url.searchParams.get('collection') ?? ''
		).trim(),
		color: String(url.searchParams.get('color') ?? '').trim(),
		size: String(url.searchParams.get('size') ?? '').trim(),
		onSale: ['1', 'true', 'yes'].includes(saleParam)
	};
}

function salePriceFor(product: any) {
	const salePrice = Number(product.salePrice);

	return Number.isFinite(salePrice) && salePrice > 0 ? salePrice : null;
}

function salePercentFromSettings(settings: {
	saleTapeEnabled?: boolean;
	saleTapeItems?: string[];
}) {
	if (settings.saleTapeEnabled === false) return 0;

	for (const item of settings.saleTapeItems || []) {
		const match = String(item).match(/(\d{1,2})\s*%/);
		if (!match) continue;

		const percent = Number(match[1]);
		if (Number.isFinite(percent) && percent > 0) {
			return Math.min(percent, 95);
		}
	}

	return 0;
}

function isClockCategory(slug: string) {
	return /\b(clock|clocks|timepiece|timepieces|watch|watches)\b/i.test(slug.replace(/-/g, ' '));
}

function productLooksLikeClock(product: any) {
	const searchable = [product.name, product.slug, product.description, product.fabricDetails]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

	return /\b(clock|clocks|timepiece|timepieces|watch|watches)\b/.test(searchable);
}

function productMatchesFilters(
	product: any,
	filters: ReturnType<typeof filtersFrom>,
	globalSalePercent = 0
) {
	const query = filters.q.toLowerCase();
	const matchesQuery =
		!query ||
		[product.name, product.slug, product.description, product.fabricDetails]
			.filter(Boolean)
			.some((value) => String(value).toLowerCase().includes(query));
	const matchesCategory =
		!filters.category ||
		(product.collections?.some((collection: any) => collection.slug === filters.category) &&
			(!isClockCategory(filters.category) || productLooksLikeClock(product)));
	const matchesColor =
		!filters.color || product.variants?.some((variant: any) => variant.color === filters.color);
	const matchesSize =
		!filters.size || product.variants?.some((variant: any) => variant.size === filters.size);
	const matchesSale = !filters.onSale || salePriceFor(product) !== null || globalSalePercent > 0;

	return matchesQuery && matchesCategory && matchesColor && matchesSize && matchesSale;
}

function buildOptions(products: any[]) {
	const colors = new Set<string>();
	const sizes = new Set<string>();

	for (const product of products) {
		for (const variant of product.variants || []) {
			if (variant.color) colors.add(variant.color);
			if (variant.size) sizes.add(variant.size);
		}
	}

	return {
		colors: Array.from(colors).sort((a, b) => a.localeCompare(b)),
		sizes: Array.from(sizes).sort((a, b) => a.localeCompare(b))
	};
}

function buildPagination(total: number, requestedPage: number) {
	const totalPages = Math.max(1, Math.ceil(total / SHOP_PAGE_SIZE));
	const page = Math.min(requestedPage, totalPages);

	return {
		page,
		pageSize: SHOP_PAGE_SIZE,
		total,
		totalPages,
		hasPrevious: page > 1,
		hasNext: page < totalPages,
		previousPage: Math.max(1, page - 1),
		nextPage: Math.min(totalPages, page + 1)
	};
}

function pageSlice(products: any[], requestedPage: number) {
	const pagination = buildPagination(products.length, requestedPage);

	return {
		pagination,
		products: products.slice(
			(pagination.page - 1) * SHOP_PAGE_SIZE,
			pagination.page * SHOP_PAGE_SIZE
		)
	};
}

export const load: PageServerLoad = async ({ url }) => {
	const filters = filtersFrom(url);
	const requestedPage = requestedPageFrom(url);

	try {
		const [allProducts, collections, storefrontSettings] = await Promise.all([
			prisma.product.findMany({
				where: { isActive: true },
				include: productInclude,
				orderBy: { createdAt: 'desc' }
			}),
			prisma.collection.findMany({
				where: { isVisible: true },
				orderBy: { displayOrder: 'asc' }
			}),
			getPublicStorefrontSettings()
		]);
		const salePercent = salePercentFromSettings(storefrontSettings);
		const serializedProducts = allProducts.map(serializeStorefrontProduct);
		const products = serializedProducts.filter((product: any) =>
			productMatchesFilters(product, filters, salePercent)
		);
		const options = buildOptions(serializedProducts);
		const pagedProducts = pageSlice(products, requestedPage);

		return {
			products: pagedProducts.products,
			collections,
			colors: options.colors,
			sizes: options.sizes,
			filters,
			salePercent,
			pagination: pagedProducts.pagination,
			totalProducts: serializedProducts.length,
			selectedCollection: filters.category
		};
	} catch (error) {
		if (!isDatabaseUnavailable(error)) {
			throw error;
		}

		warnStorefrontFallback('/shop', error);

		const storefrontSettings = publicStorefrontSettingsFromValues(defaultStorefrontSettings);
		const salePercent = salePercentFromSettings(storefrontSettings);
		const allProducts = getFallbackProducts();
		const products = allProducts.filter((product) =>
			productMatchesFilters(product, filters, salePercent)
		);
		const options = buildOptions(allProducts);
		const pagedProducts = pageSlice(products, requestedPage);

		return {
			products: pagedProducts.products,
			collections: getFallbackCollections(),
			colors: options.colors,
			sizes: options.sizes,
			filters,
			salePercent,
			pagination: pagedProducts.pagination,
			totalProducts: allProducts.length,
			selectedCollection: filters.category
		};
	}
};
