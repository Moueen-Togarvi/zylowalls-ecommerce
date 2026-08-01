import prisma from '$lib/server/prisma';
import { unitPrice } from '$lib/shared/money';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Re-resolves cart lines against the database.
 *
 * The cart lives in localStorage, so its name/price/image are a snapshot taken
 * whenever the item was added. Those snapshots go stale when a product is
 * re-priced, renamed or deleted, which is how a checkout ends up showing the
 * wrong product or a price that disagrees with what the order is actually
 * charged. The client calls this before rendering cart/checkout and replaces
 * its snapshot with whatever the database says right now.
 */
export const POST: RequestHandler = async ({ request }) => {
	let payload: { items?: Array<{ productId?: string; variantId?: string }> };

	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const items = Array.isArray(payload?.items) ? payload.items : [];
	const productIds = [
		...new Set(items.map((item) => String(item?.productId ?? '').trim()).filter(Boolean))
	];

	if (productIds.length === 0) return json({ products: [] });

	const products = await prisma.product.findMany({
		where: { id: { in: productIds }, isActive: true },
		include: {
			images: { orderBy: { displayOrder: 'asc' }, take: 1 },
			variants: true
		}
	});

	return json({
		products: products.map((product) => ({
			id: product.id,
			name: product.name,
			slug: product.slug,
			price: unitPrice({ price: Number(product.price), salePrice: product.salePrice }),
			image: product.images[0]?.url ?? null,
			variants: product.variants.map((variant) => ({
				id: variant.id,
				color: variant.color,
				size: variant.size,
				stockCount: variant.stockCount
			}))
		}))
	});
};
