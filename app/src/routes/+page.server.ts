import prisma from '$lib/server/prisma';
import {
	getFallbackCollections,
	getFallbackProducts,
	getFallbackReviewPhotos,
	isDatabaseUnavailable,
	serializeStorefrontProduct,
	warnStorefrontFallback
} from '$lib/server/storefront-fallback';
import {
	defaultStorefrontSettings,
	getPublicStorefrontSettings,
	publicStorefrontSettingsFromValues
} from '$lib/server/store-settings';
import {
	HOME_PAGE_KEY,
	HOME_SECTION_CONFIGS,
	HOME_SECTION_KEYS,
	homeSectionHref
} from '$lib/shared/home-sections';
import type { PageServerLoad } from './$types';

// Only select fields needed on the homepage — avoids fetching heavy description text etc.
const productSelect = {
	id: true,
	name: true,
	slug: true,
	price: true,
	salePrice: true,
	isActive: true,
	createdAt: true,
	images: {
		select: { url: true, displayOrder: true },
		orderBy: { displayOrder: 'asc' as const },
		take: 1 // Only first image needed for product cards
	},
	variants: {
		select: { id: true, color: true, size: true, stockCount: true }
	},
	collections: {
		select: { id: true, name: true, slug: true }
	}
} as const;

const buildHomeSections = (
	fallbackProducts: any[],
	fallbackTotal: number,
	selectedProductsBySection = new Map<string, any[]>()
) =>
	Object.fromEntries(
		HOME_SECTION_CONFIGS.map((section) => {
			const selectedProducts = selectedProductsBySection.get(section.key) ?? [];
			const sourceProducts = selectedProducts.length ? selectedProducts : fallbackProducts;
			const total = selectedProducts.length ? selectedProducts.length : fallbackTotal;

			return [
				section.key,
				{
					...section,
					products: sourceProducts.slice(0, section.homepageLimit),
					total,
					viewAllHref: homeSectionHref(section.key),
					usesFallback: selectedProducts.length === 0
				}
			];
		})
	);

export const load: PageServerLoad = async ({ setHeaders }) => {
	// Cache homepage at CDN for 5 minutes, allow stale for 10 min
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	try {
		const storefrontSectionProduct = (prisma as any).storefrontSectionProduct;
		const [products, collections, reviewPhotos, placements, storefrontSettings] =
			await Promise.all([
				prisma.product.findMany({
					where: { isActive: true },
					select: productSelect,
					orderBy: { createdAt: 'desc' },
					take: 16
				}),
				prisma.collection.findMany({
					where: { isVisible: true },
					orderBy: { displayOrder: 'asc' },
					select: {
						id: true,
						name: true,
						slug: true,
						imageUrl: true,
						description: true,
						displayOrder: true,
						_count: { select: { products: true } }
					}
				}),
				prisma.reviewPhoto.findMany({
					where: { isVisible: true },
					orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
					select: { id: true, url: true }
				}),
				storefrontSectionProduct?.findMany
					? storefrontSectionProduct.findMany({
							where: {
								pageKey: HOME_PAGE_KEY,
								sectionKey: { in: [...HOME_SECTION_KEYS] },
								product: { isActive: true }
							},
							include: {
								product: { select: productSelect }
							},
							orderBy: [
								{ sectionKey: 'asc' },
								{ displayOrder: 'asc' },
								{ createdAt: 'asc' }
							]
						})
					: Promise.resolve([]),
				getPublicStorefrontSettings()
			]);

		const serializedProducts = products.map(serializeStorefrontProduct);
		const selectedProductsBySection = new Map<string, any[]>();

		for (const placement of placements) {
			const selectedProducts = selectedProductsBySection.get(placement.sectionKey) ?? [];
			selectedProducts.push(serializeStorefrontProduct(placement.product));
			selectedProductsBySection.set(placement.sectionKey, selectedProducts);
		}

		return {
			products: serializedProducts,
			homeSections: buildHomeSections(
				serializedProducts,
				serializedProducts.length,
				selectedProductsBySection
			),
			collections,
			reviewPhotos,
			storefrontSettings
		};
	} catch (error) {
		if (!isDatabaseUnavailable(error)) {
			throw error;
		}

		warnStorefrontFallback('/', error);

		const fallbackProducts = getFallbackProducts();

		return {
			products: fallbackProducts.slice(0, 16),
			homeSections: buildHomeSections(fallbackProducts, fallbackProducts.length),
			collections: getFallbackCollections(),
			reviewPhotos: getFallbackReviewPhotos(),
			storefrontSettings: publicStorefrontSettingsFromValues(defaultStorefrontSettings)
		};
	}
};
