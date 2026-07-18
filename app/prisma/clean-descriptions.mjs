import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function stripHtml(html) {
	if (!html) return '';
	// Replace block elements tags with newlines to preserve spacing
	let text = html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n\n')
		.replace(/<\/div>/gi, '\n')
		.replace(/<\/li>/gi, '\n')
		.replace(/<\/h[1-6]>/gi, '\n\n');
	
	// Strip all remaining HTML tags
	text = text.replace(/<[^>]*>/g, '');
	
	// Decode common HTML entities
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
	
	// Clean up multiple consecutive newlines and leading/trailing spaces
	text = text
		.split('\n')
		.map(line => line.trim())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
		
	return text;
}

async function main() {
	console.log('Fetching all products from database...');
	const products = await prisma.product.findMany({
		select: {
			id: true,
			name: true,
			description: true
		}
	});

	console.log(`Found ${products.length} products. Starting cleanup...`);
	let updatedCount = 0;

	for (const product of products) {
		const originalDesc = product.description;
		const cleanedDesc = stripHtml(originalDesc);

		if (originalDesc !== cleanedDesc) {
			console.log(`Cleaning description for product: "${product.name}"`);
			await prisma.product.update({
				where: { id: product.id },
				data: { description: cleanedDesc }
			});
			updatedCount++;
		}
	}

	console.log(`Cleanup complete! Updated ${updatedCount} products.`);
}

main()
	.catch(e => {
		console.error('Error during database cleanup:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
