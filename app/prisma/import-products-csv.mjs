/**
 * Imports products from a Shopify CSV export.
 *
 * Image handling: image URLs from the CSV are stored as-is (Shopify CDN links).
 * Nothing here touches Cloudinary — Cloudinary uploads only happen when an admin
 * uploads a file from the admin panel (see src/lib/server/product-image-files.ts).
 *
 * Orders are never touched. Products are replaced, which leaves OrderItem rows
 * intact with productId set to NULL and the product name/price snapshot preserved.
 *
 * Usage: node --env-file=.env prisma/import-products-csv.mjs [path/to/export.csv]
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(text) {
	const result = [];
	let row = [];
	let cell = '';
	let inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const nextChar = text[i + 1];
		if (inQuotes) {
			if (char === '"') {
				if (nextChar === '"') {
					cell += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				cell += char;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
			} else if (char === ',') {
				row.push(cell);
				cell = '';
			} else if (char === '\n' || char === '\r') {
				row.push(cell);
				cell = '';
				if (row.length > 1 || row[0] !== '') result.push(row);
				row = [];
				if (char === '\r' && nextChar === '\n') i++;
			} else {
				cell += char;
			}
		}
	}
	if (row.length > 0 || cell !== '') {
		row.push(cell);
		result.push(row);
	}
	return result;
}

function stripHtml(html) {
	if (!html) return '';
	let text = html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n\n')
		.replace(/<\/div>/gi, '\n')
		.replace(/<\/li>/gi, '\n')
		.replace(/<\/h[1-6]>/gi, '\n\n');
	text = text.replace(/<[^>]*>/g, '');
	text = text
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;/g, "'")
		.replace(/&rsquo;/g, "'")
		.replace(/&lsquo;/g, "'")
		.replace(/&ldquo;/g, '"')
		.replace(/&rdquo;/g, '"');
	return text
		.split('\n')
		.map((line) => line.trim())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

const titleCase = (value) =>
	value
		.trim()
		.split(/\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

// Shopify only writes the option NAME on a product's first row; later variant rows
// carry values with a blank name. So resolve each option slot's role once, up front.
const optionRole = (name) => {
	const n = (name || '').trim().toLowerCase();
	if (!n) return null;
	if (n.includes('col')) return 'color';
	if (n.includes('siz') || n.includes('siiz')) return 'size';
	return null; // "Title" / "Default Title" placeholders
};

// Collection slugs must stay in sync with the ones linked from the storefront
// (WallArtSlidingBanner, ProOfferGrid, store-settings defaults, storefront-fallback).
const COLLECTIONS = [
	{
		name: 'Wooden Wall Art',
		slug: 'wooden-wall-art',
		description: 'Premium wooden wall art panels and multi-frame sets for every room.',
		displayOrder: 1
	},
	{
		name: 'Modern Wall Clocks',
		slug: 'modern-wall-clocks',
		description: 'Designer wall clocks that keep time in style.',
		displayOrder: 2
	},
	{
		name: 'Acrylic Calligraphy',
		slug: 'acrylic-calligraphy',
		description: 'Arabic and Islamic calligraphy crafted in luxury acrylic.',
		displayOrder: 3
	},
	{
		name: 'Islamic Art Decor',
		slug: 'islamic-art-decor',
		description: 'Verses, prayers and spiritual art for a serene home.',
		displayOrder: 4
	}
];

// The Type column is the reliable signal (wallart / wallclock); tags are noisy and
// cross-match badly, so the themed collections are matched on the title alone.
const collectionsFor = (title, type) => {
	const name = title.toLowerCase();
	const productType = (type || '').trim().toLowerCase();
	const slugs = new Set();

	const isClock = productType ? productType.includes('clock') : name.includes('clock');
	slugs.add(isClock ? 'modern-wall-clocks' : 'wooden-wall-art');

	if (name.includes('calligraphy')) slugs.add('acrylic-calligraphy');
	if (
		/islamic|arabic|quran|surah|allah|ayat|kalma|bismillah|tasbeehat|asma ul husna|sabr|dua/.test(
			name
		)
	) {
		slugs.add('islamic-art-decor');
	}

	return [...slugs];
};

async function main() {
	const csvPath = path.resolve(process.argv[2] ?? '../products_export_swapped.csv');
	console.log(`Reading CSV: ${csvPath}`);
	const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'));
	if (rows.length < 2) throw new Error('CSV is empty or invalid.');

	const headers = rows[0];
	const columnIndex = new Map(headers.map((h, i) => [h, i]));
	const getVal = (row, columnName) => {
		const idx = columnIndex.get(columnName);
		return idx === undefined ? '' : (row[idx] ?? '');
	};

	const productsMap = new Map();
	for (let i = 1; i < rows.length; i++) {
		const handle = getVal(rows[i], 'Handle').trim();
		if (!handle) continue;
		if (!productsMap.has(handle)) productsMap.set(handle, []);
		productsMap.get(handle).push(rows[i]);
	}
	console.log(`${rows.length - 1} data rows -> ${productsMap.size} unique products.`);

	console.log('Setting up collections...');
	for (const col of COLLECTIONS) {
		await prisma.collection.upsert({
			where: { slug: col.slug },
			update: { name: col.name, description: col.description, displayOrder: col.displayOrder },
			create: col
		});
	}

	// Replace the catalog. Cascades clear variants, images, reviews and section
	// placements. OrderItem.productId is SET NULL, so order history survives.
	const removed = await prisma.product.deleteMany({});
	if (removed.count) console.log(`Removed ${removed.count} pre-existing products.`);

	const usedSkus = new Set();
	const uniqueSku = (base) => {
		const clean = base
			.toUpperCase()
			.replace(/[^A-Z0-9-]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
		let sku = clean;
		let n = 2;
		while (usedSkus.has(sku)) sku = `${clean}-${n++}`;
		usedSkus.add(sku);
		return sku;
	};

	let productCount = 0;
	let variantCount = 0;
	let imageCount = 0;
	let inactiveCount = 0;

	for (const [handle, productRows] of productsMap) {
		const mainRow = productRows[0];
		const title = getVal(mainRow, 'Title').trim() || handle;
		const type = getVal(mainRow, 'Type');

		const listedPrice = parseFloat(getVal(mainRow, 'Variant Price')) || 0;
		const compareAt = parseFloat(getVal(mainRow, 'Variant Compare At Price')) || 0;
		// Shopify's compare-at is the pre-discount price, so it becomes our list price.
		const price = compareAt > listedPrice ? compareAt : listedPrice;
		const salePrice = compareAt > listedPrice ? listedPrice : null;

		const isActive = getVal(mainRow, 'Status').trim().toLowerCase() === 'active';
		if (!isActive) inactiveCount++;

		const slugs = collectionsFor(title, type);

		const product = await prisma.product.create({
			data: {
				name: title,
				slug: handle,
				description: stripHtml(getVal(mainRow, 'Body (HTML)')),
				price,
				salePrice,
				isActive,
				metaTitle: getVal(mainRow, 'SEO Title').trim() || null,
				metaDescription: getVal(mainRow, 'SEO Description').trim() || null,
				collections: { connect: slugs.map((slug) => ({ slug })) }
			}
		});

		const role1 = optionRole(getVal(mainRow, 'Option1 Name'));
		const role2 = optionRole(getVal(mainRow, 'Option2 Name'));

		const variants = [];
		const seenVariants = new Set();
		const images = [];
		const seenImages = new Set();

		for (const row of productRows) {
			const value1 = getVal(row, 'Option1 Value').trim();
			const value2 = getVal(row, 'Option2 Value').trim();
			const isPlaceholder = value1.toLowerCase() === 'default title';

			if ((value1 || value2) && !isPlaceholder) {
				const pick = (role) => {
					if (role1 === role && value1) return value1;
					if (role2 === role && value2) return value2;
					return '';
				};
				const color = titleCase(pick('color')) || 'Default';
				const size = pick('size').trim() || 'Default';
				const key = `${color}|${size}`.toLowerCase();

				if (!seenVariants.has(key)) {
					seenVariants.add(key);
					const qty = parseInt(getVal(row, 'Variant Inventory Qty'), 10);
					variants.push({
						color,
						size,
						stockCount: Number.isFinite(qty) && qty > 0 ? qty : 10,
						sku: uniqueSku(getVal(row, 'Variant SKU').trim() || `ZY-${handle}-${color}-${size}`)
					});
				}
			}

			const imageSrc = getVal(row, 'Image Src').trim();
			if (imageSrc && !seenImages.has(imageSrc)) {
				seenImages.add(imageSrc);
				const position = parseInt(getVal(row, 'Image Position'), 10);
				images.push({
					url: imageSrc, // stored verbatim — no Cloudinary upload
					altText: getVal(row, 'Image Alt Text').trim() || title,
					displayOrder: Number.isFinite(position) ? position : images.length + 1
				});
			}
		}

		if (variants.length === 0) {
			variants.push({
				color: 'Default',
				size: 'Default',
				stockCount: 10,
				sku: uniqueSku(`ZY-${handle}-DEFAULT`)
			});
		}

		await prisma.productVariant.createMany({
			data: variants.map((v) => ({ ...v, productId: product.id }))
		});
		if (images.length) {
			await prisma.productImage.createMany({
				data: images.map((img) => ({ ...img, productId: product.id }))
			});
		}

		variantCount += variants.length;
		imageCount += images.length;
		productCount++;
		console.log(
			`[${productCount}/${productsMap.size}] ${title} — ${variants.length}v ${images.length}img ${isActive ? '' : '(inactive) '}-> ${slugs.join(', ')}`
		);
	}

	console.log('\n--- Summary ---');
	console.log(`Products:   ${productCount} (${inactiveCount} inactive from Status=unlisted)`);
	console.log(`Variants:   ${variantCount}`);
	console.log(`Images:     ${imageCount} (all stored as source URLs, no Cloudinary upload)`);
	console.log(`Collections: ${COLLECTIONS.length}`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
