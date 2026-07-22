type StorefrontCollectionBase = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	imageUrl: string | null;
	isVisible: boolean;
	displayOrder: number;
};

type StorefrontCollection = StorefrontCollectionBase & {
	_count?: {
		products: number;
	};
};

type StorefrontImage = {
	id: string;
	url: string;
	altText: string | null;
	displayOrder: number;
};

type StorefrontVariant = {
	id: string;
	color: string;
	size: string;
	stockCount: number;
	sku: string;
};

export type StorefrontProduct = {
	id: string;
	name: string;
	slug: string;
	description: string;
	fabricDetails: string | null;
	price: number;
	salePrice: number | null;
	metaTitle: string | null;
	metaDescription: string | null;
	isActive: boolean;
	images: StorefrontImage[];
	variants: StorefrontVariant[];
	collections: StorefrontCollection[];
};

type FallbackProductOptions = {
	collectionSlug?: string | null;
	excludeId?: string;
	matchingCollectionIds?: string[];
	take?: number;
};

const fallbackCollectionSeed: StorefrontCollectionBase[] = [
	{
		id: 'fallback-collection-acrylic-calligraphy',
		name: 'Acrylic Calligraphy',
		slug: 'acrylic-calligraphy',
		description: null,
		imageUrl: '/acrylic_calligraphy.png',
		isVisible: true,
		displayOrder: 0
	},
	{
		id: 'fallback-collection-wooden-wall-art',
		name: 'Wooden Wall Art',
		slug: 'wooden-wall-art',
		description: null,
		imageUrl: '/wooden_panels.png',
		isVisible: true,
		displayOrder: 1
	},
	{
		id: 'fallback-collection-islamic-art-decor',
		name: 'Islamic Art Decor',
		slug: 'islamic-art-decor',
		description: null,
		imageUrl: '/review_walls_decor.png',
		isVisible: true,
		displayOrder: 2
	}
];

const fallbackDemoNames = [
	'Ayat-ul-Kursi Circular Acrylic Art',
	'Surah Al-Ikhlas Glossy Calligraphy',
	'Shahada Modern Calligraphy',
	'Bismillah Islamic Wood Panel',
	'4 Qul Square Calligraphy Set',
	'Mandala Wooden Art',
	'Abstract Forest Laser Cut Panel',
	'Minimalist Tree of Life Decor',
	'Sleek Leaf Silhouette Set',
	'Moroccan Pattern Wall Sculpture',
	'Arabesque MDF Carved Calligraphy',
	'Surah Rahman Wooden Artwork',
	'Linear Face Art Acrylic Panel',
	'Chevron Pattern Wood Art',
	'Hexagon Wall Tiles',
	'Modern Calligraphy Round Shield'
];

const fallbackDemoImages = [
	'/acrylic_calligraphy.png',
	'/wooden_panels.png',
	'/review_walls_decor.png'
];

const fallbackDemoColors = ['Black & Gold', 'Solid Black', 'Walnut Brown', 'Antique Gold', 'Silver Accent'];

function slugifyFallback(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

function createFallbackDemoProducts(): StorefrontProduct[] {
	return fallbackDemoNames.map((name, index) => {
		const number = String(index + 1).padStart(2, '0');
		const color = fallbackDemoColors[index % fallbackDemoColors.length];
		const primaryCollection = fallbackCollectionSeed[index % fallbackCollectionSeed.length];
		const secondaryCollection = fallbackCollectionSeed[(index + 1) % fallbackCollectionSeed.length];
		const price = 3900 + index * 400;

		return {
			id: `fallback-demo-product-${number}`,
			name,
			slug: `demo-${slugifyFallback(name)}`,
			description: `${name} represents premium artisan quality. Perfect for living rooms, dining spaces, bedrooms, or offices. Lightweight design and ready to hang.`,
			fabricDetails: 'Laser-cut premium MDF engineered wood or high-gloss acrylic, solid durability.',
			price,
			salePrice: index % 3 === 0 ? Math.round(price * 0.9) : null,
			metaTitle: null,
			metaDescription: null,
			isActive: true,
			images: [
				{
					id: `fallback-demo-image-${number}`,
					url: fallbackDemoImages[index % fallbackDemoImages.length],
					altText: name,
					displayOrder: 0
				}
			],
			variants: [
				{
					id: `fallback-demo-variant-${number}-m`,
					color,
					size: 'Medium (16x16")',
					sku: `FALLBACK-${number}-${color.toUpperCase().replace(/\s+/g, '-')}-M`,
					stockCount: 15 + (index % 5)
				},
				{
					id: `fallback-demo-variant-${number}-l`,
					color,
					size: 'Large (24x24")',
					sku: `FALLBACK-${number}-${color.toUpperCase().replace(/\s+/g, '-')}-L`,
					stockCount: 10 + (index % 3)
				}
			],
			collections: [primaryCollection, secondaryCollection]
		};
	});
}

const fallbackProductSeed: StorefrontProduct[] = [
	{
		id: 'fallback-product-ayat-ul-kursi',
		name: 'Ayat-ul-Kursi Acrylic Calligraphy',
		slug: 'ayat-ul-kursi-acrylic-calligraphy',
		description:
			'Premium double-layer glossy acrylic Islamic calligraphy. Handcrafted with high precision laser cutting, creating a stunning reflection on your walls. Perfect for living rooms, entrance halls, or gifting.',
		fabricDetails: 'High-gloss acrylic face, sturdy MDF backing, float-mount brackets included.',
		price: 6800,
		salePrice: null,
		metaTitle: null,
		metaDescription: null,
		isActive: true,
		images: [
			{
				id: 'fallback-image-ayat-1',
				url: '/acrylic_calligraphy.png',
				altText: 'Ayat-ul-Kursi Acrylic Calligraphy',
				displayOrder: 0
			}
		],
		variants: [
			{
				id: 'fallback-variant-ayat-bg-m',
				color: 'Black & Gold',
				size: 'Medium (16x16")',
				sku: 'ZY-AYAT-BG-M',
				stockCount: 15
			},
			{
				id: 'fallback-variant-ayat-bg-l',
				color: 'Black & Gold',
				size: 'Large (24x24")',
				sku: 'ZY-AYAT-BG-L',
				stockCount: 10
			}
		],
		collections: [fallbackCollectionSeed[0]]
	},
	{
		id: 'fallback-product-floral-panels',
		name: 'Floral Wooden Panel Set',
		slug: 'floral-wooden-panel-set',
		description:
			'Stunning 3-piece laser-cut wood wall panel set. Modern floral design that adds a rustic yet contemporary charm to any bedroom or dining room wall. Comes ready to hang with pre-applied heavy-duty tape.',
		fabricDetails: '6mm premium MDF engineered wood, matte charcoal finish, 3 panels total.',
		price: 4500,
		salePrice: 3999,
		metaTitle: null,
		metaDescription: null,
		isActive: true,
		images: [
			{
				id: 'fallback-image-geo-1',
				url: '/wooden_panels.png',
				altText: 'Floral Wooden Panel Set',
				displayOrder: 0
			}
		],
		variants: [
			{
				id: 'fallback-variant-geo-blk-set',
				color: 'Charcoal Black',
				size: '3-Piece Set (12x24" each)',
				sku: 'ZY-GEO-BLK-SET',
				stockCount: 12
			},
			{
				id: 'fallback-variant-geo-wal-set',
				color: 'Walnut Brown',
				size: '3-Piece Set (12x24" each)',
				sku: 'ZY-GEO-WAL-SET',
				stockCount: 8
			}
		],
		collections: [fallbackCollectionSeed[1], fallbackCollectionSeed[2]]
	},
	...createFallbackDemoProducts()
];

const fallbackReviewPhotos = [
	{
		id: 'fallback-review-photo-1',
		url: '/review_walls_decor.png'
	}
];

function productCountForCollection(slug: string) {
	return fallbackProductSeed.filter((product) =>
		product.collections.some((collection) => collection.slug === slug)
	).length;
}

function copyCollection(collection: StorefrontCollectionBase): StorefrontCollection {
	return {
		...collection,
		_count: {
			products: productCountForCollection(collection.slug)
		}
	};
}

function copyProduct(product: StorefrontProduct): StorefrontProduct {
	return {
		...product,
		images: product.images.map((image) => ({ ...image })),
		variants: product.variants.map((variant) => ({ ...variant })),
		collections: product.collections.map(copyCollection)
	};
}

export function serializeStorefrontProduct<
	T extends { price: unknown; salePrice?: unknown | null }
>(product: T) {
	return {
		...product,
		price: Number(product.price),
		salePrice: product.salePrice ? Number(product.salePrice) : null
	};
}

export function getFallbackCollections(options: { sortByName?: boolean; take?: number } = {}) {
	const collections = fallbackCollectionSeed.map(copyCollection);
	const sorted = options.sortByName
		? collections.sort((a, b) => a.name.localeCompare(b.name))
		: collections.sort((a, b) => a.displayOrder - b.displayOrder);

	return typeof options.take === 'number' ? sorted.slice(0, options.take) : sorted;
}

export function getFallbackProducts(options: FallbackProductOptions = {}) {
	let products = fallbackProductSeed.map(copyProduct).filter((product) => product.isActive);

	if (options.collectionSlug) {
		products = products.filter((product) =>
			product.collections.some((collection) => collection.slug === options.collectionSlug)
		);
	}

	if (options.excludeId) {
		products = products.filter((product) => product.id !== options.excludeId);
	}

	if (options.matchingCollectionIds?.length) {
		const collectionIds = new Set(options.matchingCollectionIds);
		products = products.filter((product) =>
			product.collections.some((collection) => collectionIds.has(collection.id))
		);
	}

	return typeof options.take === 'number' ? products.slice(0, options.take) : products;
}

export function getFallbackProduct(slug: string) {
	return getFallbackProducts().find((product) => product.slug === slug) ?? null;
}

export function getFallbackReviewPhotos() {
	return fallbackReviewPhotos.map((photo) => ({ ...photo }));
}

export function getFallbackColors(products: StorefrontProduct[]) {
	return Array.from(
		new Set(products.flatMap((product) => product.variants.map((variant) => variant.color)))
	).filter(Boolean);
}

export function searchFallbackProducts(query: string) {
	const normalizedQuery = query.trim().toLowerCase();

	if (normalizedQuery.length < 2) {
		return [];
	}

	return getFallbackProducts().filter((product) =>
		[
			product.name,
			product.description,
			product.fabricDetails,
			...product.collections.map((collection) => collection.name)
		]
			.filter(Boolean)
			.some((value) => String(value).toLowerCase().includes(normalizedQuery))
	);
}

export function isDatabaseUnavailable(error: unknown) {
	const candidate = error as { code?: unknown; message?: unknown };

	if (candidate?.code === 'P1001') {
		return true;
	}

	return (
		typeof candidate?.message === 'string' &&
		(candidate.message.includes("Can't reach database server") ||
			candidate.message.includes('Server has closed the connection'))
	);
}

export function warnStorefrontFallback(route: string, error: unknown) {
	const message =
		error instanceof Error
			? error.message
					.split('\n')
					.map((line) => line.trim())
					.find(Boolean)
			: String(error);

	console.warn(`[storefront] ${route}: database unavailable; using fallback catalog. ${message}`);
}
