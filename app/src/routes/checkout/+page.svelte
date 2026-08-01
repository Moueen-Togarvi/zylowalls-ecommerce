<script lang="ts">
	import { onMount } from 'svelte';
	import { cart } from '$lib/client/cart.svelte';
	import { trackInitiateCheckout } from '$lib/client/pixel';
	import { formatMoney } from '$lib/shared/money';

	type PaymentMethod = 'COD';
	type ShippingMethod = 'STANDARD' | 'EXPRESS';

	let { form } = $props();

	let checkoutError = $state('');
	let email = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let addressLine1 = $state('');
	let city = $state('');
	let postalCode = $state('');
	let phone = $state('');
	let shippingMethod = $state<ShippingMethod>('STANDARD');
	let paymentMethod = $state<PaymentMethod>('COD');
	let submitting = $state(false);

	const standardShipping = 200;
	const expressShipping = 1200;
	const cartJson = $derived(JSON.stringify(cart.items));
	const shippingTotal = $derived(shippingMethod === 'EXPRESS' ? expressShipping : standardShipping);
	const orderTotal = $derived(cart.subtotal + shippingTotal);

	const validateDetails = () => {
		if (
			!firstName.trim() ||
			!lastName.trim() ||
			!phone.trim() ||
			!addressLine1.trim() ||
			!city.trim()
		) {
			checkoutError = 'Please fill your name, mobile number, address, and city to continue.';
			return false;
		}

		checkoutError = '';
		return true;
	};

	const handlePlaceOrder = (event: SubmitEvent) => {
		if (!validateDetails()) {
			event.preventDefault();
			return;
		}

		submitting = true;
	};

	onMount(() => {
		if (cart.items.length === 0) return;
		trackInitiateCheckout(
			cart.items.map((item) => ({
				id: item.productId,
				name: item.name,
				price: item.price,
				quantity: item.quantity
			})),
			cart.subtotal
		);
	});
</script>

<svelte:head>
	<title>Checkout | Zylowalls</title>
</svelte:head>

<div class="min-h-screen bg-cream">
	<header class="border-b border-gray-200 py-4 sm:py-6">
		<div class="mx-auto flex max-w-4xl justify-center px-4">
			<a href="/" class="font-serif text-xl tracking-widest uppercase sm:text-2xl">Zylowalls</a>
		</div>
	</header>

	<div class="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-6 sm:py-10 md:flex-row md:gap-12">
		<div class="w-full md:w-3/5">
			<nav
				class="mb-6 flex items-center gap-2 text-xs font-medium tracking-widest uppercase sm:mb-8"
			>
				<a href="/cart" class="text-gray-400 hover:text-black">Cart</a>
				<span class="text-gray-300">/</span>
				<span class="text-black">Checkout</span>
			</nav>

			{#if form?.error || checkoutError}
				<div class="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{form?.error || checkoutError}
				</div>
			{/if}

			<form method="POST" action="?/placeOrder" onsubmit={handlePlaceOrder}>
				<input type="hidden" name="cartJson" value={cartJson} />
				<input type="hidden" name="email" value={email} />
				<input type="hidden" name="firstName" value={firstName} />
				<input type="hidden" name="lastName" value={lastName} />
				<input type="hidden" name="addressLine1" value={addressLine1} />
				<input type="hidden" name="city" value={city} />
				<input type="hidden" name="postalCode" value={postalCode} />
				<input type="hidden" name="phone" value={phone} />
				<input type="hidden" name="shippingMethod" value={shippingMethod} />
				<input type="hidden" name="paymentMethod" value={paymentMethod} />

				<div class="space-y-8">
					<section>
						<h2 class="mb-1 font-serif text-lg sm:text-xl">Contact &amp; Shipping Address</h2>
						<p class="mb-6 text-sm font-light text-gray-500">Where should we deliver your order?</p>

						<div class="mb-5">
							<label
								for="checkout-email"
								class="mb-1.5 block text-xs font-bold tracking-[0.08em] text-gray-700 uppercase"
							>
								Email <span class="text-gray-400 normal-case">(optional)</span>
							</label>
							<input
								id="checkout-email"
								type="email"
								placeholder="you@example.com"
								bind:value={email}
								autocomplete="email"
								inputmode="email"
								class="w-full rounded border border-gray-300 p-3.5 text-base focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
							/>
						</div>

						<div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label
									for="checkout-first-name"
									class="mb-1.5 block text-xs font-bold tracking-[0.08em] text-gray-700 uppercase"
								>
									First name <span class="text-red-600">*</span>
								</label>
								<input
									id="checkout-first-name"
									type="text"
									placeholder="First name"
									bind:value={firstName}
									required
									autocomplete="given-name"
									class="w-full rounded border border-gray-300 p-3.5 text-base focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
								/>
							</div>
							<div>
								<label
									for="checkout-last-name"
									class="mb-1.5 block text-xs font-bold tracking-[0.08em] text-gray-700 uppercase"
								>
									Last name <span class="text-red-600">*</span>
								</label>
								<input
									id="checkout-last-name"
									type="text"
									placeholder="Last name"
									bind:value={lastName}
									required
									autocomplete="family-name"
									class="w-full rounded border border-gray-300 p-3.5 text-base focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
								/>
							</div>
						</div>

						<div class="mb-5">
							<label
								for="checkout-phone"
								class="mb-1.5 block text-xs font-bold tracking-[0.08em] text-gray-700 uppercase"
							>
								Mobile number <span class="text-red-600">*</span>
							</label>
							<input
								id="checkout-phone"
								type="tel"
								placeholder="03XX-XXXXXXX"
								bind:value={phone}
								required
								autocomplete="tel"
								inputmode="tel"
								class="w-full rounded border border-gray-300 p-3.5 text-base focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
							/>
						</div>

						<div class="mb-5">
							<label
								for="checkout-address"
								class="mb-1.5 block text-xs font-bold tracking-[0.08em] text-gray-700 uppercase"
							>
								Address <span class="text-red-600">*</span>
							</label>
							<input
								id="checkout-address"
								type="text"
								placeholder="House, street, area"
								bind:value={addressLine1}
								required
								autocomplete="address-line1"
								class="w-full rounded border border-gray-300 p-3.5 text-base focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
							/>
						</div>

						<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label
									for="checkout-city"
									class="mb-1.5 block text-xs font-bold tracking-[0.08em] text-gray-700 uppercase"
								>
									City <span class="text-red-600">*</span>
								</label>
								<input
									id="checkout-city"
									type="text"
									placeholder="City"
									bind:value={city}
									required
									autocomplete="address-level2"
									class="w-full rounded border border-gray-300 p-3.5 text-base focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
								/>
							</div>
							<div>
								<label
									for="checkout-postal-code"
									class="mb-1.5 block text-xs font-bold tracking-[0.08em] text-gray-700 uppercase"
								>
									Postal code <span class="text-gray-400 normal-case">(optional)</span>
								</label>
								<input
									id="checkout-postal-code"
									type="text"
									placeholder="Postal code"
									bind:value={postalCode}
									autocomplete="postal-code"
									inputmode="numeric"
									class="w-full rounded border border-gray-300 p-3.5 text-base focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
								/>
							</div>
						</div>
					</section>

					<section>
						<h2 class="mb-4 font-serif text-lg sm:text-xl">Shipping Method</h2>
						<div
							class="divide-y divide-gray-100 overflow-hidden rounded border border-gray-200 bg-white"
						>
							<label
								class="flex cursor-pointer items-center justify-between gap-3 p-4 hover:bg-gray-50"
							>
								<div class="flex items-center gap-3">
									<input
										type="radio"
										bind:group={shippingMethod}
										value="STANDARD"
										class="h-4 w-4 shrink-0 border-gray-300 text-black focus:ring-black"
									/>
									<span class="text-sm"
										>Standard Shipping <span class="text-gray-400">(5-7 days)</span></span
									>
								</div>
								<span class="shrink-0 text-sm font-medium">{formatMoney(standardShipping)}</span>
							</label>
							<label
								class="flex cursor-pointer items-center justify-between gap-3 p-4 hover:bg-gray-50"
							>
								<div class="flex items-center gap-3">
									<input
										type="radio"
										bind:group={shippingMethod}
										value="EXPRESS"
										class="h-4 w-4 shrink-0 border-gray-300 text-black focus:ring-black"
									/>
									<span class="text-sm"
										>Express Shipping <span class="text-gray-400">(1-2 days)</span></span
									>
								</div>
								<span class="shrink-0 text-sm font-medium">{formatMoney(expressShipping)}</span>
							</label>
						</div>
					</section>

					<section>
						<h2 class="mb-1 font-serif text-lg sm:text-xl">Payment</h2>
						<p class="mb-4 text-sm font-light text-gray-500">
							All transactions are secure and encrypted.
						</p>

						<div class="overflow-hidden rounded border border-gray-200 bg-white">
							<label class="flex cursor-pointer items-center justify-between gap-3 bg-gray-50 p-4">
								<div class="flex items-center gap-3">
									<input
										type="radio"
										name="paymentMethodChoice"
										value="COD"
										bind:group={paymentMethod}
										class="h-4 w-4 shrink-0 border-gray-300 text-black focus:ring-black"
									/>
									<span class="text-sm font-medium">Cash on Delivery (COD)</span>
								</div>
							</label>

							<div class="border-t border-gray-100">
								<label
									class="flex cursor-not-allowed items-center justify-between gap-3 p-4 opacity-55"
								>
									<div class="flex items-center gap-3">
										<input
											type="radio"
											value="JAZZCASH"
											disabled
											class="h-4 w-4 shrink-0 border-gray-300 text-black focus:ring-black"
										/>
										<span class="text-sm font-medium">JazzCash</span>
									</div>
									<div
										class="shrink-0 rounded-sm bg-gray-200 px-2 py-1 text-xs font-bold text-gray-600"
									>
										Coming soon
									</div>
								</label>
							</div>

							<div
								class="border-t border-gray-100 bg-white p-4 text-center text-sm font-light text-gray-500"
							>
								Pay with cash upon delivery.
							</div>
						</div>
					</section>

					<div
						class="flex flex-col-reverse items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
					>
						<a
							href="/cart"
							class="flex items-center justify-center text-sm text-gray-500 hover:text-black sm:justify-start"
						>
							<svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							Return to cart
						</a>
						<button
							type="submit"
							disabled={cart.items.length === 0 || submitting}
							class="w-full bg-black px-8 py-4 text-sm tracking-widest text-white uppercase transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
						>
							{submitting ? 'Placing order…' : 'Complete order'}
						</button>
					</div>
				</div>
			</form>
		</div>

		<div class="w-full border-gray-200 md:w-2/5 md:border-l md:pl-10">
			<details class="mb-4 md:hidden" open>
				<summary
					class="flex cursor-pointer items-center justify-between border-y border-gray-200 py-3 text-sm font-medium tracking-widest uppercase"
				>
					<span>Order summary</span>
					<span class="font-serif text-base tracking-normal normal-case"
						>{formatMoney(orderTotal)}</span
					>
				</summary>

				<div class="pt-4">
					{#if cart.items.length === 0}
						<div class="mb-4 rounded border border-gray-200 p-4 text-sm text-gray-500">
							Your bag is empty. Add a product before checkout.
						</div>
					{:else}
						{#each cart.items as item}
							<div class="mb-4 flex items-center">
								<div class="relative h-14 w-14 flex-shrink-0 border border-gray-200 bg-gray-100">
									<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
									<span
										class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-[10px] text-white"
									>
										{item.quantity}
									</span>
								</div>
								<div class="ml-3 min-w-0 flex-grow">
									<h4 class="truncate font-serif text-sm">{item.name}</h4>
									<p class="text-xs font-light text-gray-500">
										{[item.color, item.size].filter(Boolean).join(' / ')}
									</p>
								</div>
								<span class="ml-3 shrink-0 text-right text-sm font-medium"
									>{formatMoney(item.price * item.quantity)}</span
								>
							</div>
						{/each}
					{/if}

					<div class="space-y-2 border-t border-gray-200 pt-4 text-sm font-light">
						<div class="flex justify-between">
							<span class="text-gray-600">Subtotal</span>
							<span class="font-medium text-black">{formatMoney(cart.subtotal)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Shipping</span>
							<span class="text-black">{formatMoney(shippingTotal)}</span>
						</div>
					</div>
				</div>
			</details>

			<div class="hidden md:block">
				{#if cart.items.length === 0}
					<div class="mb-6 rounded border border-gray-200 p-4 text-sm text-gray-500">
						Your bag is empty. Add a product before checkout.
					</div>
				{:else}
					{#each cart.items as item}
						<div class="mb-6 flex items-center">
							<div class="relative h-16 w-16 flex-shrink-0 border border-gray-200 bg-gray-100">
								<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
								<span
									class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-[10px] text-white"
								>
									{item.quantity}
								</span>
							</div>
							<div class="ml-4 min-w-0 flex-grow">
								<h4 class="truncate font-serif text-sm">{item.name}</h4>
								<p class="text-xs font-light text-gray-500">
									{[item.color, item.size].filter(Boolean).join(' / ')}
								</p>
							</div>
							<span class="ml-4 shrink-0 text-right text-sm font-medium"
								>{formatMoney(item.price * item.quantity)}</span
							>
						</div>
					{/each}
				{/if}

				<div class="mb-6 space-y-3 border-b border-gray-200 pb-4 text-sm font-light">
					<div class="flex justify-between">
						<span class="text-gray-600">Subtotal</span>
						<span class="font-medium text-black">{formatMoney(cart.subtotal)}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Shipping</span>
						<span class="text-xs text-gray-500">{formatMoney(shippingTotal)}</span>
					</div>
				</div>

				<div class="flex items-end justify-between">
					<span class="text-base font-medium tracking-widest text-black uppercase">Total</span>
					<div class="flex items-center">
						<span class="mr-2 text-xs text-gray-500">PKR</span>
						<span class="font-serif text-2xl text-black">{formatMoney(orderTotal)}</span>
					</div>
				</div>
			</div>

			<div class="mt-4 flex items-end justify-between border-t border-gray-200 pt-4 md:hidden">
				<span class="text-sm font-medium tracking-widest text-black uppercase">Total</span>
				<div class="flex items-center">
					<span class="mr-2 text-xs text-gray-500">PKR</span>
					<span class="font-serif text-xl text-black">{formatMoney(orderTotal)}</span>
				</div>
			</div>
		</div>
	</div>
</div>
