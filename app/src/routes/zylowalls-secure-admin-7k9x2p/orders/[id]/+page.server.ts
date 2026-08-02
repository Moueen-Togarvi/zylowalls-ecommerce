import { setAdminFlash } from '$lib/server/admin-flash';
import prisma from '$lib/server/prisma';
import {
	sendOrderStatusNotification,
	statusToEmailKind,
	type NotificationOrder
} from '$lib/server/order-notifications';
import { serializeOrder } from '$lib/server/order-serialization';
import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const order = await prisma.order.findUnique({
		where: { id: params.id },
		include: {
			user: {
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true
				}
			},
			items: {
				include: {
					product: {
						include: {
							images: { orderBy: { displayOrder: 'asc' } }
						}
					}
				}
			}
		}
	});

	if (!order) {
		throw error(404, 'Order not found');
	}

	const missingProductNames = order.items
		.filter((item) => !item.product)
		.map((item) => item.productName)
		.filter(Boolean);

	if (missingProductNames.length) {
		const fallbackProducts = await prisma.product.findMany({
			where: { name: { in: [...new Set(missingProductNames)] } },
			include: {
				images: { orderBy: { displayOrder: 'asc' } }
			}
		});
		const productsByName = new Map(fallbackProducts.map((product) => [product.name, product]));

		for (const item of order.items as any[]) {
			if (!item.product) {
				item.product = productsByName.get(item.productName) || null;
			}
		}
	}

	return {
		order: serializeOrder(order)
	};
};

/** Loads an order in the shape the email templates expect. */
const loadOrderForEmail = async (
	orderId: string,
	siteUrl: string
): Promise<NotificationOrder | null> => {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		include: {
			items: {
				include: {
					product: {
						include: { images: { orderBy: { displayOrder: 'asc' }, take: 1 } }
					}
				}
			}
		}
	});

	if (!order) return null;

	return {
		id: order.id,
		orderNumber: order.orderNumber,
		guestEmail: order.guestEmail,
		totalAmount: Number(order.totalAmount),
		subtotal: Number(order.subtotal),
		shippingCost: Number(order.shippingCost),
		discountTotal: Number(order.discountTotal),
		paymentMethod: order.paymentMethod,
		trackingNumber: order.trackingNumber,
		createdAt: order.createdAt,
		shippingAddress: (order.shippingAddress ?? {}) as Record<string, unknown>,
		siteUrl,
		items: order.items.map((item) => ({
			productName: item.productName,
			variantColor: item.variantColor,
			variantSize: item.variantSize,
			quantity: item.quantity,
			priceAtPurchase: Number(item.priceAtPurchase),
			imageUrl: item.product?.images?.[0]?.url ?? null
		}))
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, params, cookies, url }) => {
		const data = await request.formData();
		const status = String(data.get('status') || '').trim();
		const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

		if (!allowedStatuses.includes(status)) {
			return fail(400, { error: 'Invalid order status.' });
		}

		const existing = await prisma.order.findUnique({
			where: { id: params.id },
			select: { status: true }
		});

		if (!existing) {
			return fail(404, { error: 'Order not found.' });
		}

		await prisma.order.update({
			where: { id: params.id },
			data: {
				status: status as any,
				isPaid: status === 'DELIVERED' ? true : status === 'CANCELLED' ? false : undefined
			}
		});

		// Only email on an actual transition, so re-saving the same status stays quiet.
		const emailKind = existing.status === status ? null : statusToEmailKind(status);

		if (emailKind) {
			const order = await loadOrderForEmail(params.id, url.origin);
			if (order) await sendOrderStatusNotification(order, emailKind);
		}

		if (status === 'DELIVERED') {
			setAdminFlash(cookies, 'Order marked as complete. Customer has been emailed.');
			throw redirect(303, '/zylowalls-secure-admin-7k9x2p/orders/completed');
		}

		if (status === 'CANCELLED') {
			setAdminFlash(cookies, 'Order cancelled. Customer has been emailed.');
			throw redirect(303, '/zylowalls-secure-admin-7k9x2p/orders/cancelled');
		}

		setAdminFlash(
			cookies,
			emailKind
				? 'Order status updated. Customer has been emailed.'
				: 'Order status updated successfully.'
		);
		throw redirect(303, `/zylowalls-secure-admin-7k9x2p/orders/${params.id}`);
	},

	updateTracking: async ({ request, params, cookies, url }) => {
		const data = await request.formData();
		const trackingNumber = String(data.get('trackingNumber') || '').trim();
		const notify = String(data.get('notify') || '') === 'on';

		const existing = await prisma.order.findUnique({
			where: { id: params.id },
			select: { trackingNumber: true }
		});

		if (!existing) {
			return fail(404, { error: 'Order not found.' });
		}

		await prisma.order.update({
			where: { id: params.id },
			data: { trackingNumber: trackingNumber || null }
		});

		if (notify && trackingNumber) {
			const order = await loadOrderForEmail(params.id, url.origin);
			if (order) await sendOrderStatusNotification(order, 'shipped');
		}

		setAdminFlash(
			cookies,
			!trackingNumber
				? 'Tracking number cleared.'
				: notify
					? 'Tracking number saved. Customer has been emailed.'
					: 'Tracking number saved.'
		);
		throw redirect(303, `/zylowalls-secure-admin-7k9x2p/orders/${params.id}`);
	}
};
