import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
	const email = 'admin@zylowalls.com';
	const adminPassword = 'Zylowalls-Admin!';
	
	const salt = crypto.randomBytes(16).toString('base64url');
	const hash = crypto.scryptSync(adminPassword, salt, 64).toString('base64url');
	const passwordHash = `scrypt$${salt}$${hash}`;
	
	await prisma.user.upsert({
		where: { email },
		update: { passwordHash },
		create: {
			email,
			passwordHash,
			firstName: 'Zylowalls',
			lastName: 'Admin',
			role: 'SUPER_ADMIN',
			isBlocked: false
		}
	});
	
	console.log(`Admin password reset successfully!`);
	console.log(`Email: ${email}`);
	console.log(`Password: ${adminPassword}`);
}

main()
	.catch(console.error)
	.finally(async () => {
		await prisma.$disconnect();
	});
