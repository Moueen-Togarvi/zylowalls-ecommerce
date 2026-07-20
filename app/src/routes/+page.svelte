<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { cart } from '$lib/client/cart.svelte';
	import ZylowallsWordmark from '$lib/components/ZylowallsWordmark.svelte';
	import WallArtSlidingBanner from '$lib/components/WallArtSlidingBanner.svelte';
	import ProOfferGrid from '$lib/components/ProOfferGrid.svelte';
	import FlashSaleTimerBanner from '$lib/components/FlashSaleTimerBanner.svelte';
	import CategoryCircleCards from '$lib/components/CategoryCircleCards.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';

	import { formatMoney } from '$lib/shared/money';
	import { SITE_DESCRIPTION, SITE_IMAGE, SITE_KEYWORDS, SITE_NAME, absoluteUrl, breadcrumbJsonLd } from '$lib/shared/seo';

	let { data } = $props();
	let products = $derived((data.products || []) as Array<any>);
	let collections = $derived((data.collections || []) as Array<any>);
	let reviewPhotos = $derived((data.reviewPhotos || []) as Array<any>);
	let homeSections = $derived((data.homeSections || {}) as Record<string, any>);
	let storefrontSettings = $derived((data.storefrontSettings || {}) as Record<string, any>);

	let heroRoot: HTMLElement;

	let activeWordIndex = $state(0);
	let activeBgIndex = $state(0);
	const bgSlides = [
		'/hero_wall_art_black_bg.png',
		'/hero_wall_art_bg_2.png',
		'/hero_wall_art_bg.png',
		'/hero_wall_art_bg_3.png'
	];

	function homeSection(key: string, homepageLimit: number) {
		return (
			homeSections[key] || {
				products: products.slice(0, homepageLimit),
				total: products.length,
				homepageLimit,
				viewAllHref: `/sections/${key}`,
				usesFallback: true
			}
		);
	}

	function hasViewAll(section: any) {
		return (
			Number(section.total || 0) > Number(section.homepageLimit || section.products?.length || 0)
		);
	}

	let signatureCollectionsSection = $derived(homeSection('signature-collections', 4));
	let newArrivalsSection = $derived(homeSection('new-arrivals', 4));
	let mostLovedSection = $derived(homeSection('most-loved', 8));
	let curatedEdits = $derived(
		(!signatureCollectionsSection.usesFallback
			? signatureCollectionsSection.products
			: products.slice(0, 4)
		).slice(0, 4) as Array<any>
	);
	let newArrivals = $derived((newArrivalsSection.products || []) as Array<any>);
	let bestsellers = $derived((mostLovedSection.products || []) as Array<any>);
	let bestsellerRows = $derived([
		bestsellers.slice(0, 4),
		bestsellers.slice(4, 8).length ? bestsellers.slice(4, 8) : [...bestsellers].reverse()
	]);
	let bestsellerCategoryTags = $derived(collections.map((collection) => collection.name));
	let shouldAnimateReviewPhotos = $derived(reviewPhotos.length > 2);
	let reviewPhotoLoop = $derived(
		shouldAnimateReviewPhotos ? [...reviewPhotos, ...reviewPhotos] : reviewPhotos
	);

	let saleTapeItems = $derived(
		(storefrontSettings.saleTapeItems?.length
			? storefrontSettings.saleTapeItems
			: ['EID SALE', '30% OFF', 'ZYLOWALLS']) as string[]
	);
	let saleTapeLoop = $derived(Array.from({ length: 8 }, () => saleTapeItems).flat());
	let saleTapeEnabled = $derived(storefrontSettings.saleTapeEnabled !== false);
	let homeSocialImage = $derived(absoluteUrl(SITE_IMAGE, page.url.origin));
	let homeBreadcrumbJsonLd = $derived(
		breadcrumbJsonLd([{ name: 'Home', url: '/' }], page.url.origin)
	);
	const brandPattern = /^(Zylowalls|ZYLOWALLS)$/;

	function textWithBrand(value: string) {
		return value.split(/(Zylowalls|ZYLOWALLS)/g).filter(Boolean);
	}

	function isBrandText(value: string) {
		return brandPattern.test(value);
	}

	function productImage(item: any) {
		return item.images?.[0]?.url || collections[0]?.imageUrl || '/image.png';
	}

	function primaryVariant(item: any) {
		return (
			item.variants?.find((variant: any) => Number(variant.stockCount || 0) > 0) ||
			item.variants?.[0]
		);
	}

	function isOutOfStock(item: any) {
		return !item.variants?.some((variant: any) => Number(variant.stockCount || 0) > 0);
	}

	function productHref(item: any) {
		return `/shop/${item.slug}`;
	}

	function productCategory(item: any) {
		return item.collections?.[0]?.name || 'Zylowalls';
	}

	function productTags(item: any) {
		return [
			primaryVariant(item)?.color,
			primaryVariant(item)?.size,
			...((item.collections || []).map((collection: any) => collection.name) as string[])
		]
			.filter(Boolean)
			.filter((tag) => typeof tag === 'string' && tag.toLowerCase() !== 'default')
			.slice(0, 3);
	}

	function productPrice(item: any) {
		return Number(item.salePrice || item.price);
	}

	function addProductToCart(item: any) {
		if (isOutOfStock(item)) return;
		const variant = primaryVariant(item);

		cart.addItem({
			id: variant?.id || item.id,
			productId: item.id,
			variantId: variant?.id,
			name: item.name,
			price: productPrice(item),
			quantity: 1,
			image: productImage(item),
			color: variant?.color,
			size: variant?.size
		});
	}

	onMount(() => {
		let active = true;
		let destroyAnimation: (() => void) | undefined;

		const swapTimer = setInterval(() => {
			activeWordIndex = (activeWordIndex + 1) % 4;
		}, 3000);

		const bgTimer = setInterval(() => {
			activeBgIndex = (activeBgIndex + 1) % bgSlides.length;
		}, 5500);

		import('gsap').then(({ gsap }) => {
			if (!active || !heroRoot) return;

			const mm = gsap.matchMedia();
			const ctx = gsap.context(() => {
				mm.add(
					{
						reduceMotion: '(prefers-reduced-motion: reduce)'
					},
					(context) => {
						const reduceMotion = Boolean(context.conditions?.reduceMotion);
						const revealItems = gsap.utils.toArray<HTMLElement>('.hero-reveal');

						gsap.set(revealItems, { willChange: 'transform, opacity' });

						if (reduceMotion) {
							gsap.set(revealItems, {
								autoAlpha: 1,
								clearProps: 'transform,willChange'
							});
							return () => {};
						}

						const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

						tl.fromTo(
							revealItems,
							{ autoAlpha: 0, y: 18 },
							{
								autoAlpha: 1,
								y: 0,
								duration: 0.72,
								stagger: 0.075
							},
							0.2
						);

						return () => {
							gsap.set(revealItems, { clearProps: 'willChange' });
						};
					}
				);
			}, heroRoot);

			destroyAnimation = () => {
				mm.revert();
				ctx.revert();
			};
		});

		return () => {
			active = false;
			clearInterval(swapTimer);
			clearInterval(bgTimer);
			destroyAnimation?.();
		};
	});
</script>

<svelte:head>
	<title>Zylowalls | Premium Wall Art & Decor</title>
	<meta name="description" content={SITE_DESCRIPTION} />
	<meta name="keywords" content={SITE_KEYWORDS} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={`${SITE_NAME} | Premium Wall Art & Decor`} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:image" content={homeSocialImage} />
	<meta name="twitter:title" content={`${SITE_NAME} | Premium Wall Art & Decor`} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	{@html homeBreadcrumbJsonLd}
</svelte:head>

<section
	bind:this={heroRoot}
	class="relative isolate -mt-[4.25rem] overflow-hidden bg-[#fbf9f2] pt-32 pb-24 md:-mt-[4.75rem] md:pt-40 md:pb-36"
>
	<!-- Aesthetic Background Image Slideshow & Concentric Rings -->
	<div class="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden bg-[#fbf9f2]">
		{#each bgSlides as slide, index}
			<img
				src={slide}
				alt="Wall Art Interior Background"
				class="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out mix-blend-multiply"
				style="opacity: {activeBgIndex === index ? '0.72' : '0'};"
			/>
		{/each}

		<!-- Soft white/beige backdrop overlay to ensure contrast and readability of the dark text -->
		<div class="absolute inset-0 bg-[#fbf9f2]/58 backdrop-blur-[1px] z-0"></div>

		<!-- Bottom Gradient Blend Overlay -->
		<div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fbf9f2] via-[#fbf9f2]/60 to-transparent z-10"></div>

		<div class="absolute w-[360px] h-[360px] rounded-full border border-[#1b1918]/[0.02] z-0"></div>
		<div class="absolute w-[600px] h-[600px] rounded-full border border-[#1b1918]/[0.02] z-0"></div>
		<div class="absolute w-[840px] h-[840px] rounded-full border border-[#1b1918]/[0.015] z-0"></div>
		<div class="absolute w-[1080px] h-[1080px] rounded-full border border-[#1b1918]/[0.015] z-0"></div>
		<div class="absolute w-[1320px] h-[1320px] rounded-full border border-[#1b1918]/[0.01] z-0"></div>
		<div class="absolute w-[1560px] h-[1560px] rounded-full border border-[#1b1918]/[0.008] z-0"></div>
	</div>

	<!-- Content Container -->
	<div class="mx-auto max-w-4xl px-4 text-center">
		<!-- Top Badge -->
		<div class="hero-reveal mb-8 inline-flex items-center justify-center rounded-full border border-[#1b1918]/8 bg-white/70 px-4 py-1.5 backdrop-blur-sm shadow-[0_4px_12px_rgba(27,25,24,0.02)]">
			<span class="mr-2 rounded-full bg-[#1b1918] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">3-IN-1</span>
			<a href="/shop" class="text-xs font-semibold tracking-wide text-gray-700 hover:text-black transition-colors flex items-center">
				Calligraphy. Wood panels. Wall art.
				<svg class="ml-1 h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>

		<!-- Main Heading -->
		<h1 class="hero-reveal font-serif text-4xl leading-[1.2] tracking-tight text-[#1b1918] sm:text-6xl md:text-[5.5rem] md:leading-[1.15]">
			Design. Decorate.<br />
			<div class="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 flex-wrap mt-2">
				<span>and</span>
				<!-- Logo Card inline (fixed position, non-shifting, original styled) -->
				<span class="inline-flex items-center justify-center align-middle transform -rotate-12 hover:rotate-0 transition-transform duration-300 shadow-[0_12px_24px_rgba(0,0,0,0.12)] border border-black/5 rounded-2xl bg-white p-2.5 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0">
					<img src="/final logo bhai shb.png" alt="Zylowalls Logo" class="w-full h-full object-contain" />
				</span>
				<!-- Sliding Word Container (fixed width, non-shifting, resized & aligned) -->
				<span class="inline-block overflow-hidden h-[1.25em] w-[140px] sm:w-[225px] md:w-[325px] text-left relative align-middle shrink-0 text-[0.78em] sm:text-[0.8em] md:text-[0.82em]">
					<span class="absolute left-0 top-0 flex flex-col transition-transform duration-700 ease-in-out text-[#7b6a3d] italic font-sans font-extrabold tracking-normal leading-[1.25]" style="transform: translateY(-{activeWordIndex * 25}%);">
						<span class="h-[1.25em] flex items-center">Elevate.</span>
						<span class="h-[1.25em] flex items-center">Decorate.</span>
						<span class="h-[1.25em] flex items-center">Inspire.</span>
						<span class="h-[1.25em] flex items-center">Wall Art.</span>
					</span>
				</span>
			</div>
		</h1>

		<!-- Subtitle -->
		<p class="hero-reveal mx-auto mt-8 max-w-2xl font-serif text-lg italic text-[#596c62] sm:text-xl md:text-2xl">
			Handcrafted 3D acrylic calligraphy, geometric wooden wall art, and premium panels to transform your walls.
		</p>

		<!-- Call to Action Buttons -->
		<div class="hero-reveal mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
			<a
				href="/collections"
				class="w-64 sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1b1918] px-8 text-sm font-black tracking-wider text-white shadow-[0_16px_34px_rgba(27,25,24,0.2)] hover:bg-[#7b6a3d] transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b1918]"
			>
				Explore Collections
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
				</svg>
			</a>
			<a
				href="/shop"
				class="w-64 sm:w-auto inline-flex min-h-12 items-center justify-center rounded-full border border-[#1b1918]/12 bg-white px-8 text-sm font-black tracking-wider text-[#1b1918] shadow-[0_12px_28px_rgba(27,25,24,0.06)] hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b1918]"
			>
				All Products
			</a>
		</div>
	</div>
</section>

{#if saleTapeEnabled && saleTapeItems.length}
	<!-- Eid Sale Tape -->
	<section class="relative overflow-hidden bg-[#f7f4ec] px-4 py-4 sm:px-6 lg:px-8">
		<div class="sale-tape-stage" aria-hidden="true">
			<div class="sale-tape sale-tape--gold">
				<div class="sale-tape__track sale-tape__track--ltr">
					{#each saleTapeLoop as item}
						<span>
							{#if isBrandText(item)}
								<ZylowallsWordmark />
							{:else}
								{item}
							{/if}
						</span>
					{/each}
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- Categories -->
<CategoryCircleCards {collections} />

<!-- Featured Collections -->
<section class="border-t border-[#1b1918]/8 bg-[#fbf9f2] px-4 py-16 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		<div class="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="mb-3 text-xs font-bold tracking-[0.18em] text-[#7b6a3d] uppercase">
					Curated Edits
				</p>
				<h2 class="font-serif text-3xl leading-tight text-[#1b1918] uppercase sm:text-4xl">
					Signature Collections
				</h2>
			</div>
			<div class="max-w-md space-y-4 sm:text-right">
				<p class="text-sm leading-6 font-medium text-[#596c62]">
					Refined designs for your home: 3D calligraphy panels, wooden geometric art, and premium acrylic wall decor.
				</p>
			</div>
		</div>

		<div
			class="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 xl:mx-auto xl:max-w-7xl"
		>
			{#each curatedEdits as edit}
				<ProductCard product={edit} aspectRatio="aspect-[5/6]" />
			{/each}
		</div>

		{#if hasViewAll(signatureCollectionsSection)}
			<div class="mt-8 text-center">
				<a
					href={signatureCollectionsSection.viewAllHref}
					class="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1b1918]/12 bg-white px-6 text-xs font-black tracking-[0.12em] text-[#1b1918] uppercase shadow-[0_12px_28px_rgba(27,25,24,0.08)] transition-colors hover:border-[#e4b43d] hover:bg-[#e4b43d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b1918]"
				>
					View All
				</a>
			</div>
		{/if}
	</div>
</section>

<!-- Wall Art Low-Height Sliding Banner -->
<WallArtSlidingBanner settings={storefrontSettings} />

<!-- Features / Trust Banner -->
<section class="bg-cream px-4 pt-4 pb-6 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-7xl">
		<div class="flex flex-col lg:flex-row items-center justify-between gap-6 rounded-[2rem] bg-white border border-[#1b1918]/6 p-6 sm:p-8 lg:px-12 shadow-[0_12px_36px_rgba(27,25,24,0.02)]">
			<!-- Title -->
			<div class="text-center lg:text-left shrink-0">
				<h3 class="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#1b1918]">
					Exceptional Quality <span class="text-red-600">Delivered</span>
				</h3>
			</div>

			<!-- Grid of features -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 w-full lg:w-auto items-center">
				<!-- Feature 1 -->
				<div class="flex items-center gap-3">
					<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1b1918]/5 text-[#1b1918]">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16V10a2 2 0 00-2-2h-6v8m0-8V5a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16" />
						</svg>
					</div>
					<div class="text-left leading-tight">
						<span class="block text-xs font-black text-[#1b1918] uppercase">Free Shipping</span>
						<span class="block text-[0.62rem] text-gray-500 font-medium">Nationwide Delivery</span>
					</div>
				</div>

				<!-- Feature 2 -->
				<div class="flex items-center gap-3">
					<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1b1918]/5 text-[#1b1918]">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div class="text-left leading-tight">
						<span class="block text-xs font-black text-[#1b1918] uppercase">10K+ Happy</span>
						<span class="block text-[0.62rem] text-gray-500 font-medium">Satisfied Customers</span>
					</div>
				</div>

				<!-- Feature 3 -->
				<div class="flex items-center gap-3">
					<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1b1918]/5 text-[#1b1918]">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
						</svg>
					</div>
					<div class="text-left leading-tight">
						<span class="block text-xs font-black text-[#1b1918] uppercase">Wood & Acrylic</span>
						<span class="block text-[0.62rem] text-gray-500 font-medium">Laser-Cut Precision</span>
					</div>
				</div>

				<!-- Feature 4 -->
				<div class="flex items-center gap-3">
					<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1b1918]/5 text-[#1b1918]">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4.8 8h14.4L12 20 4.8 8z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4L4.8 8 12 12 19.2 8 12 4z" />
						</svg>
					</div>
					<div class="text-left leading-tight">
						<span class="block text-xs font-black text-[#1b1918] uppercase">100% Authentic</span>
						<span class="block text-[0.62rem] text-gray-500 font-medium">Original Designs</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- New Arrivals (Horizontal Scroll / Grid) -->
<section class="bg-cream px-4 py-16 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-6xl">
		<div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h2 class="mb-2 font-serif text-3xl tracking-widest text-black uppercase">New Arrivals</h2>
				<p class="font-light text-gray-500">The latest additions to our collection</p>
			</div>
		</div>

		<div class="grid grid-cols-2 items-stretch gap-3 sm:gap-6 lg:grid-cols-4">
			{#each newArrivals as item}
				<ProductCard product={item} aspectRatio="aspect-[1/1]" />
			{/each}
		</div>

		{#if hasViewAll(newArrivalsSection)}
			<div class="mt-8 text-center">
				<a
					href={newArrivalsSection.viewAllHref}
					class="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1b1918]/12 bg-white px-6 text-xs font-black tracking-[0.12em] text-[#1b1918] uppercase shadow-[0_12px_28px_rgba(27,25,24,0.08)] transition-colors hover:border-[#e4b43d] hover:bg-[#e4b43d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b1918]"
				>
					View All
				</a>
			</div>
		{/if}
	</div>
</section>

{#if storefrontSettings.flashSaleEnabled}
	<!-- Flash Sale Timer Offer Banner -->
	<FlashSaleTimerBanner settings={storefrontSettings} />
{/if}

<!-- Bestsellers -->
<section class="overflow-hidden bg-cream py-14">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-8 flex flex-col gap-6">
			<div class="text-center">
				<h2 class="font-serif text-3xl tracking-widest text-[#1b1918] uppercase">Most Loved</h2>
			</div>

			<div class="category-ribbon" aria-label="Bestseller categories">
				<div class="category-ribbon__track">
					{#each bestsellerCategoryTags as tag}
						<span
							class="inline-flex min-h-8 shrink-0 items-center justify-center rounded-full border border-[#1b1918]/10 bg-[#fffaf0] px-4 text-[0.68rem] font-black tracking-[0.12em] text-[#1b1918] uppercase shadow-[0_10px_22px_rgba(27,25,24,0.08)]"
						>
							{tag}
						</span>
					{/each}
				</div>
			</div>
		</div>

		<div class="product-loop-stack">
			{#each bestsellerRows as row, rowIndex}
				<div
					class="product-loop {rowIndex === 1 ? 'product-loop--second' : ''}"
					aria-label={`Most loved products row ${rowIndex + 1}`}
				>
					<div class="product-loop__track">
						{#each [...row, ...row] as item, itemIndex}
							<div
								class={`product-loop__item min-w-0 sm:w-[17.5rem] sm:shrink-0 lg:w-[18.25rem] ${itemIndex >= row.length ? 'product-loop__item--duplicate' : ''}`}
							>
								<ProductCard product={item} aspectRatio="aspect-[5/6]" />
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		{#if hasViewAll(mostLovedSection)}
			<div class="mt-8 text-center">
				<a
					href={mostLovedSection.viewAllHref}
					class="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1b1918]/12 bg-white px-6 text-xs font-black tracking-[0.12em] text-[#1b1918] uppercase shadow-[0_12px_28px_rgba(27,25,24,0.08)] transition-colors hover:border-[#e4b43d] hover:bg-[#e4b43d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b1918]"
				>
					View All
				</a>
			</div>
		{/if}
	</div>
</section>

<!-- Special Promo Offers Section -->
<ProOfferGrid {products} onAddToCart={addProductToCart} />

{#if reviewPhotos.length}
	<!-- Review Photos -->
	<section class="overflow-hidden bg-cream py-16 sm:py-20">
		<div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
			<p class="mb-4 text-xs font-black tracking-[0.2em] text-[#b58b2b] uppercase">Customer Love</p>
			<h2 class="font-serif text-3xl tracking-widest text-[#1b1918] uppercase sm:text-4xl">
				Reviews
			</h2>
		</div>

		<div
			class={`review-photo-loop mt-10 ${shouldAnimateReviewPhotos ? 'review-photo-loop--animated' : 'review-photo-loop--static'}`}
			aria-label="Customer review photos"
		>
			<div class="review-photo-loop__track">
				{#each reviewPhotoLoop as photo, index}
					<figure class="review-photo-card">
						<img
							src={photo.url}
							alt={`Zylowalls customer review ${index + 1}`}
							class="h-full w-full object-cover object-center"
							loading="lazy"
						/>
					</figure>
				{/each}
			</div>
		</div>
	</section>
{/if}

<style>
	/* Hero section styles are handled with Tailwind CSS */

	.sale-tape-stage {
		position: relative;
		min-height: 3.8rem;
		margin-inline: -4rem;
	}

	.sale-tape {
		position: absolute;
		left: -10%;
		width: 120%;
		overflow: hidden;
		box-shadow: 0 22px 48px rgba(20, 53, 45, 0.14);
		filter: blur(0.28px);
	}

	.sale-tape--gold {
		top: 0.45rem;
		transform: rotate(0deg);
		background: #e4b43d;
		color: #1b1918;
	}

	.sale-tape__track {
		display: flex;
		width: max-content;
		align-items: center;
		gap: 2rem;
		min-height: 2.9rem;
		padding-inline: 1.5rem;
		will-change: transform;
	}

	.sale-tape__track--ltr {
		animation: sale-tape-left-to-right 18s linear infinite;
	}

	.sale-tape__track span {
		flex: 0 0 auto;
		font-size: clamp(1.05rem, 2.45vw, 2.35rem);
		font-weight: 900;
		letter-spacing: 0.08em;
		line-height: 1;
		text-transform: uppercase;
		white-space: nowrap;
	}

	@keyframes sale-tape-left-to-right {
		from {
			transform: translateX(-50%);
		}
		to {
			transform: translateX(0);
		}
	}

	.category-ribbon {
		overflow-x: auto;
		padding-block: 0.65rem;
		scrollbar-width: none;
	}

	.category-ribbon::-webkit-scrollbar {
		display: none;
	}

	.category-ribbon__track {
		display: flex;
		width: max-content;
		gap: 0.75rem;
		margin-inline: auto;
	}

	.product-loop-stack {
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
	}

	.product-loop {
		margin-inline: -1rem;
		overflow: hidden;
		padding-block: 0.65rem;
	}

	.product-loop__track {
		display: flex;
		width: max-content;
		gap: 1.5rem;
		animation: product-loop-slide 28s linear infinite;
		will-change: transform;
	}

	.product-loop--second .product-loop__track {
		animation-duration: 34s;
	}

	.product-loop:hover .product-loop__track,
	.product-loop:focus-within .product-loop__track {
		animation-play-state: paused;
	}

	@keyframes product-loop-slide {
		from {
			transform: translateX(-50%);
		}
		to {
			transform: translateX(0);
		}
	}

	.review-photo-loop {
		margin-inline: -1rem;
		overflow: hidden;
		padding-block: 0.5rem;
	}

	.review-photo-loop__track {
		display: flex;
		width: max-content;
		gap: 1rem;
		will-change: transform;
	}

	.review-photo-loop--static .review-photo-loop__track {
		width: 100%;
		justify-content: center;
	}

	.review-photo-loop--animated .review-photo-loop__track {
		animation: review-photo-slide 34s linear infinite;
	}

	.review-photo-loop--animated:hover .review-photo-loop__track,
	.review-photo-loop--animated:focus-within .review-photo-loop__track {
		animation-play-state: paused;
	}

	.review-photo-card {
		aspect-ratio: 4 / 5;
		width: min(18rem, 72vw);
		flex-shrink: 0;
		overflow: hidden;
		border-radius: 0.45rem;
		background: #e4eee9;
		box-shadow: 0 18px 44px rgba(20, 53, 45, 0.1);
		outline: 1px solid rgba(20, 53, 45, 0.1);
	}

	@keyframes review-photo-slide {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	/* Typewriter cursor style removed */

	@media (prefers-reduced-motion: reduce) {
		.hero-bg__slide {
			transition: none;
		}

		.product-loop__track,
		.review-photo-loop__track {
			animation: none;
			transform: none;
		}
	}

	@media (max-width: 640px) {
		.sale-tape-stage {
			min-height: 3.3rem;
			margin-inline: -2rem;
		}

		.sale-tape__track {
			min-height: 2.45rem;
			gap: 1.25rem;
		}

		.sale-tape--gold {
			top: 0.4rem;
		}

		.product-loop-stack {
			gap: 1rem;
		}

		.product-loop {
			margin-inline: 0;
			overflow: visible;
			padding-block: 0.2rem;
		}

		.product-loop__track {
			display: grid;
			width: 100%;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.8rem;
			animation: none;
			transform: none;
		}

		.product-loop__item {
			width: auto;
			min-width: 0;
		}

		.product-loop__item--duplicate {
			display: none;
		}

		.category-ribbon {
			margin-inline: -1rem;
			padding-inline: 1rem;
		}

		.category-ribbon__track {
			margin-inline: 0;
		}

		.review-photo-loop {
			margin-inline: -1rem;
		}

		.review-photo-loop__track {
			gap: 0.75rem;
		}

		.review-photo-loop--animated .review-photo-loop__track {
			animation-duration: 28s;
		}

		.review-photo-card {
			width: 12.5rem;
		}
	}
</style>
