/**
 * Diagnoses order-confirmation email delivery.
 *
 * Sends one test email through Resend using the exact same sender resolution the
 * checkout uses, and prints Resend's raw response — so a failure shows the real
 * reason instead of disappearing into a swallowed warning.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx node --env-file=.env prisma/test-order-email.mjs someone@example.com
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const to = process.argv[2];
if (!to) {
	console.error('Usage: node --env-file=.env prisma/test-order-email.mjs <recipient@example.com>');
	process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;

const settingsRows = await prisma.storeSetting.findMany({
	where: { key: { in: ['resend_from_email', 'store_name', 'store_contact_email'] } }
});
const settings = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));
await prisma.$disconnect();

const storeName = settings.store_name || 'Zylowalls';
const configuredFrom = settings.resend_from_email || process.env.RESEND_FROM_EMAIL || '';

// Mirrors formatSender() in src/lib/server/order-notifications.ts
const from = !configuredFrom.trim()
	? `${storeName} <onboarding@resend.dev>`
	: configuredFrom.includes('<')
		? configuredFrom.trim()
		: `${storeName} <${configuredFrom.trim()}>`;

console.log('--- resolved config ---');
console.log('RESEND_API_KEY       :', apiKey ? `set (${apiKey.slice(0, 6)}…)` : 'NOT SET');
console.log('resend_from_email(db):', JSON.stringify(settings.resend_from_email ?? ''));
console.log('RESEND_FROM_EMAIL    :', JSON.stringify(process.env.RESEND_FROM_EMAIL ?? ''));
console.log('effective from       :', from);
console.log('sending to           :', to);
console.log();

if (!apiKey) {
	console.error('RESEND_API_KEY is not set, so the app would silently skip sending. Stopping.');
	process.exit(1);
}

const response = await fetch('https://api.resend.com/emails', {
	method: 'POST',
	headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
	body: JSON.stringify({
		from,
		to: [to],
		subject: `${storeName} test order confirmation`,
		html: '<p>Test of the customer order-confirmation path. If this arrived, customer emails can be delivered.</p>'
	})
});

const body = await response.text();
console.log('--- resend response ---');
console.log('status:', response.status, response.statusText);
console.log('body  :', body);

if (!response.ok) {
	console.log('\nThis is the exact error the checkout hits when emailing a customer.');
	process.exit(1);
}

console.log('\nDelivered. Customer emails work for this address.');
