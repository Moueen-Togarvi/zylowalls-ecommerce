import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

const image = (path) => path.replaceAll(' ', '%20');

const hashPassword = (password) => {
	const salt = randomBytes(16).toString('base64url');
	const hash = scryptSync(password, salt, 64).toString('base64url');
	return `scrypt$${salt}$${hash}`;
};

const adminPassword =
	process.env.ADMIN_SEED_PASSWORD || `Zylowalls-${randomBytes(6).toString('base64url')}`;

const categories = [
	{
		name: 'Acrylic Calligraphy',
		slug: 'acrylic-calligraphy'
	},
	{
		name: 'Wooden Wall Art',
		slug: 'wooden-wall-art'
	},
	{
		name: '3D Wall Panels',
		slug: '3d-wall-panels'
	}
];

const products = [
	{
		name: 'Ayat-ul-Kursi 3D Acrylic Calligraphy',
		slug: 'ayat-ul-kursi-3d-acrylic-calligraphy',
		description:
			'Premium double-layer glossy acrylic Islamic calligraphy. Handcrafted with high precision laser cutting, creating a stunning 3D reflection on your walls. Perfect for living rooms, entrance halls, or gifting.',
		fabricDetails: 'High-gloss acrylic face, sturdy MDF backing, 3D float-mount brackets included.',
		price: '6800',
		salePrice: null,
		images: ['/acrylic_calligraphy.png'],
		collections: ['acrylic-calligraphy'],
		variants: [
			{ color: 'Black & Gold', size: 'Medium (16x16")', sku: 'ZY-AYAT-BG-M', stockCount: 15 },
			{ color: 'Black & Gold', size: 'Large (24x24")', sku: 'ZY-AYAT-BG-L', stockCount: 10 }
		]
	},
	{
		name: 'Geometric Floral Wooden Panel Set',
		slug: 'geometric-floral-wooden-panel-set',
		description:
			'Stunning 3-piece laser-cut wood wall panel set. Modern geometric design that adds a rustic yet contemporary charm to any bedroom or dining room wall. Comes ready to hang with pre-applied heavy-duty tape.',
		fabricDetails: '6mm premium MDF engineered wood, matte charcoal finish, 3 panels total.',
		price: '4500',
		salePrice: '3999',
		images: ['/wooden_panels.png'],
		collections: ['wooden-wall-art', '3d-wall-panels'],
		variants: [
			{ color: 'Charcoal Black', size: '3-Piece Set (12x24" each)', sku: 'ZY-GEO-BLK-SET', stockCount: 12 },
			{ color: 'Walnut Brown', size: '3-Piece Set (12x24" each)', sku: 'ZY-GEO-WAL-SET', stockCount: 8 }
		]
	}
];

const reviewPhoto = {
	url: image('/review_walls_decor.png'),
	displayOrder: 0,
	isVisible: true
};

const clearDatabase = async () => {
	await prisma.review.deleteMany();
	await prisma.reviewPhoto.deleteMany();
	await prisma.orderItem.deleteMany();
	await prisma.order.deleteMany();
	await prisma.address.deleteMany();
	await prisma.coupon.deleteMany();
	await prisma.productImage.deleteMany();
	await prisma.productVariant.deleteMany();
	await prisma.product.deleteMany();
	await prisma.collection.deleteMany();
	await prisma.storeSetting.deleteMany();
	await prisma.user.deleteMany();
};

const seedDatabase = async () => {
	await prisma.collection.createMany({
		data: categories.map((category, index) => ({
			...category,
			description: null,
			imageUrl: null,
			isVisible: true,
			displayOrder: index
		}))
	});

	for (const product of products) {
		await prisma.product.create({
			data: {
				name: product.name,
				slug: product.slug,
				description: product.description,
				fabricDetails: product.fabricDetails,
				price: product.price,
				salePrice: product.salePrice,
				isActive: true,
				images: {
					create: product.images.map((url, index) => ({
						url,
						altText: product.name,
						displayOrder: index
					}))
				},
				variants: {
					create: product.variants
				},
				collections: {
					connect: product.collections.map((slug) => ({ slug }))
				}
			}
		});
	}

	await prisma.reviewPhoto.create({ data: reviewPhoto });

	await prisma.user.create({
		data: {
			email: 'admin@zylowalls.com',
			passwordHash: hashPassword(adminPassword),
			firstName: 'Zylowalls',
			lastName: 'Admin',
			role: 'SUPER_ADMIN',
			isBlocked: false
		}
	});
};

const main = async () => {
	console.log('Cleaning Zylowalls database...');
	await clearDatabase();

	console.log('Seeding minimal production data...');
	await seedDatabase();

	const counts = await Promise.all([
		prisma.collection.count(),
		prisma.product.count(),
		prisma.reviewPhoto.count(),
		prisma.user.count(),
		prisma.order.count()
	]);

	console.log(
		JSON.stringify(
			{
				categories: counts[0],
				products: counts[1],
				reviewPhotos: counts[2],
				users: counts[3],
				orders: counts[4]
			},
			null,
			2
		)
	);
	console.log(`Admin URL: /zylowalls-secure-admin-7k9x2p/login`);
	console.log(`Admin email: admin@zylowalls.com`);
	console.log(`Admin password: ${adminPassword}`);
};

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
