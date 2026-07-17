import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
					i++; // skip next quote
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
				if (row.length > 1 || row[0] !== '') {
					result.push(row);
				}
				row = [];
				if (char === '\r' && nextChar === '\n') {
					i++; // skip next char
				}
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

const getCollections = (title, tagsStr) => {
	const titleLower = title.toLowerCase();
	const tagsLower = (tagsStr || '').toLowerCase();
	const collections = [];
	
	if (titleLower.includes('calligraphy') || titleLower.includes('acrylic') || tagsLower.includes('calligraphy') || tagsLower.includes('acrylic')) {
		collections.push('acrylic-calligraphy');
	}
	if (titleLower.includes('wood') || titleLower.includes('wooden') || tagsLower.includes('wood') || tagsLower.includes('wooden') || tagsLower.includes('panel')) {
		collections.push('wooden-wall-art');
	}
	if (titleLower.includes('panel') || tagsLower.includes('panel') || titleLower.includes('3d') || tagsLower.includes('3d')) {
		collections.push('3d-wall-panels');
	}
	
	// Default to wooden-wall-art if none matched
	if (collections.length === 0) {
		collections.push('wooden-wall-art');
	}
	return collections;
};

async function main() {
	const csvPath = path.resolve('../products_export_swapped.csv');
	console.log(`Reading CSV from ${csvPath}...`);
	const csvText = fs.readFileSync(csvPath, 'utf-8');
	
	console.log('Parsing CSV...');
	const rows = parseCSV(csvText);
	if (rows.length < 2) {
		console.error('CSV is empty or invalid.');
		return;
	}
	
	const headers = rows[0];
	const getVal = (row, columnName) => {
		const idx = headers.indexOf(columnName);
		return idx !== -1 ? row[idx] : '';
	};
	
	console.log(`Found ${rows.length - 1} data rows.`);
	
	// Group rows by Handle
	const productsMap = new Map();
	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];
		const handle = getVal(row, 'Handle');
		if (!handle) continue;
		
		if (!productsMap.has(handle)) {
			productsMap.set(handle, []);
		}
		productsMap.get(handle).push(row);
	}
	
	console.log(`Grouped into ${productsMap.size} unique products.`);
	
	// Track added SKUs to prevent database unique constraints violation
	const addedSkus = new Set();
	let productCounter = 0;
	let variantCounter = 0;
	let imageCounter = 0;

	// Clear existing products and related data (if any) first to avoid duplicate primary key / slug issues
	console.log('Clearing existing products, variants, images, storefront Section Products from database...');
	await prisma.storefrontSectionProduct.deleteMany();
	await prisma.orderItem.deleteMany(); // order items referencing products
	await prisma.review.deleteMany();
	await prisma.productImage.deleteMany();
	await prisma.productVariant.deleteMany();
	await prisma.product.deleteMany();
	
	for (const [handle, productRows] of productsMap.entries()) {
		// First row of product contains core details
		const mainRow = productRows[0];
		const title = getVal(mainRow, 'Title') || handle;
		const bodyHtml = getVal(mainRow, 'Body (HTML)') || '';
		
		const rawPrice = parseFloat(getVal(mainRow, 'Variant Price'));
		const rawComparePrice = parseFloat(getVal(mainRow, 'Variant Compare At Price'));
		let price = rawPrice || 0;
		let salePrice = null;
		if (rawComparePrice && rawComparePrice > rawPrice) {
			price = rawComparePrice;
			salePrice = rawPrice;
		}
		
		const published = getVal(mainRow, 'Published').toLowerCase() === 'true';
		const status = getVal(mainRow, 'Status').toLowerCase();
		const isActive = status === 'active' || published;
		
		const tags = getVal(mainRow, 'Tags');
		
		// Map collections
		const collectionSlugs = getCollections(title, tags);
		
		// Create the product
		const product = await prisma.product.create({
			data: {
				name: title,
				slug: handle,
				description: bodyHtml,
				price: price,
				salePrice: salePrice,
				isActive: isActive,
				collections: {
					connect: collectionSlugs.map(slug => ({ slug }))
				}
			}
		});
		
		productCounter++;
		console.log(`[${productCounter}/${productsMap.size}] Created product: ${title} (${handle}) -> Collections: ${collectionSlugs.join(', ')}`);
		
		// Parse variants and images across all rows for this handle
		const variantsToCreate = [];
		const imagesToCreate = [];
		const seenImages = new Set();
		
		for (const row of productRows) {
			// Check for variant options
			let option1Name = getVal(row, 'Option1 Name');
			let option1Value = getVal(row, 'Option1 Value');
			let option2Name = getVal(row, 'Option2 Name');
			let option2Value = getVal(row, 'Option2 Value');
			
			// If options exist, create a variant
			if (option1Value || option2Value) {
				let color = 'Default';
				let size = 'Default';
				
				const opts = [
					{ name: option1Name, val: option1Value },
					{ name: option2Name, val: option2Value }
				];
				
				for (const opt of opts) {
					const optName = opt.name.toLowerCase();
					if (optName.includes('color') || optName.includes('colour')) {
						color = opt.val || 'Default';
					} else if (optName.includes('size')) {
						size = opt.val || 'Default';
					}
				}
				
				let sku = getVal(row, 'Variant SKU');
				if (!sku) {
					sku = `ZY-${handle.toUpperCase()}-${color.toUpperCase()}-${size.toUpperCase()}`
						.replace(/[^A-Z0-9-]/g, '')
						.replace(/-+/g, '-');
				}
				
				// Ensure SKU is unique
				let finalSku = sku;
				let skuSuffix = 1;
				while (addedSkus.has(finalSku)) {
					finalSku = `${sku}-${skuSuffix}`;
					skuSuffix++;
				}
				addedSkus.add(finalSku);
				
				const vPrice = parseFloat(getVal(row, 'Variant Price')) || price;
				const vQty = parseInt(getVal(row, 'Variant Inventory Qty')) || 10;
				
				variantsToCreate.push({
					color,
					size,
					stockCount: vQty,
					sku: finalSku
				});
			}
			
			// Check for image
			const imageSrc = getVal(row, 'Image Src');
			if (imageSrc && !seenImages.has(imageSrc)) {
				seenImages.add(imageSrc);
				const imgPos = parseInt(getVal(row, 'Image Position')) || (imagesToCreate.length + 1);
				const imgAlt = getVal(row, 'Image Alt Text') || title;
				
				imagesToCreate.push({
					url: imageSrc,
					altText: imgAlt,
					displayOrder: imgPos
				});
			}
		}
		
		// If no variants were defined, create a default variant
		if (variantsToCreate.length === 0) {
			const sku = `ZY-${handle.toUpperCase()}-DEFAULT`
				.replace(/[^A-Z0-9-]/g, '')
				.replace(/-+/g, '-');
			
			let finalSku = sku;
			let skuSuffix = 1;
			while (addedSkus.has(finalSku)) {
				finalSku = `${sku}-${skuSuffix}`;
				skuSuffix++;
			}
			addedSkus.add(finalSku);
			
			variantsToCreate.push({
				color: 'Default',
				size: 'Default',
				stockCount: 10,
				sku: finalSku
			});
		}
		
		// Bulk insert variants and images for this product
		if (variantsToCreate.length > 0) {
			await prisma.productVariant.createMany({
				data: variantsToCreate.map(v => ({
					...v,
					productId: product.id
				}))
			});
			variantCounter += variantsToCreate.length;
		}
		
		if (imagesToCreate.length > 0) {
			await prisma.productImage.createMany({
				data: imagesToCreate.map(img => ({
					...img,
					productId: product.id
				}))
			});
			imageCounter += imagesToCreate.length;
		}
	}
	
	console.log('\n--- Import Summary ---');
	console.log(`- Created ${productCounter} products`);
	console.log(`- Created ${variantCounter} variants`);
	console.log(`- Created ${imageCounter} images`);
	console.log('Seeding admin user...');
	
	const existingAdmin = await prisma.user.findUnique({
		where: { email: 'admin@zylowalls.com' }
	});
	
	if (!existingAdmin) {
		const salt = crypto.randomBytes(16).toString('base64url');
		const adminPassword = `Zylowalls-Admin!`;
		const hash = crypto.scryptSync(adminPassword, salt, 64).toString('base64url');
		const passwordHash = `scrypt$${salt}$${hash}`;
		
		await prisma.user.create({
			data: {
				email: 'admin@zylowalls.com',
				passwordHash: passwordHash,
				firstName: 'Zylowalls',
				lastName: 'Admin',
				role: 'SUPER_ADMIN',
				isBlocked: false
			}
		});
		console.log(`Admin user created successfully:`);
		console.log(`- Email: admin@zylowalls.com`);
		console.log(`- Password: ${adminPassword}`);
	} else {
		console.log('Admin user already exists.');
	}
}

main()
	.catch(e => {
		console.error('Error importing CSV:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
