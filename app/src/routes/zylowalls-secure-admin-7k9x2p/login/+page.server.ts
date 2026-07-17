import {
	ADMIN_SESSION_COOKIE,
	createAdminSessionToken,
	getAdminSessionCookieOptions,
	hashPassword,
	isAdminRole,
	verifyPassword
} from '$lib/server/admin-auth';
import { setAdminFlash } from '$lib/server/admin-flash';
import prisma from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => ({
	redirectTo: url.searchParams.get('redirectTo') || '/zylowalls-secure-admin-7k9x2p'
});

export const actions: Actions = {
	login: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const email = String(data.get('email') || '')
			.trim()
			.toLowerCase();
		const password = String(data.get('password') || '');
		const redirectTo = String(
			data.get('redirectTo') || url.searchParams.get('redirectTo') || '/zylowalls-secure-admin-7k9x2p'
		);

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email, redirectTo });
		}

		const user = await prisma.user.findUnique({ where: { email } });

		console.log('[Login Attempt]', { email, userExists: !!user, role: user?.role, isBlocked: user?.isBlocked });

		if (!user || user.isBlocked || !isAdminRole(user.role)) {
			console.log('[Login Attempt] Admin access denied (user not found, blocked, or not admin)');
			return fail(401, { error: 'Admin access denied.', email, redirectTo });
		}

		if (!user.passwordHash) {
			console.log('[Login Attempt] User has no password hash. Setting it to input password.');
			await prisma.user.update({
				where: { id: user.id },
				data: { passwordHash: hashPassword(password) }
			});
		} else if (!verifyPassword(password, user.passwordHash)) {
			console.log('[Login Attempt] Password verification failed');
			return fail(401, { error: 'Invalid email or password.', email, redirectTo });
		}

		console.log('[Login Attempt] Success');

		cookies.set(
			ADMIN_SESSION_COOKIE,
			createAdminSessionToken({ id: user.id, role: user.role }),
			getAdminSessionCookieOptions()
		);
		setAdminFlash(cookies, 'Logged in successfully.');

		throw redirect(
			303,
			redirectTo.startsWith('/zylowalls-secure-admin-7k9x2p')
				? redirectTo
				: '/zylowalls-secure-admin-7k9x2p'
		);
	}
};
