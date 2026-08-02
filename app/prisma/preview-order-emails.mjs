/**
 * Renders every order email template with sample data.
 *
 * Writes each one to build/email-preview/ and, when a recipient is given,
 * sends them through Resend so they can be checked in a real inbox.
 *
 * Usage:
 *   node prisma/preview-order-emails.mjs                       # write files only
 *   RESEND_API_KEY=re_x node prisma/preview-order-emails.mjs you@example.com
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('build/email-preview');
mkdirSync(outDir, { recursive: true });

// Node strips TypeScript natively, but it cannot resolve SvelteKit's $lib alias.
// Copy the module next to its real dependency with the import rewritten.
const source = readFileSync('src/lib/server/order-emails.ts', 'utf-8').replace(
	"from '$lib/shared/money'",
	"from '../shared/money.ts'"
);
const shimPath = path.resolve('src/lib/server/_preview-order-emails.ts');
writeFileSync(shimPath, source, 'utf-8');

let templatesModule;
try {
	templatesModule = await import(`file://${shimPath}`);
} finally {
	rmSync(shimPath, { force: true });
}

const { renderCustomerEmail, renderAdminEmail, customerEmailSubject, adminEmailSubject } =
	templatesModule;

const storeName = 'Zylowalls';
const origin = 'https://zylowalls.com';

const context = {
	storeName,
	origin,
	supportEmail: 'Zylowalls@gmail.com',
	supportPhone: '923703772463',
	orderUrl: `${origin}/checkout/success?order=sample`,
	trackUrl: `${origin}/track`
};

const adminContext = {
	...context,
	orderUrl: `${origin}/zylowalls-secure-admin-7k9x2p/orders/sample`
};

const order = {
	id: 'sample',
	orderNumber: 'ABY-260803-9F2C',
	guestEmail: 'customer@example.com',
	subtotal: 3298,
	shippingCost: 200,
	discountTotal: 0,
	totalAmount: 3498,
	paymentMethod: 'COD',
	trackingNumber: '26506230539176',
	createdAt: new Date(),
	shippingAddress: {
		firstName: 'Fakhar',
		lastName: 'Abbas',
		addressLine1: 'House 24, Street 7, Gulberg III',
		city: 'Lahore',
		postalCode: '54000',
		country: 'Pakistan',
		phone: '03001234567'
	},
	items: [
		{
			productName: 'Ayat ul Kursi – Islamic Calligraphy Wall Art',
			variantColor: 'Black',
			variantSize: '16 by 16',
			quantity: 1,
			priceAtPurchase: 1699,
			imageUrl:
				'https://cdn.shopify.com/s/files/1/0964/6787/8183/files/Untitleddesign_30.jpg?v=1776695776'
		},
		{
			productName: 'QuadraTime – Geometric Wall Clock',
			variantColor: 'Black',
			variantSize: 'Adjust in 16 by 16',
			quantity: 1,
			priceAtPurchase: 1599,
			imageUrl:
				'https://cdn.shopify.com/s/files/1/0964/6787/8183/files/Untitled_design_31.jpg?v=1776695794'
		}
	]
};

const templates = [
	// The confirmation goes out before a courier is assigned, so no tracking yet.
	{
		name: 'customer-1-placed',
		subject: customerEmailSubject('placed', order.orderNumber, storeName),
		html: renderCustomerEmail({ ...order, trackingNumber: null }, 'placed', context)
	},
	{
		name: 'customer-2-processing',
		subject: customerEmailSubject('processing', order.orderNumber, storeName),
		html: renderCustomerEmail({ ...order, trackingNumber: null }, 'processing', context)
	},
	{
		name: 'customer-3-shipped',
		subject: customerEmailSubject('shipped', order.orderNumber, storeName),
		html: renderCustomerEmail(order, 'shipped', context)
	},
	{
		name: 'customer-4-delivered',
		subject: customerEmailSubject('delivered', order.orderNumber, storeName),
		html: renderCustomerEmail(order, 'delivered', context)
	},
	{
		name: 'customer-5-cancelled',
		subject: customerEmailSubject('cancelled', order.orderNumber, storeName),
		html: renderCustomerEmail(order, 'cancelled', context)
	},
	{
		name: 'admin-new-order',
		subject: adminEmailSubject(order.orderNumber, storeName),
		html: renderAdminEmail(order, adminContext)
	}
];

for (const template of templates) {
	writeFileSync(path.join(outDir, `${template.name}.html`), template.html, 'utf-8');
	console.log(`wrote ${path.relative(process.cwd(), path.join(outDir, `${template.name}.html`))}`);
}

const to = process.argv[2];
if (!to) {
	console.log('\nNo recipient given — files written only.');
	process.exit(0);
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
	console.error('\nRESEND_API_KEY is required to send.');
	process.exit(1);
}

console.log(`\nSending ${templates.length} preview emails to ${to}...`);

for (const template of templates) {
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from: `${storeName} <orders@zylowalls.com>`,
			to: [to],
			subject: `[Preview] ${template.subject}`,
			html: template.html
		})
	});

	const body = await response.text();
	console.log(`  ${response.ok ? 'OK  ' : 'FAIL'} ${template.name} → ${body.slice(0, 120)}`);

	// Resend's default rate limit is 2 requests/second.
	await new Promise((resolve) => setTimeout(resolve, 600));
}
