import { env } from '$env/dynamic/private';
import prisma from '$lib/server/prisma';
import {
	adminEmailSubject,
	customerEmailSubject,
	renderAdminEmail,
	renderCustomerEmail,
	type OrderEmailContext,
	type OrderEmailData,
	type OrderEmailKind
} from '$lib/server/order-emails';
import { defaultStoreSettings, getSettings } from '$lib/server/store-settings';

export type NotificationOrder = OrderEmailData & { siteUrl?: string };

const cleanOrigin = (value: string | undefined) => {
	const trimmed = String(value || '').trim();
	if (!trimmed) return '';
	return trimmed.replace(/\/+$/, '');
};

const buildUrl = (origin: string, path: string) => (origin ? `${origin}${path}` : path);

const formatSender = (value: string, storeName: string) => {
	const trimmed = value.trim();
	if (!trimmed) return `${storeName} <onboarding@resend.dev>`;
	if (trimmed.includes('<')) return trimmed;
	return `${storeName} <${trimmed}>`;
};

const getFallbackAdminEmail = async (customerEmail: string) => {
	const adminUser = await prisma.user.findFirst({
		where: {
			role: { in: ['SUPER_ADMIN', 'EDITOR'] },
			email: customerEmail ? { not: customerEmail } : undefined
		},
		orderBy: { createdAt: 'asc' },
		select: { email: true }
	});

	return adminUser?.email || '';
};

const sendEmail = async (
	to: string,
	subject: string,
	html: string,
	from: string,
	replyTo?: string
) => {
	const apiKey = env.RESEND_API_KEY;
	if (!apiKey || !to) return { skipped: true as const };

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from,
			to: [to],
			subject,
			html,
			...(replyTo ? { reply_to: replyTo } : {})
		})
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Resend email failed: ${response.status} ${body}`);
	}

	return response.json();
};

/** Resolves sender, recipients and URLs once, shared by every order email. */
const buildContext = async (order: NotificationOrder) => {
	const settings = await getSettings(defaultStoreSettings);
	const customerEmail = String(order.guestEmail || '').trim();
	const fallbackAdminEmail = await getFallbackAdminEmail(customerEmail);
	const adminEmail =
		settings.order_notify_email ||
		env.ORDER_NOTIFY_EMAIL ||
		env.RESEND_NOTIFY_EMAIL ||
		fallbackAdminEmail ||
		settings.store_contact_email ||
		'';
	const storeName = settings.store_name || 'Zylowalls';
	const from = formatSender(settings.resend_from_email || env.RESEND_FROM_EMAIL || '', storeName);
	const origin = cleanOrigin(env.SITE_URL || env.PUBLIC_SITE_URL || env.APP_URL || order.siteUrl);

	const context: OrderEmailContext = {
		storeName,
		origin,
		supportEmail: settings.store_contact_email || '',
		supportPhone: settings.support_phone || settings.whatsapp_order_number || '',
		orderUrl: buildUrl(origin, `/checkout/success?order=${encodeURIComponent(order.id)}`),
		trackUrl: buildUrl(origin, '/track')
	};

	const adminContext: OrderEmailContext = {
		...context,
		orderUrl: buildUrl(
			origin,
			`/zylowalls-secure-admin-7k9x2p/orders/${encodeURIComponent(order.id)}`
		)
	};

	return { context, adminContext, customerEmail, adminEmail, storeName, from };
};

type Delivery = { label: string; to: string; subject: string; html: string; replyTo?: string };

/** Sends each delivery and logs a per-recipient outcome so failures are visible. */
const dispatch = async (orderNumber: string, from: string, deliveries: Delivery[]) => {
	const results = await Promise.allSettled(
		deliveries.map((delivery) =>
			delivery.to
				? sendEmail(delivery.to, delivery.subject, delivery.html, from, delivery.replyTo)
				: Promise.resolve({ skipped: true as const })
		)
	);

	results.forEach((result, index) => {
		const { label, to } = deliveries[index];

		if (!to) {
			console.warn(`[order ${orderNumber}] ${label} email skipped: no address resolved.`);
			return;
		}

		if (result.status === 'rejected') {
			console.error(
				`[order ${orderNumber}] ${label} email to ${to} FAILED (from: ${from}):`,
				result.reason instanceof Error ? result.reason.message : result.reason
			);
			return;
		}

		if ((result.value as { skipped?: boolean })?.skipped) {
			console.warn(
				`[order ${orderNumber}] ${label} email to ${to} skipped: RESEND_API_KEY is not set.`
			);
			return;
		}

		console.log(`[order ${orderNumber}] ${label} email sent to ${to}.`);
	});
};

/** Order placed: confirmation to the customer, alert to the store. */
export const sendOrderNotifications = async (order: NotificationOrder) => {
	try {
		const { context, adminContext, customerEmail, adminEmail, storeName, from } =
			await buildContext(order);

		await dispatch(order.orderNumber, from, [
			{
				label: 'customer',
				to: customerEmail,
				subject: customerEmailSubject('placed', order.orderNumber, storeName),
				html: renderCustomerEmail(order, 'placed', context)
			},
			{
				label: 'admin',
				to: adminEmail,
				subject: adminEmailSubject(order.orderNumber, storeName),
				html: renderAdminEmail(order, adminContext),
				replyTo: customerEmail || undefined
			}
		]);
	} catch (error) {
		console.warn('Order notification emails could not be sent.', error);
	}
};

/**
 * Order status changed in the admin panel: notifies the customer only.
 * PENDING is intentionally silent — the "placed" email already covers it.
 */
export const sendOrderStatusNotification = async (
	order: NotificationOrder,
	kind: OrderEmailKind
) => {
	try {
		const { context, customerEmail, storeName, from } = await buildContext(order);

		await dispatch(order.orderNumber, from, [
			{
				label: `customer (${kind})`,
				to: customerEmail,
				subject: customerEmailSubject(kind, order.orderNumber, storeName),
				html: renderCustomerEmail(order, kind, context)
			}
		]);
	} catch (error) {
		console.warn(`Order ${kind} email could not be sent.`, error);
	}
};

export const statusToEmailKind = (status: string): OrderEmailKind | null => {
	switch (String(status || '').toUpperCase()) {
		case 'PROCESSING':
			return 'processing';
		case 'SHIPPED':
			return 'shipped';
		case 'DELIVERED':
			return 'delivered';
		case 'CANCELLED':
			return 'cancelled';
		default:
			return null;
	}
};
