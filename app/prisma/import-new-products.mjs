import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

const SOURCE_DIR = '/home/moueen-togarvi/code/voquarn clients/zylowalls-ecommerce/new prdicts';
const TARGET_DIR = './static/new-products';

const newProductList = [
	{ file: "IMG-20260718-WA0014.jpg.jpeg", name: "Bismillah Leaf – 3D Acrylic Calligraphy", price: 1499, desc: "A gorgeous 3D acrylic calligraphy piece featuring the Bismillah in a leaf shape, bringing a blend of spirituality and nature into your home.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0018.jpg.jpeg", name: "Ayat-ul-Kursi Royal – Circle Acrylic Art", price: 2149, desc: "A majestic circular wall hanging displaying the sacred Ayat-ul-Kursi. Crafted from high-gloss premium acrylic for a modern, reflective finish.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0021.jpg.jpeg", name: "HexaGrid – Geometric Wood Wall Panels", price: 2899, desc: "Sleek and modern geometric laser-cut wood wall panels. Perfect as an accent piece in living rooms, bedrooms, or offices.", categoryNames: ["Wooden Wall Art", "3D Wall Panels", "Geometric Wall Accents"] },
	{ file: "IMG-20260718-WA0023.jpg.jpeg", name: "Kalma Tayyaba – Elegant Arch Frame", price: 1899, desc: "An elegantly shaped arch frame highlighting the Kalma Tayyaba. Blends traditional Islamic styling with contemporary materials.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0024.jpg.jpeg", name: "Flora Panel – Modern Decorative Wall Panels", price: 2699, desc: "Add a touch of organic geometry to your walls. This detailed floral design is laser-cut from high-grade wood panels.", categoryNames: ["Wooden Wall Art", "3D Wall Panels"] },
	{ file: "IMG-20260718-WA0025.jpg.jpeg", name: "Mashallah – Floating Acrylic Script", price: 1399, desc: "A beautifully cut floating script wall art displaying 'Mashallah'. Ideal for entrances, living rooms, and gifting.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0026.jpg.jpeg", name: "Dua-e-Safar – Luxury Travel Calligraphy", price: 1599, desc: "A perfect reminder for travel, showing the Dua-e-Safar in stylized script. Made from high-quality acrylic with gold finishes.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0031.jpg.jpeg", name: "Abstract Mandala – Laser-Cut Wooden Art", price: 2399, desc: "A stunningly detailed abstract Mandala wood art piece. Precision laser cut to bring intricate shadows and depth to your walls.", categoryNames: ["Wooden Wall Art", "Geometric Wall Accents"] },
	{ file: "IMG-20260718-WA0032.jpg.jpeg", name: "Asma-ul-Husna – Premium Gold Calligraphy", price: 2499, desc: "A breathtaking display of the beautiful names of Allah. Precision-crafted in high-end gold-finish acrylic sheets.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0036.jpg.jpeg", name: "Lotus Flower – Geometric Wooden Wall Decor", price: 1799, desc: "The lotus flower symbolized in geometric wood art. Brings clean lines, peaceful vibes, and modern style to any interior.", categoryNames: ["Wooden Wall Art", "Geometric Wall Accents"] },
	{ file: "IMG-20260718-WA0038.jpg.jpeg", name: "Ayt-ul-Kursi Minimalist – Wooden Panel", price: 1999, desc: "A clean, minimalist representation of Ayat-ul-Kursi on a solid wooden panel. Combines natural wood texture with modern typography.", categoryNames: ["Wooden Wall Art", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0041.jpg.jpeg", name: "Dua – Heartfelt Acrylic Calligraphy", price: 1299, desc: "A gorgeous script expressing personal prayer ('Dua'). A beautiful, subtle accent piece for any small wall or corner.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0043.jpg.jpeg", name: "Star Burst – Geometric Wood Wall Hanging", price: 2199, desc: "An eye-catching geometric starburst pattern. Hand-finished wood art that plays with shadow and light.", categoryNames: ["Wooden Wall Art", "Geometric Wall Accents"] },
	{ file: "IMG-20260718-WA0045.jpg.jpeg", name: "Alhamdulillah – Modern Script Calligraphy", price: 1499, desc: "A premium acrylic calligraphy script of 'Alhamdulillah'. High gloss black or gold, ideal for a modern kitchen or lounge.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0046.jpg.jpeg", name: "Islamic Emblem – Circular Acrylic Decor", price: 1699, desc: "A circular geometric emblem featuring Islamic motifs. Precision laser-cut to add a subtle religious accent.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0049.jpg.jpeg", name: "Geometric Lines – 3D Accent Wall Panel", price: 2799, desc: "Transform your space with these 3D intersecting geometric panels. Perfect for making any plain wall look architectural.", categoryNames: ["Wooden Wall Art", "3D Wall Panels", "Geometric Wall Accents"] },
	{ file: "IMG-20260718-WA0052.jpg.jpeg", name: "Surah Ikhlas – Divine Acrylic Art", price: 2099, desc: "A gorgeous representation of Surah Ikhlas in modern kufic script. Adds a stunning focal point to prayer areas or main halls.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] },
	{ file: "IMG-20260718-WA0058.jpg.jpeg", name: "Majestic Rose – Wood Laser Cut Art", price: 1899, desc: "A rose design transformed into a geometric wooden masterpiece. Adds natural, botanical warmth to your bedroom walls.", categoryNames: ["Wooden Wall Art", "Geometric Wall Accents"] },
	{ file: "IMG-20260718-WA0059.jpg.jpeg", name: "Praise Set – Modern Islamic Script Trio", price: 2599, desc: "A set of three panels displaying Subhanallah, Alhamdulillah, and Allahu Akbar. Elegant layout for a main living wall.", categoryNames: ["Acrylic Calligraphy", "Islamic Art Decor"] }
];

function toSlug(name) {
	return name.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

async function main() {
	console.log('--- Starting Import of New Products & Collections ---');

	// 1. Ensure Target Directory Exists
	if (!fs.existsSync(TARGET_DIR)) {
		console.log(`Creating directory ${TARGET_DIR}`);
		fs.mkdirSync(TARGET_DIR, { recursive: true });
	}

	// 2. Copy Files
	console.log('Copying images...');
	for (const prod of newProductList) {
		const srcFile = path.join(SOURCE_DIR, prod.file);
		const destFile = path.join(TARGET_DIR, prod.file);
		if (fs.existsSync(srcFile)) {
			fs.copyFileSync(srcFile, destFile);
			console.log(`Copied ${prod.file} successfully.`);
		} else {
			console.warn(`Warning: Source file not found: ${srcFile}`);
		}
	}

	// 3. Create / Update the Collections (Categories)
	// We want 6 categories total: 3 existing + 3 new.
	const collectionsToCreate = [
		{
			name: 'Modern Wall Clocks',
			slug: 'modern-wall-clocks',
			description: 'Designer 3D wooden and acrylic clocks to keep time in style.',
			imageUrl: 'https://cdn.shopify.com/s/files/1/0964/6787/8183/files/Untitleddesign-2026-04-28T102338.863.jpg?v=1777350303'
		},
		{
			name: 'Islamic Art Decor',
			slug: 'islamic-art-decor',
			description: 'Beautiful verses and prayers crafted in luxury acrylic.',
			imageUrl: '/new-products/IMG-20260718-WA0032.jpg.jpeg'
		},
		{
			name: 'Geometric Wall Accents',
			slug: 'geometric-wall-accents',
			description: 'Sleek, modern geometric patterns and symbols for contemporary rooms.',
			imageUrl: '/new-products/IMG-20260718-WA0043.jpg.jpeg'
		}
	];

	console.log('Setting up collections (categories)...');
	for (const col of collectionsToCreate) {
		await prisma.collection.upsert({
			where: { slug: col.slug },
			update: {
				name: col.name,
				description: col.description,
				imageUrl: col.imageUrl
			},
			create: {
				name: col.name,
				slug: col.slug,
				description: col.description,
				imageUrl: col.imageUrl
			}
		});
	}

	// Update existing 3 collections with category images as well
	const existingCollectionUpdates = [
		{ slug: 'acrylic-calligraphy', imageUrl: '/new-products/IMG-20260718-WA0014.jpg.jpeg' },
		{ slug: 'wooden-wall-art', imageUrl: '/new-products/IMG-20260718-WA0031.jpg.jpeg' },
		{ slug: '3d-wall-panels', imageUrl: '/new-products/IMG-20260718-WA0021.jpg.jpeg' }
	];

	for (const col of existingCollectionUpdates) {
		// Find by slug first to make sure it exists
		const found = await prisma.collection.findUnique({ where: { slug: col.slug } });
		if (found) {
			await prisma.collection.update({
				where: { slug: col.slug },
				data: { imageUrl: col.imageUrl }
			});
			console.log(`Updated imageUrl for collection: ${col.slug}`);
		}
	}

	// Fetch all collections to easily map by Name
	const allCollections = await prisma.collection.findMany();
	const collectionMap = new Map(allCollections.map(c => [c.name, c]));

	// 4. Create New Products
	console.log('Inserting new products...');
	let count = 0;
	for (const prod of newProductList) {
		const baseSlug = toSlug(prod.name);
		// Check if product already exists by slug prefix to avoid duplicate seeding issues
		const existingProduct = await prisma.product.findFirst({
			where: { slug: { startsWith: baseSlug } }
		});

		if (existingProduct) {
			console.log(`Product already exists: ${prod.name}. Skipping.`);
			continue;
		}

		// Map category names to actual collection IDs
		const connectIds = prod.categoryNames
			.map(name => collectionMap.get(name)?.id)
			.filter(Boolean);

		const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
		const sku = `ZY-NEW-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

		await prisma.product.create({
			data: {
				name: prod.name,
				slug: slug,
				description: prod.desc,
				price: prod.price,
				isActive: true,
				collections: {
					connect: connectIds.map(id => ({ id }))
				},
				images: {
					create: [
						{
							url: `/new-products/${prod.file}`,
							altText: prod.name,
							displayOrder: 0
						}
					]
				},
				variants: {
					create: [
						{
							color: 'Default',
							size: 'Standard',
							stockCount: 15,
							sku: sku
						}
					]
				}
			}
		});

		console.log(`Successfully added product: ${prod.name}`);
		count++;
	}

	console.log(`--- Finished! Imported ${count} new products successfully. ---`);
}

main()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
