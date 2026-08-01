import { trackAddToCart } from './pixel';

export type CartItem = {
	id: string; // Can be a combination of productId and variantId
	productId: string;
	variantId?: string;
	name: string;
	price: number;
	quantity: number;
	image: string;
	color?: string;
	size?: string;
};

export function createCart() {
	let items = $state<CartItem[]>([]);

	// Ensure localStorage is only accessed on client-side
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('zylowalls_cart');
		if (stored) {
			try {
				items = JSON.parse(stored);
			} catch (e) {}
		}
	}

	function save() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('zylowalls_cart', JSON.stringify(items));
		}
	}

	return {
		get items() {
			return items;
		},
		get totalItems() {
			return items.reduce((acc, item) => acc + item.quantity, 0);
		},
		get subtotal() {
			return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
		},
		addItem(newItem: CartItem) {
			const existingIndex = items.findIndex((i) => i.id === newItem.id);
			if (existingIndex >= 0) {
				items[existingIndex].quantity += newItem.quantity;
			} else {
				items.push(newItem);
			}
			save();
			trackAddToCart({
				id: newItem.productId,
				name: newItem.name,
				price: newItem.price,
				quantity: newItem.quantity
			});
		},
		removeItem(id: string) {
			items = items.filter((item) => item.id !== id);
			save();
		},
		updateQuantity(id: string, quantity: number) {
			if (quantity <= 0) {
				this.removeItem(id);
				return;
			}
			const existingIndex = items.findIndex((i) => i.id === id);
			if (existingIndex >= 0) {
				items[existingIndex].quantity = quantity;
			}
			save();
		},
		clear() {
			items = [];
			save();
		},
		/** Replaces the whole cart with a single line — used by "Buy Now". */
		buyNow(newItem: CartItem) {
			items = [newItem];
			save();
			trackAddToCart({
				id: newItem.productId,
				name: newItem.name,
				price: newItem.price,
				quantity: newItem.quantity
			});
		},
		/**
		 * Refreshes every line from the database and drops lines whose product is
		 * gone or inactive, so cart/checkout never show a stale name or price.
		 * Safe to call repeatedly; a network failure leaves the cart untouched.
		 */
		async sync() {
			if (typeof window === 'undefined' || items.length === 0) return;

			let products: Array<{
				id: string;
				name: string;
				price: number;
				image: string | null;
				variants: Array<{ id: string; color: string; size: string; stockCount: number }>;
			}>;

			try {
				const response = await fetch('/api/cart/sync', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						items: items.map((item) => ({ productId: item.productId, variantId: item.variantId }))
					})
				});

				if (!response.ok) return;
				({ products } = await response.json());
			} catch {
				return;
			}

			if (!Array.isArray(products)) return;

			const productById = new Map(products.map((product) => [product.id, product]));

			items = items.flatMap((item) => {
				const product = productById.get(item.productId);
				// Product deleted or deactivated since it was added — drop the line.
				if (!product) return [];

				const variant =
					product.variants.find((candidate) => candidate.id === item.variantId) ??
					product.variants.find(
						(candidate) => candidate.color === item.color && candidate.size === item.size
					) ??
					product.variants.find((candidate) => candidate.stockCount > 0) ??
					product.variants[0];

				return [
					{
						...item,
						id: variant?.id ?? product.id,
						name: product.name,
						price: product.price,
						image: product.image ?? item.image,
						variantId: variant?.id,
						color: variant?.color ?? item.color,
						size: variant?.size ?? item.size
					}
				];
			});

			save();
		}
	};
}

export const cart = createCart();
