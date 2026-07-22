<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { cart } from '$lib/client/cart.svelte';
	import WishlistButton from '$lib/components/WishlistButton.svelte';
	import { formatMoney } from '$lib/shared/money';
	import { SITE_NAME, absoluteUrl, jsonLdScript, metaDescription } from '$lib/shared/seo';

	let { data } = $props();
	let product = $derived(data.product as any);
	let relatedProducts = $derived((data.relatedProducts || []) as Array<any>);

	let activeImage = $state(0);
	let quantity = $state(1);
	let activeTab = $state('details');

	const fakeReviews = [
		{ name: 'Fahad hussain', text: 'very good quality.', image: 'https://res.cloudinary.com/dwyge1qce/image/upload/v1/uploads/products/u71a1i4s.jpg?v=1729092470631' },
		{ name: 'Sabeela', title: 'Very good', text: 'Nice clock this is my 3rd order 2 orders was not good but this time this is reqully nice machiner...', image: 'https://res.cloudinary.com/dwyge1qce/image/upload/v1/uploads/products/d12s02v3.jpg?v=1727878841499' },
		{ name: 'Alisha Batool', title: 'Panda lamp', text: 'This is actually very cute and I loved it. Light bhi bht zbrdast', image: 'https://res.cloudinary.com/dwyge1qce/image/upload/v1/uploads/products/g83n7v5s.jpg?v=1727885472851' },
		{ name: 'Hamza Ali', text: 'Excellent product, totally worth the price. Will order again.', image: 'https://res.cloudinary.com/dwyge1qce/image/upload/v1/uploads/products/y58u2m9q.jpg?v=1727878841499' },
		{ name: 'Ayesha Khan', text: 'The finishing is really premium, highly recommended.', image: 'https://res.cloudinary.com/dwyge1qce/image/upload/v1/uploads/products/q27w9b4x.jpg?v=1729092470631' },
		{ name: 'Usman Ghani', text: 'Delivered on time and packaging was great.', image: 'https://res.cloudinary.com/dwyge1qce/image/upload/v1/uploads/products/p41n6k3z.jpg?v=1727885472851' },
		{ name: 'Zara', title: 'Amazing', text: 'Looks beautiful in my living room.', image: 'https://res.cloudinary.com/dwyge1qce/image/upload/v1/uploads/products/l62m1c5d.jpg?v=1729092470631' },
		{ name: 'Bilal', text: 'Good customer service and nice wall art.', image: 'https://res.cloudinary.com/dwyge1qce/image/upload/v1/uploads/products/d12s02v3.jpg?v=1727878841499' }
	];

	let images = $derived(product.images?.map((image: any) => image.url) || []);
	let colors = $derived(
		Array.from(
			new Set<string>(
				(product.variants || [])
					.map((variant: any) => String(variant.color || ''))
					.filter((c: string) => c && c.toLowerCase() !== 'default')
			)
		)
	);
	let selectedColor = $state('');
	let selectedSize = $state('');
	let availableSizes = $derived(
		(product.variants || [])
			.filter((variant: any) => !selectedColor || variant.color === selectedColor)
			.map((variant: any) => variant.size)
			.filter(
				(size: string, index: number, list: string[]) =>
					size && size.toLowerCase() !== 'default' && list.indexOf(size) === index
			)
	);
	let selectedVariant = $derived(
		(product.variants || []).find(
			(variant: any) => variant.color === selectedColor && variant.size === selectedSize
		) || product.variants?.[0]
	);
	let productOutOfStock = $derived(
		!product.variants?.some((variant: any) => Number(variant.stockCount || 0) > 0)
	);
	let selectedVariantOutOfStock = $derived(
		productOutOfStock || !selectedVariant || Number(selectedVariant.stockCount || 0) < quantity
	);
	let productTitle = $derived(product.metaTitle || `${product.name} | ${SITE_NAME}`);
	let productDescription = $derived(
		metaDescription(
			product.metaDescription || product.description,
			`${product.name} by ${SITE_NAME}: premium handcrafted wall art with refined finishing and easy styling.`
		)
	);
	let productUrl = $derived(absoluteUrl(`/shop/${product.slug}`, page.url.origin));
	let productSocialImage = $derived(
		absoluteUrl(images[0] || productImage(product), page.url.origin)
	);
	let productJsonLd = $derived(
		jsonLdScript([
			{
				'@context': 'https://schema.org',
				'@type': 'Product',
				name: product.name,
				description: productDescription,
				image: (images.length ? images : [productImage(product)]).map((image: string) =>
					absoluteUrl(image, page.url.origin)
				),
				sku: selectedVariant?.sku || product.slug,
				brand: {
					'@type': 'Brand',
					name: SITE_NAME
				},
				category: product.collections?.map((collection: any) => collection.name).join(', '),
				offers: {
					'@type': 'Offer',
					url: productUrl,
					priceCurrency: 'PKR',
					price: String(Number(product.salePrice || product.price)),
					availability: productOutOfStock
						? 'https://schema.org/OutOfStock'
						: 'https://schema.org/InStock',
					itemCondition: 'https://schema.org/NewCondition'
				}
			},
			{
				'@context': 'https://schema.org',
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						position: 1,
						name: 'Home',
						item: absoluteUrl('/', page.url.origin)
					},
					{
						'@type': 'ListItem',
						position: 2,
						name: 'Shop',
						item: absoluteUrl('/shop', page.url.origin)
					},
					{
						'@type': 'ListItem',
						position: 3,
						name: product.name,
						item: productUrl
					}
				]
			}
		])
	);

	const colorHex: Record<string, string> = {
		Black: '#101411',
		White: '#ffffff',
		Ivory: '#fff7ed',
		Emerald: '#047857',
		Midnight: '#111827',
		Sage: '#8fa99a',
		Olive: '#64763c',
		Charcoal: '#374151',
		Navy: '#172554'
	};

	function productImage(item: any) {
		return item.images?.[0]?.url || '/image.png';
	}

	$effect(() => {
		if (product.variants?.length) {
			if (!selectedColor) selectedColor = product.variants[0].color || '';
			if (!selectedSize) selectedSize = product.variants[0].size || '';
			if (!availableSizes.includes(selectedSize)) selectedSize = availableSizes[0] || '';
		}
	});

	$effect(() => {
		const stock = Number(selectedVariant?.stockCount || 0);
		if (stock > 0 && quantity > stock) quantity = stock;
		if (quantity < 1) quantity = 1;
	});

	function addToCart() {
		if (selectedVariantOutOfStock) return;

		cart.addItem({
			id: selectedVariant?.id || product.id,
			productId: product.id,
			variantId: selectedVariant?.id,
			name: product.name,
			price: Number(product.salePrice || product.price),
			quantity,
			image: images[0] || '',
			color: selectedColor,
			size: selectedSize
		});
	}

	let countdown = $state({ h: 8, m: 56, s: 47 });

	$effect(() => {
		const interval = setInterval(() => {
			if (countdown.s > 0) {
				countdown.s--;
			} else {
				if (countdown.m > 0) {
					countdown.m--;
					countdown.s = 59;
				} else if (countdown.h > 0) {
					countdown.h--;
					countdown.m = 59;
					countdown.s = 59;
				}
			}
		}, 1000);
		return () => clearInterval(interval);
	});

	function buyNow() {
		if (selectedVariantOutOfStock) return;

		addToCart();
		goto('/checkout');
	}
</script>

<svelte:head>
	<title>{productTitle}</title>
	<meta name="description" content={productDescription} />
	<meta property="og:type" content="product" />
	<meta property="og:title" content={productTitle} />
	<meta property="og:description" content={productDescription} />
	<meta property="og:image" content={productSocialImage} />
	<meta
		property="product:price:amount"
		content={String(Number(product.salePrice || product.price))}
	/>
	<meta property="product:price:currency" content="PKR" />
	<meta name="twitter:title" content={productTitle} />
	<meta name="twitter:description" content={productDescription} />
	{@html productJsonLd}
</svelte:head>

<div class="border-b border-black/5 bg-cream/50">
	<div class="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
		<nav class="flex flex-wrap text-xs tracking-widest text-gray-500 uppercase">
			<a href="/" class="transition-colors hover:text-black">Home</a>
			<span class="mx-2">/</span>
			<a href="/shop" class="transition-colors hover:text-black">Shop</a>
			{#if product.collections?.[0]}
				<span class="mx-2">/</span>
				<a
					href={`/shop?collection=${product.collections[0].slug}`}
					class="transition-colors hover:text-black"
				>
					{product.collections[0].name}
				</a>
			{/if}
			<span class="mx-2">/</span>
			<span class="text-black">{product.name}</span>
		</nav>
	</div>
</div>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<div class="flex flex-col gap-12 lg:flex-row lg:gap-20">
		<div class="flex w-full flex-col-reverse gap-4 lg:w-1/2 lg:flex-row">
			<div
				class="flex flex-shrink-0 gap-4 overflow-x-auto pb-2 lg:w-20 lg:flex-col lg:overflow-visible lg:pb-0"
			>
				{#each images as image, index}
					<button
						type="button"
						class="h-20 w-16 flex-shrink-0 border-2 bg-gray-100 transition-colors lg:h-28 lg:w-20 {activeImage ===
						index
							? 'border-black'
							: 'border-transparent hover:border-gray-300'}"
						aria-label={`View product image ${index + 1}`}
						onclick={() => (activeImage = index)}
					>
						<img
							src={image}
							alt={`${product.name} ${index + 1}`}
							class="h-full w-full object-contain object-center"
						/>
					</button>
				{/each}
			</div>

			<div class="relative aspect-square flex-grow overflow-hidden bg-gray-50 lg:aspect-[4/5]">
				{#if product.salePrice}
					<div
						class="absolute top-4 left-4 z-10 bg-white/90 px-3 py-1.5 text-xs font-bold tracking-widest text-black uppercase backdrop-blur"
					>
						Sale
					</div>
				{/if}
				{#if productOutOfStock}
					<div
						class="absolute top-4 right-4 z-10 bg-red-600 px-3 py-1.5 text-xs font-bold tracking-widest text-white uppercase"
					>
						Out of Stock
					</div>
				{/if}
				<img
					src={images[activeImage] || productImage(product)}
					alt={product.name}
					class="h-full w-full object-cover object-center"
				/>
			</div>
		</div>

		<div class="flex w-full flex-col lg:w-1/2">
			<div class="mb-8">
				<p class="mb-3 text-xs font-bold tracking-[0.18em] text-gold uppercase">
					{product.collections?.map((collection: any) => collection.name).join(' / ') || 'Zylowalls'}
				</p>
				<h1 class="mb-2 font-serif text-3xl tracking-wide text-black md:text-4xl">
					{product.name}
				</h1>
				<div class="mb-4 flex items-center space-x-4">
					<p class="text-2xl font-light text-black">
						{formatMoney(product.salePrice || product.price)}
					</p>
					{#if product.salePrice}
						<p class="text-xl font-light text-red-600 line-through">{formatMoney(product.price)}</p>
					{/if}
				</div>

				<div class="mb-3 flex items-center gap-1 text-[0.95rem] font-medium text-gray-800">
					<svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
					</svg>
					14 sold in last 1 hour
				</div>

				<div class="mb-4 flex max-w-[340px] items-center justify-between rounded-xl bg-[#ef4444] px-4 py-2.5 text-white shadow-sm">
					<span class="text-sm font-semibold tracking-wide">Hurry up! Offer ends in</span>
					<div class="flex items-center gap-1.5 text-center text-sm font-bold">
						<div class="flex flex-col"><span class="text-[1.1rem] leading-none">00</span><span class="text-[0.6rem] font-normal leading-tight">Days</span></div>
						<span class="mb-3 text-lg font-normal">:</span>
						<div class="flex flex-col"><span class="text-[1.1rem] leading-none">{countdown.h.toString().padStart(2, '0')}</span><span class="text-[0.6rem] font-normal leading-tight">Hrs</span></div>
						<span class="mb-3 text-lg font-normal">:</span>
						<div class="flex flex-col"><span class="text-[1.1rem] leading-none">{countdown.m.toString().padStart(2, '0')}</span><span class="text-[0.6rem] font-normal leading-tight">Mins</span></div>
						<span class="mb-3 text-lg font-normal">:</span>
						<div class="flex flex-col"><span class="text-[1.1rem] leading-none">{countdown.s.toString().padStart(2, '0')}</span><span class="text-[0.6rem] font-normal leading-tight">Secs</span></div>
					</div>
				</div>

				<div class="mb-5 flex gap-2">
					<span class="rounded-[4px] bg-[#84cc16] px-3.5 py-1.5 text-[0.8rem] font-medium text-black">Warranty: 1 year</span>
					<span class="rounded-[4px] bg-[#84cc16] px-3.5 py-1.5 text-[0.8rem] font-medium text-black">Size: 16x16 inches</span>
				</div>

				<div class="text-sm leading-relaxed text-gray-700 text-justify">
					{product.description}
				</div>
			</div>

			{#if colors.length > 0}
				<div class="mb-6">
					<div class="mb-3 flex items-end justify-between">
						<span class="text-sm font-medium tracking-widest uppercase">
							Color:
							<span class="ml-1 font-light text-gray-500 normal-case">{selectedColor}</span>
						</span>
					</div>
					<div class="flex flex-wrap gap-3">
						{#each colors as color}
							<button
								type="button"
								onclick={() => (selectedColor = color)}
								class="h-8 w-8 rounded-full border border-gray-200 ring-1 ring-offset-2 transition-all {selectedColor ===
								color
									? 'ring-black'
									: 'ring-transparent hover:ring-gray-300'}"
								style={`background-color: ${colorHex[color] || '#d9d0bd'}`}
								title={color}
								aria-label={`Select ${color}`}
							></button>
						{/each}
					</div>
				</div>
			{/if}

			{#if availableSizes.length > 0}
				<div class="mb-8">
					<div class="mb-3 flex items-end justify-between">
						<span class="text-sm font-medium tracking-widest uppercase">
							Size:
							<span class="ml-1 font-light text-gray-500 normal-case">{selectedSize}</span>
						</span>
						<a
							href="/size-guide"
							class="text-xs text-gray-500 underline transition-colors hover:text-black"
						>
							Size Guide
						</a>
					</div>
					<div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
						{#each availableSizes as size}
							<button
								type="button"
								onclick={() => (selectedSize = size)}
								class="border py-3 text-sm font-medium transition-colors {selectedSize === size
									? 'border-black bg-black text-white'
									: 'border-gray-200 text-black hover:border-black'}"
							>
								{size}
							</button>
						{/each}
					</div>
					{#if selectedVariant}
						<p
							class="mt-2 text-xs font-light {Number(selectedVariant.stockCount || 0) > 0
								? 'text-gray-500'
								: 'text-red-600'}"
						>
							{Number(selectedVariant.stockCount || 0) > 0
								? `${selectedVariant.stockCount} available in this option`
								: 'Out of stock in this option'}
						</p>
					{/if}
				</div>
			{/if}

			<div class="mb-10 flex flex-col gap-4 sm:flex-row">
				<div class="flex h-14 w-full border border-gray-300 sm:w-32">
					<button
						type="button"
						disabled={productOutOfStock}
						class="flex w-10 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:text-gray-300"
						onclick={() => (quantity = quantity > 1 ? quantity - 1 : 1)}
					>
						-
					</button>
					<input
						type="number"
						class="w-full border-none bg-transparent text-center text-sm font-medium focus:ring-0"
						bind:value={quantity}
						min="1"
					/>
					<button
						type="button"
						disabled={productOutOfStock ||
							(selectedVariant && quantity >= Number(selectedVariant.stockCount || 0))}
						class="flex w-10 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:text-gray-300"
						onclick={() => quantity++}
					>
						+
					</button>
				</div>

				<div class="grid flex-1 gap-3 sm:grid-cols-[1fr_auto]">
					<button
						type="button"
						disabled={selectedVariantOutOfStock}
						class="flex h-14 items-center justify-center gap-2 bg-black px-4 text-sm tracking-widest text-white uppercase transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
						onclick={addToCart}
					>
						<span>{selectedVariantOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
					</button>
					<WishlistButton
						{product}
						class="flex h-14 w-full items-center justify-center border border-gray-300 bg-white text-black transition-colors hover:border-gold hover:bg-gold sm:w-14"
						iconClass="h-5 w-5"
					/>
				</div>
			</div>

			<button
				type="button"
				class="animate-heartbeat mb-10 flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-[#ef4444] px-4 text-sm font-bold tracking-widest text-white uppercase transition-colors hover:bg-red-600"
				onclick={buyNow}
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
				</svg>
				Buy with Cash on Delivery
			</button>

			<div class="mb-10 flex items-center justify-between border border-gray-100 bg-gray-50 p-4 rounded-xl">
				<div>
					<p class="mb-0.5 text-xs font-bold text-gray-900 uppercase">💵 Cash on Delivery Available</p>
					<p class="text-xs font-light text-gray-500">Pay at your doorstep with Rs. 200 standard shipping</p>
				</div>
				<a
					href={`https://wa.me/923703772463?text=${encodeURIComponent(`Hi, I am interested in ordering: ${product.name}`)}`}
					target="_blank"
					rel="noreferrer"
					class="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-green-600"
				>
					WhatsApp Us
				</a>
			</div>

			<div class="border-t border-gray-200">
				<div class="flex space-x-8 border-b border-gray-200">
					<button
						type="button"
						class="relative py-4 text-sm font-medium tracking-widest uppercase {activeTab ===
						'details'
							? 'text-black'
							: 'text-gray-400 hover:text-black'}"
						onclick={() => (activeTab = 'details')}
					>
						Details
						{#if activeTab === 'details'}
							<span class="absolute bottom-0 left-0 h-[2px] w-full bg-black"></span>
						{/if}
					</button>
					<button
						type="button"
						class="relative py-4 text-sm font-medium tracking-widest uppercase {activeTab ===
						'shipping'
							? 'text-black'
							: 'text-gray-400 hover:text-black'}"
						onclick={() => (activeTab = 'shipping')}
					>
						Shipping & Returns
						{#if activeTab === 'shipping'}
							<span class="absolute bottom-0 left-0 h-[2px] w-full bg-black"></span>
						{/if}
					</button>
				</div>

				<div class="py-6 text-sm leading-relaxed font-light text-gray-600">
					{#if activeTab === 'details'}
						<ul class="space-y-2">
							<li>
								<strong>Fabric:</strong>
								{product.fabricDetails || 'Premium modestwear fabric'}
							</li>
							<li>
								<strong>Categories:</strong>
								{product.collections?.map((collection: any) => collection.name).join(', ')}
							</li>
							<li><strong>SKU:</strong> {selectedVariant?.sku || 'Available on request'}</li>
						</ul>
					{:else}
						<p class="mb-4">
							<strong>Shipping:</strong> Orders are prepared after confirmation on WhatsApp or checkout.
							Delivery charges and timings are confirmed before dispatch.
						</p>
						<p>
							<strong>Returns:</strong> Exchanges are handled according to product condition and availability.
							Please contact Zylowalls support for help with sizing before ordering.
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<div class="border-t border-gray-100 bg-white py-14">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12">
			<h2 class="mb-8 text-center font-serif text-2xl text-gray-800">Customer Reviews</h2>
			
			<div class="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
				<div class="flex flex-col items-center md:items-start text-center md:text-left">
					<div class="flex items-center gap-2 mb-1">
						<div class="flex text-[#b1df57]">
							{#each Array(5) as _}
								<svg class="h-5 w-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
							{/each}
						</div>
						<span class="text-sm text-gray-600">5.00 out of 5</span>
					</div>
					<span class="text-sm text-gray-500">Based on {fakeReviews.length} reviews</span>
				</div>

				<div class="flex flex-col gap-2 border-y border-gray-100 py-4 md:border-y-0 md:border-x md:px-16 md:py-0">
					{#each [5,4,3,2,1] as star}
						<div class="flex items-center gap-3">
							<div class="flex text-[#b1df57]">
								{#each Array(5) as _, i}
									<svg class="h-4 w-4 {i < star ? 'fill-current' : 'text-gray-200 stroke-current fill-none'}" viewBox="0 0 20 20" stroke-width="1.5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
								{/each}
							</div>
							<div class="h-2.5 w-32 bg-gray-100 rounded-sm overflow-hidden">
								<div class="h-full bg-[#b1df57]" style="width: {star === 5 ? '100%' : '0%'}"></div>
							</div>
							<span class="text-xs text-gray-500 w-2">{star === 5 ? fakeReviews.length : 0}</span>
						</div>
					{/each}
				</div>

				<div class="flex items-center justify-center">
					<button class="bg-[#b1df57] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#9ccb3d] shadow-sm">
						Write a review
					</button>
				</div>
			</div>
		</div>

		<div class="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8" style="scrollbar-width: none; -ms-overflow-style: none;">
			{#each fakeReviews as review}
				<div class="flex w-[320px] shrink-0 snap-start flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
					<div class="flex gap-4">
						<div class="h-[88px] w-[88px] shrink-0 overflow-hidden bg-gray-50 rounded">
							<img src={review.image} alt={review.name} class="h-full w-full object-cover" />
						</div>
						<div class="flex flex-col">
							<div class="flex text-[#84cc16] mb-1.5">
								{#each Array(5) as _}
									<svg class="h-4 w-4 fill-current" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								{/each}
							</div>
							{#if review.title}
								<h4 class="font-bold text-sm text-gray-800 mb-0.5">{review.title}</h4>
							{/if}
							<p class="text-xs text-gray-500 line-clamp-3 leading-relaxed">{review.text}</p>
						</div>
					</div>
					<div class="mt-auto">
						<p class="text-xs font-bold text-gray-700">{review.name}</p>
					</div>
				</div>
			{/each}
		</div>
		
		<div class="flex items-center justify-center gap-6 text-[#84cc16]">
			<button class="transition-transform hover:scale-110" aria-label="Previous review">
				<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
			</button>
			<button class="transition-transform hover:scale-110" aria-label="Next review">
				<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
			</button>
		</div>
	</div>
</div>



{#if relatedProducts.length}
	<div class="border-t border-gray-100 bg-white py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<h2 class="mb-4 font-serif text-2xl tracking-widest text-black uppercase">
					Related Products
				</h2>
				<div class="mx-auto h-[1px] w-12 bg-gold"></div>
			</div>

			<div class="grid grid-cols-2 gap-6 md:grid-cols-4">
				{#each relatedProducts as item}
					<div class="group">
						<div class="relative mb-4 aspect-[3/4] overflow-hidden bg-gray-100">
							<a href={`/shop/${item.slug}`} class="block h-full" aria-label={`View ${item.name}`}>
								<img
									src={productImage(item)}
									alt={item.name}
									class="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
								/>
							</a>
							<WishlistButton
								product={item}
								class="absolute right-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/86 text-[#14352d] shadow-[0_10px_22px_rgba(20,53,45,0.16)] backdrop-blur transition-colors hover:bg-[#e4b43d]"
								iconClass="h-4 w-4"
							/>
							<a
								href={`/shop/${item.slug}`}
								class="absolute right-14 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/86 text-[#14352d] shadow-[0_10px_22px_rgba(20,53,45,0.16)] backdrop-blur transition-colors hover:bg-[#e4b43d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14352d]"
								aria-label={`Open ${item.name} details`}
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.8"
										d="M7 17L17 7M9 7h8v8"
									/>
								</svg>
							</a>
						</div>
						<a href={`/shop/${item.slug}`} class="block">
							<h3 class="mb-1 font-serif text-sm transition-colors group-hover:text-gold">
								{item.name}
							</h3>
							<p class="text-xs font-medium text-gray-500">
								{formatMoney(item.salePrice || item.price)}
							</p>
						</a>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
