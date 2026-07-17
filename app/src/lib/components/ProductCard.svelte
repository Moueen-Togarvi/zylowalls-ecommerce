<script lang="ts">
	import { cart } from '$lib/client/cart.svelte';
	import WishlistButton from '$lib/components/WishlistButton.svelte';
	import { formatMoney } from '$lib/shared/money';

	let {
		product,
		layout = 'grid',
		aspectRatio = 'aspect-[3/4]',
		class: className = ''
	} = $props<{
		product: any;
		layout?: 'grid' | 'list';
		aspectRatio?: string;
		class?: string;
	}>();

	let href = $derived(`/shop/${product.slug}`);

	let image = $derived(
		product.images?.[0]?.url || '/image.png'
	);

	let isOutOfStock = $derived(
		!product.variants?.some((variant: any) => Number(variant.stockCount || 0) > 0)
	);

	function primaryVariant(item: any) {
		return (
			item.variants?.find((variant: any) => Number(variant.stockCount || 0) > 0) ||
			item.variants?.[0]
		);
	}

	let variant = $derived(primaryVariant(product));

	function productPrice(item: any) {
		return Number(item.salePrice || item.price);
	}

	function handleAddToCart(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (isOutOfStock) return;

		cart.addItem({
			id: variant?.id || product.id,
			productId: product.id,
			variantId: variant?.id,
			name: product.name,
			price: productPrice(product),
			quantity: 1,
			image: image,
			color: variant?.color,
			size: variant?.size
		});
	}

	let colors = $derived(
		[...new Set(product.variants?.map((v: any) => v.color as string).filter((c: any) => c && c.toLowerCase() !== 'default'))] as string[]
	);

	let discountPercent = $derived(
		product.salePrice && product.price
			? Math.round(((Number(product.price) - Number(product.salePrice)) / Number(product.price)) * 100)
			: 0
	);

	let marqueeText = $derived(
		discountPercent > 0
			? `${discountPercent}% OFF * SALE`
			: 'NEW COLLECTION * BESTSELLER'
	);

	function getColorHex(colorName: string) {
		const colorsMap: Record<string, string> = {
			black: '#000000',
			white: '#ffffff',
			red: '#ef4444',
			blue: '#3b82f6',
			green: '#22c55e',
			yellow: '#eab308',
			purple: '#a855f7',
			pink: '#ec4899',
			orange: '#f97316',
			gray: '#6b7280',
			grey: '#6b7280',
			cream: '#fbf9f2',
			gold: '#c5a880',
			emerald: '#0f766e',
			navy: '#1e3a8a',
			beige: '#e1c699',
			maroon: '#800000',
			plum: '#dddae8',
			lavender: '#e6e6fa',
			olive: '#808000',
			indigo: '#4b0082'
		};
		return colorsMap[colorName.toLowerCase().trim()] || '#d1d5db';
	}
</script>

<article
	class="group flex h-full overflow-hidden rounded-xl border border-[#14352d]/6 bg-white shadow-[0_8px_24px_rgba(20,53,45,0.01)] transition-all duration-300 hover:-translate-y-1 hover:border-[#14352d]/12 hover:shadow-[0_16px_36px_rgba(20,53,45,0.04)] {layout === 'list' ? 'flex-col sm:flex-row' : 'flex-col'} {className}"
>
	<!-- Image Container -->
	<div class="relative block overflow-hidden bg-[#e4eee9] {layout === 'list' ? `w-full sm:w-64 sm:shrink-0 ${aspectRatio}` : `w-full ${aspectRatio}`}">
		<a href={href} class="block h-full w-full" aria-label={`View ${product.name}`}>
			<img
				src={image}
				alt={product.name}
				class="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
			/>
		</a>

		<!-- Red Sale Badge on top-left of image -->
		{#if product.salePrice}
			<span class="absolute top-3 left-3 z-10 rounded bg-red-600 px-2 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-bold tracking-[0.1em] text-white uppercase shadow-sm">
				Sale
			</span>
		{/if}

		<!-- Wishlist Floating Button -->
		<WishlistButton
			{product}
			class="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#14352d] shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-[#14352d] hover:text-white hover:scale-105"
			savedClass="bg-[#e4b43d] border-[#e4b43d] text-[#14352d]"
			iconClass="h-4 w-4"
		/>

		<!-- Quick Add Cart Button on bottom-right of image -->
		{#if !isOutOfStock}
			<button
				type="button"
				onclick={handleAddToCart}
				class="absolute bottom-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#14352d] shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-[#e4b43d] hover:text-[#14352d] hover:scale-105"
				aria-label="Add to cart"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
				</svg>
			</button>
		{/if}

		<!-- Out of stock overlay -->
		{#if isOutOfStock}
			<div class="absolute inset-0 z-10 flex items-center justify-center bg-[#14352d]/40 backdrop-blur-[1px]">
				<span class="rounded-full bg-white/95 px-3 py-1 text-[0.62rem] font-bold tracking-[0.15em] text-red-600 uppercase shadow-sm">
					Sold Out
				</span>
			</div>
		{/if}
	</div>

	<!-- Info Container -->
	<div class="relative flex flex-1 flex-col p-3.5 sm:p-4 text-left justify-between">
		<div class="space-y-1">
			<!-- Product Name -->
			<a
				href={href}
				class="block font-sans text-xs sm:text-base font-bold text-[#14352d] hover:text-[#c0983f] transition-colors leading-snug truncate sm:whitespace-normal sm:line-clamp-2 uppercase"
			>
				{product.name}
			</a>

			<!-- Animating Discount Marquee and Color Dots -->
			<div class="flex items-center justify-between gap-3 pt-1 pb-1">
				<!-- Marquee Strap -->
				<div class="relative flex-1 overflow-hidden {discountPercent > 0 ? 'bg-red-50 text-red-600 border border-red-100/50' : 'bg-[#e4eee9] text-[#14352d] border border-[#14352d]/6'} py-0.5 px-2 text-[0.48rem] sm:text-[0.55rem] font-extrabold uppercase tracking-wider rounded-md flex items-center h-[18px] sm:h-[22px]">
					<div class="animate-marquee-custom flex items-center gap-4 whitespace-nowrap">
						<span class="shrink-0 whitespace-nowrap">{marqueeText}</span>
						<span class="shrink-0">•</span>
						<span class="shrink-0 whitespace-nowrap">{marqueeText}</span>
						<span class="shrink-0">•</span>
						<span class="shrink-0 whitespace-nowrap">{marqueeText}</span>
						<span class="shrink-0">•</span>
						<span class="shrink-0 whitespace-nowrap">{marqueeText}</span>
					</div>
				</div>

				<!-- Color dots -->
				{#if colors.length > 0}
					<div class="flex items-center gap-1 shrink-0">
						{#each colors.slice(0, 3) as color}
							<span
								class="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full border border-black/10 shadow-sm"
								style="background-color: {getColorHex(color)}"
								title={color}
							></span>
						{/each}
						{#if colors.length > 3}
							<span class="text-[0.58rem] sm:text-[0.62rem] font-bold text-gray-500">+{colors.length - 3}</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Footer Row: Price & Buy Now Button side-by-side -->
		<div class="flex items-center justify-between gap-0.5 sm:gap-2 pt-2 border-t border-[#14352d]/6 mt-2">
			<div class="min-w-0">
				<div class="flex items-baseline gap-1 whitespace-nowrap">
					<span class="text-[0.68rem] sm:text-base font-extrabold text-[#14352d] tracking-tight">
						{formatMoney(product.salePrice || product.price)}
					</span>
					{#if product.salePrice}
						<span class="text-[0.5rem] sm:text-xs font-bold text-red-600 line-through">
							{formatMoney(product.price)}
						</span>
					{/if}
				</div>
			</div>

			<!-- Action Button -->
			<div class="shrink-0">
				{#if isOutOfStock}
					<button
						disabled
						class="inline-flex min-h-[1.3rem] sm:min-h-[2rem] px-1 sm:px-2.5 items-center justify-center rounded-[5px] sm:rounded-xl bg-gray-100 text-[0.52rem] sm:text-xs font-bold text-gray-400 cursor-not-allowed uppercase"
					>
						Sold Out
					</button>
				{:else}
					<a
						href={href}
						class="inline-flex min-h-[1.3rem] sm:min-h-[2rem] px-1 sm:px-2.5 py-0.5 items-center gap-0.5 sm:gap-1.5 rounded-[5px] sm:rounded-xl bg-[#14352d] text-[0.52rem] sm:text-xs font-bold tracking-wider text-white transition-all duration-300 hover:bg-[#e4b43d] hover:text-[#14352d] hover:-translate-y-0.5 shadow-sm"
					>
						<svg class="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						Buy<span class="hidden sm:inline"> Now</span>
					</a>
				{/if}
			</div>
		</div>
	</div>
</article>

<style>
	@keyframes marquee {
		0% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(-50%);
		}
	}
	.animate-marquee-custom {
		display: flex;
		width: max-content;
		animation: marquee 10s linear infinite;
	}
</style>
