import { formatMoney } from '$lib/shared/money';

/**
 * Order email templates.
 *
 * Everything here renders table-based HTML with inline styles — Gmail, Outlook
 * and most mobile clients strip <style> blocks, flexbox and grid, so layout has
 * to be carried by tables and attributes. Keep it that way when editing.
 */

export type OrderEmailKind = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type OrderEmailItem = {
	productName: string;
	variantColor?: string | null;
	variantSize?: string | null;
	quantity: number;
	priceAtPurchase: number;
	imageUrl?: string | null;
};

export type OrderEmailData = {
	id: string;
	orderNumber: string;
	guestEmail?: string | null;
	totalAmount: number;
	subtotal: number;
	shippingCost: number;
	discountTotal: number;
	paymentMethod: string;
	trackingNumber?: string | null;
	createdAt?: Date | string | null;
	shippingAddress: Record<string, unknown>;
	items: OrderEmailItem[];
};

export type OrderEmailContext = {
	storeName: string;
	origin: string;
	supportEmail: string;
	supportPhone: string;
	orderUrl: string;
	trackUrl: string;
};

const INK = '#14352d';
const GOLD = '#e4b43d';
const CREAM = '#fbf9f2';
const MUTED = '#6b7d73';
const BORDER = '#e4e0d4';

export const escapeHtml = (value: unknown) =>
	String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');

const customerName = (order: OrderEmailData) =>
	`${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();

const addressLines = (address: Record<string, unknown>) =>
	[
		`${address.firstName || ''} ${address.lastName || ''}`.trim(),
		address.addressLine1,
		address.addressLine2,
		[address.city, address.postalCode].filter(Boolean).join(' '),
		address.country,
		address.phone
	]
		.filter((line) => String(line || '').trim())
		.map(String);

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) return '';
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'Asia/Karachi'
	}).format(date);
};

const paymentLabel = (method: string) =>
	String(method || '').toUpperCase() === 'COD' ? 'Cash on Delivery' : method || 'Cash on Delivery';

/** Headline, tone and progress step for each lifecycle email. */
const presentation: Record<
	OrderEmailKind,
	{ subject: (n: string) => string; badge: string; heading: string; intro: string; step: number }
> = {
	placed: {
		subject: (n) => `Order ${n} confirmed`,
		badge: 'Order confirmed',
		heading: 'Thank you for your order',
		intro:
			'We have received your order and it is being prepared. You will hear from us again as soon as it moves to the next stage.',
		step: 1
	},
	processing: {
		subject: (n) => `Order ${n} is being prepared`,
		badge: 'Processing',
		heading: 'Your order is being prepared',
		intro:
			'Good news — our team has started preparing your order. We will send tracking details the moment it ships.',
		step: 2
	},
	shipped: {
		subject: (n) => `Order ${n} is on the way`,
		badge: 'Shipped',
		heading: 'Your order is on the way',
		intro:
			'Your order has left our facility and is on its way to you. Use the tracking number below to follow it.',
		step: 3
	},
	delivered: {
		subject: (n) => `Order ${n} delivered`,
		badge: 'Delivered',
		heading: 'Your order has been delivered',
		intro:
			'Your order has been delivered. We hope you love it — if anything is not right, just reply to this email.',
		step: 4
	},
	cancelled: {
		subject: (n) => `Order ${n} cancelled`,
		badge: 'Cancelled',
		heading: 'Your order has been cancelled',
		intro:
			'This order has been cancelled and you will not be charged. If this was not expected, please contact us.',
		step: 0
	}
};

const STEPS = ['Confirmed', 'Preparing', 'Shipped', 'Delivered'];

/** Horizontal progress strip. Rendered as a table so it survives email clients. */
const renderProgress = (step: number) => {
	if (step < 1) return '';

	const cells = STEPS.map((label, index) => {
		const done = index + 1 <= step;
		const color = done ? INK : '#c9d2cc';
		const weight = index + 1 === step ? '700' : '400';

		return `
			<td align="center" style="padding: 0 2px; font-family: Arial, Helvetica, sans-serif;">
				<div style="height: 4px; background: ${color}; border-radius: 2px; margin-bottom: 8px;"></div>
				<span style="font-size: 11px; letter-spacing: 0.04em; color: ${done ? INK : MUTED}; font-weight: ${weight};">${label}</span>
			</td>
		`;
	}).join('');

	return `
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 32px;">
			<tr>${cells}</tr>
		</table>
	`;
};

const renderMetaRow = (label: string, value: string) => `
	<tr>
		<td style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: ${MUTED};">${escapeHtml(label)}</td>
		<td align="right" style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: ${INK}; font-weight: 700;">${value}</td>
	</tr>
`;

const renderOrderMeta = (order: OrderEmailData) => {
	const placed = formatDate(order.createdAt);

	return `
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${CREAM}; border: 1px solid ${BORDER}; border-radius: 10px; padding: 18px 20px; margin: 0 0 28px;">
			<tr><td>
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
					${renderMetaRow('Order number', escapeHtml(order.orderNumber))}
					${placed ? renderMetaRow('Order date', escapeHtml(placed)) : ''}
					${renderMetaRow('Payment', escapeHtml(paymentLabel(order.paymentMethod)))}
					${renderMetaRow('Order total', formatMoney(order.totalAmount))}
				</table>
			</td></tr>
		</table>
	`;
};

/** Tracking panel — only rendered once a tracking number actually exists. */
const renderTracking = (order: OrderEmailData, context: OrderEmailContext) => {
	const tracking = String(order.trackingNumber || '').trim();
	if (!tracking) return '';

	return `
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid ${INK}; border-radius: 10px; padding: 18px 20px; margin: 0 0 28px;">
			<tr><td style="font-family: Arial, Helvetica, sans-serif;">
				<p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${MUTED};">Tracking number</p>
				<p style="margin: 0 0 14px; font-size: 20px; font-weight: 700; color: ${INK}; letter-spacing: 0.02em;">${escapeHtml(tracking)}</p>
				<a href="${escapeHtml(context.trackUrl)}" style="display: inline-block; background: ${INK}; color: #ffffff; padding: 11px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 700;">Track your order</a>
			</td></tr>
		</table>
	`;
};

const renderItems = (order: OrderEmailData) => {
	const rows = order.items
		.map((item) => {
			const options = [item.variantColor, item.variantSize]
				.filter((value) => value && String(value).toLowerCase() !== 'default')
				.join(' / ');

			const thumb = item.imageUrl
				? `<img src="${escapeHtml(item.imageUrl)}" width="56" height="56" alt="" style="display: block; width: 56px; height: 56px; border-radius: 6px; object-fit: cover; border: 1px solid ${BORDER};" />`
				: '';

			return `
				<tr>
					${thumb ? `<td width="56" style="padding: 14px 12px 14px 0; vertical-align: top;">${thumb}</td>` : ''}
					<td style="padding: 14px 0; vertical-align: top; font-family: Arial, Helvetica, sans-serif; border-bottom: 1px solid ${BORDER};">
						<p style="margin: 0 0 3px; font-size: 14px; font-weight: 700; color: ${INK};">${escapeHtml(item.productName)}</p>
						${options ? `<p style="margin: 0 0 3px; font-size: 12px; color: ${MUTED};">${escapeHtml(options)}</p>` : ''}
						<p style="margin: 0; font-size: 12px; color: ${MUTED};">Qty ${item.quantity}</p>
					</td>
					<td align="right" style="padding: 14px 0; vertical-align: top; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: ${INK}; border-bottom: 1px solid ${BORDER}; white-space: nowrap;">
						${formatMoney(item.priceAtPurchase * item.quantity)}
					</td>
				</tr>
			`;
		})
		.join('');

	return `
		<p style="margin: 0 0 10px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${MUTED};">Order summary</p>
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 18px;">
			${rows}
		</table>
	`;
};

const renderTotalRow = (label: string, value: string, strong = false) => `
	<tr>
		<td style="padding: 5px 0; font-family: Arial, Helvetica, sans-serif; font-size: ${strong ? '16px' : '13px'}; color: ${strong ? INK : MUTED}; font-weight: ${strong ? '700' : '400'};">${escapeHtml(label)}</td>
		<td align="right" style="padding: 5px 0; font-family: Arial, Helvetica, sans-serif; font-size: ${strong ? '16px' : '13px'}; color: ${INK}; font-weight: 700;">${value}</td>
	</tr>
`;

const renderTotals = (order: OrderEmailData) => `
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px;">
		${renderTotalRow('Subtotal', formatMoney(order.subtotal))}
		${renderTotalRow('Shipping', order.shippingCost > 0 ? formatMoney(order.shippingCost) : 'Free')}
		${order.discountTotal > 0 ? renderTotalRow('Discount', `− ${formatMoney(order.discountTotal)}`) : ''}
		<tr><td colspan="2" style="padding: 6px 0 0; border-top: 1px solid ${BORDER};"></td></tr>
		${renderTotalRow('Total', formatMoney(order.totalAmount), true)}
	</table>
`;

const renderAddress = (order: OrderEmailData) => `
	<p style="margin: 0 0 10px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${MUTED};">Delivery address</p>
	<p style="margin: 0 0 28px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px; color: ${INK};">
		${addressLines(order.shippingAddress).map(escapeHtml).join('<br />')}
	</p>
`;

/**
 * Outer shell: preheader, brand bar, content, footer.
 * `preheader` is the grey preview line clients show next to the subject.
 */
const shell = (options: {
	context: OrderEmailContext;
	preheader: string;
	badge: string;
	badgeBackground?: string;
	heading: string;
	intro: string;
	content: string;
}) => {
	const { context } = options;
	const badgeBackground = options.badgeBackground || GOLD;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="x-apple-disable-message-reformatting" />
	<title>${escapeHtml(options.heading)}</title>
</head>
<body style="margin: 0; padding: 0; background: #f2f0e9;">
	<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${escapeHtml(options.preheader)}</div>

	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f2f0e9; padding: 24px 12px;">
		<tr><td align="center">
			<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 100%; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid ${BORDER};">

				<tr><td style="background: ${INK}; padding: 22px 32px;">
					<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
						<td style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; letter-spacing: 0.18em; color: #ffffff; text-transform: uppercase;">
							${escapeHtml(context.storeName)}
						</td>
						<td align="right">
							<span style="display: inline-block; background: ${badgeBackground}; color: ${INK}; font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 12px; border-radius: 999px;">${escapeHtml(options.badge)}</span>
						</td>
					</tr></table>
				</td></tr>

				<tr><td style="padding: 34px 32px 0;">
					<h1 style="margin: 0 0 10px; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 34px; font-weight: 400; color: ${INK};">${escapeHtml(options.heading)}</h1>
					<p style="margin: 0 0 28px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px; color: ${MUTED};">${escapeHtml(options.intro)}</p>
				</td></tr>

				<tr><td style="padding: 0 32px 8px;">${options.content}</td></tr>

				<tr><td style="background: ${CREAM}; padding: 24px 32px; border-top: 1px solid ${BORDER};">
					<p style="margin: 0 0 6px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: ${INK}; font-weight: 700;">Need help?</p>
					<p style="margin: 0 0 14px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 21px; color: ${MUTED};">
						Reply to this email${context.supportPhone ? ` or WhatsApp us at <a href="https://wa.me/${escapeHtml(context.supportPhone)}" style="color: ${INK}; font-weight: 700; text-decoration: none;">+${escapeHtml(context.supportPhone)}</a>` : ''}.
					</p>
					<p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 18px; color: ${MUTED};">
						${escapeHtml(context.storeName)}${context.origin ? ` · <a href="${escapeHtml(context.origin)}" style="color: ${MUTED};">${escapeHtml(context.origin.replace(/^https?:\/\//, ''))}</a>` : ''}
					</p>
				</td></tr>

			</table>
		</td></tr>
	</table>
</body>
</html>`;
};

export const customerEmailSubject = (
	kind: OrderEmailKind,
	orderNumber: string,
	storeName: string
) => `${storeName}: ${presentation[kind].subject(orderNumber)}`;

export const renderCustomerEmail = (
	order: OrderEmailData,
	kind: OrderEmailKind,
	context: OrderEmailContext
) => {
	const view = presentation[kind];
	const name = customerName(order);
	const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi,';
	const cancelled = kind === 'cancelled';

	const content = `
		<p style="margin: -12px 0 22px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${INK}; font-weight: 700;">${escapeHtml(greeting)}</p>
		${renderProgress(view.step)}
		${renderOrderMeta(order)}
		${cancelled ? '' : renderTracking(order, context)}
		${renderItems(order)}
		${renderTotals(order)}
		${renderAddress(order)}
		${
			context.orderUrl && !cancelled
				? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 8px;"><tr><td>
						<a href="${escapeHtml(context.orderUrl)}" style="display: inline-block; background: ${GOLD}; color: ${INK}; padding: 13px 26px; border-radius: 6px; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700;">View your order</a>
					</td></tr></table>`
				: ''
		}
	`;

	return shell({
		context,
		preheader: `${view.badge} — order ${order.orderNumber}, ${formatMoney(order.totalAmount)}`,
		badge: view.badge,
		badgeBackground: cancelled ? '#e8b4b4' : GOLD,
		heading: view.heading,
		intro: view.intro,
		content
	});
};

export const adminEmailSubject = (orderNumber: string, storeName: string) =>
	`${storeName}: New order ${orderNumber}`;

export const renderAdminEmail = (order: OrderEmailData, context: OrderEmailContext) => {
	const name = customerName(order) || 'Guest';
	const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
	const phone = String(order.shippingAddress.phone || '').trim();

	const content = `
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${INK}; border-radius: 10px; padding: 20px 22px; margin: -12px 0 26px;">
			<tr><td style="font-family: Arial, Helvetica, sans-serif;">
				<p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.6);">Order value</p>
				<p style="margin: 0 0 16px; font-size: 30px; font-weight: 700; color: #ffffff;">${formatMoney(order.totalAmount)}</p>
				<p style="margin: 0; font-size: 13px; line-height: 21px; color: rgba(255,255,255,0.85);">
					${escapeHtml(itemCount)} item${itemCount === 1 ? '' : 's'} · ${escapeHtml(paymentLabel(order.paymentMethod))}
				</p>
			</td></tr>
		</table>

		<p style="margin: 0 0 10px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${MUTED};">Customer</p>
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${CREAM}; border: 1px solid ${BORDER}; border-radius: 10px; padding: 16px 20px; margin: 0 0 26px;">
			<tr><td>
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
					${renderMetaRow('Name', escapeHtml(name))}
					${renderMetaRow('Email', escapeHtml(order.guestEmail || 'Not provided'))}
					${phone ? renderMetaRow('Phone', `<a href="tel:${escapeHtml(phone)}" style="color: ${INK}; text-decoration: none;">${escapeHtml(phone)}</a>`) : ''}
					${renderMetaRow('Order number', escapeHtml(order.orderNumber))}
				</table>
			</td></tr>
		</table>

		${renderItems(order)}
		${renderTotals(order)}
		${renderAddress(order)}

		<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 8px;"><tr><td>
			<a href="${escapeHtml(context.orderUrl)}" style="display: inline-block; background: ${GOLD}; color: ${INK}; padding: 13px 26px; border-radius: 6px; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700;">Open in admin</a>
		</td></tr></table>
	`;

	return shell({
		context,
		preheader: `New order ${order.orderNumber} · ${formatMoney(order.totalAmount)} · ${name}`,
		badge: 'New order',
		heading: `New order from ${name}`,
		intro: `Order ${order.orderNumber} was just placed. Review the details and confirm it in the admin panel.`,
		content
	});
};
