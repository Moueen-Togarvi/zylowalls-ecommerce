import { getShippingRates } from '$lib/server/store-settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	shippingRates: await getShippingRates()
});
