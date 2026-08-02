/**
 * Deliberately permissive email check — it only rejects input that clearly
 * cannot be delivered to. Shared by the checkout form and the checkout action
 * so both sides agree on what counts as a valid address.
 */
export const isValidEmail = (value: unknown) => {
	const email = String(value ?? '').trim();
	if (email.length < 5 || email.length > 254) return false;
	if (/\s/.test(email)) return false;

	return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(email);
};
