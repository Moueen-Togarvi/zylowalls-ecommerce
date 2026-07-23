<script lang="ts">
	import { navigating, page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import './layout.css';
	import ZylowallsLoader from '$lib/components/ZylowallsLoader.svelte';
	import ZylowallsWordmark from '$lib/components/ZylowallsWordmark.svelte';
	import { cart } from '$lib/client/cart.svelte';
	import { wishlist } from '$lib/client/wishlist.svelte';
	import {
		GEO_REGION,
		GEO_PLACENAME,
		GEO_POSITION,
		ICBM,
		PRIMARY_WHATSAPP_URL,
		SECONDARY_WHATSAPP_URL,
		SITE_BRAND,
		SITE_IMAGE,
		SITE_NAME,
		SITE_TWITTER,
		THEME_COLOR,
		TIKTOK_URL,
		absoluteUrl,
		jsonLdScript,
		localBusinessJsonLd
	} from '$lib/shared/seo';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let whatsAppMenuOpen = $state(false);
	let scrollY = $state(0);

	const primaryNavItems = [
		{ href: '/', label: 'Home' },
		{ href: '/shop', label: 'Shop' },
		{ href: '/collections', label: 'Collections' },
		{ href: '/track', label: 'Track Order' },
		{ href: '/size-guide', label: 'Size Guide' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' }
	];

	const iconButtonClass =
		'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/24 bg-[#1b1918]/92 text-white shadow-[0_12px_28px_rgba(27,25,24,0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#c5a880] hover:text-[#1b1918] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1918]';
	const primaryWhatsAppHref = 'https://wa.me/923703772463';
	const secondaryWhatsAppHref = 'https://wa.me/923703772463';

	let isAdminRoute = $derived(page.url.pathname.startsWith('/zylowalls-secure-admin-7k9x2p'));
	let isScrolled = $derived(scrollY > 24);
	let isNavigating = $derived(Boolean(navigating.to));
	let canonicalHref = $derived(canonicalUrl(page.url));
	let robotsMeta = $derived(
		shouldNoindex(page.url) ? 'noindex,follow' : 'index,follow,max-image-preview:large'
	);
	let socialImage = $derived(absoluteUrl(SITE_IMAGE, page.url.origin));
	let siteJsonLd = $derived(
		jsonLdScript([
			{
				'@context': 'https://schema.org',
				'@type': 'Organization',
				name: SITE_NAME,
				alternateName: SITE_BRAND,
				url: absoluteUrl('/', page.url.origin),
				logo: socialImage,
				image: socialImage,
				sameAs: [TIKTOK_URL, PRIMARY_WHATSAPP_URL],
				contactPoint: [
					{
						'@type': 'ContactPoint',
						contactType: 'customer support',
						telephone: '+92 370 3772463',
						areaServed: 'PK',
						availableLanguage: ['en', 'ur']
					}
				]
			},
			{
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				name: SITE_NAME,
				url: absoluteUrl('/', page.url.origin),
				potentialAction: {
					'@type': 'SearchAction',
					target: `${absoluteUrl('/search', page.url.origin)}?q={search_term_string}`,
					'query-input': 'required name=search_term_string'
				}
			}
		])
	);
	let localBizJsonLd = $derived(localBusinessJsonLd(page.url.origin));

	function shouldNoindex(url: URL) {
		const noindexPrefixes = [
			'/zylowalls-secure-admin-7k9x2p',
			'/account',
			'/cart',
			'/checkout',
			'/login',
			'/track',
			'/wishlist',
			'/search'
		];
		const hasFilterParams = ['q', 'color', 'size', 'category', 'collection'].some((key) =>
			url.searchParams.has(key)
		);

		return noindexPrefixes.some((prefix) => url.pathname.startsWith(prefix)) || hasFilterParams;
	}

	function canonicalUrl(url: URL) {
		const canonical = new URL(url.pathname, url.origin);
		const pageNumber = Number(url.searchParams.get('page') || '1');
		const isPaginatedListing = url.pathname === '/shop' || url.pathname.startsWith('/sections/');

		if (isPaginatedListing && Number.isFinite(pageNumber) && pageNumber > 1) {
			canonical.searchParams.set('page', String(Math.floor(pageNumber)));
		}

		return canonical.toString();
	}

	// ── Tracking Pixel IDs (set PUBLIC_TIKTOK_PIXEL_ID / PUBLIC_META_PIXEL_ID in .env) ──
	const tiktokPixelId = env.PUBLIC_TIKTOK_PIXEL_ID || '';
	const metaPixelId = env.PUBLIC_META_PIXEL_ID || '';

	// Fire PageView on every client-side navigation
	$effect(() => {
		// Trigger reactivity on pathname change
		const _path = page.url.pathname;
		if (isAdminRoute) return;

		if (tiktokPixelId && typeof window !== 'undefined' && (window as any).ttq) {
			(window as any).ttq.page();
		}
		if (metaPixelId && typeof window !== 'undefined' && (window as any).fbq) {
			(window as any).fbq('track', 'PageView');
		}
	});
</script>

<svelte:window bind:scrollY />

<svelte:head>
	<!-- Core SEO -->
	<meta name="robots" content={robotsMeta} />
	<meta name="author" content={SITE_NAME} />
	<meta name="theme-color" content={THEME_COLOR} />
	<link rel="canonical" href={canonicalHref} />

	<!-- Open Graph -->
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:url" content={canonicalHref} />
	<meta property="og:image" content={socialImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="{SITE_NAME} — Premium Wall Art & Decor" />
	<meta property="og:locale" content="en_PK" />

	<!-- Twitter / X -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={SITE_TWITTER} />
	<meta name="twitter:image" content={socialImage} />

	<!-- Geo Targeting (Pakistan) -->
	<meta name="geo.region" content={GEO_REGION} />
	<meta name="geo.placename" content={GEO_PLACENAME} />
	<meta name="geo.position" content={GEO_POSITION} />
	<meta name="ICBM" content={ICBM} />

	<!-- JSON-LD Structured Data -->
	{@html siteJsonLd}
	{@html localBizJsonLd}

	<!-- ── TikTok Pixel ─────────────────────────────────────────────────────── -->
	{#if tiktokPixelId && !isAdminRoute}
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		{@html '<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load("' + tiktokPixelId + '");ttq.page();}(window,document,"ttq");<\/script>'}
	{/if}

	<!-- ── Meta (Facebook) Pixel ────────────────────────────────────────────── -->
	{#if metaPixelId && !isAdminRoute}
		{@html '<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","' + metaPixelId + '");fbq("track","PageView");<\/script><noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' + metaPixelId + '&ev=PageView&noscript=1"/><\/noscript>'}
	{/if}
</svelte:head>

<div
	class={`flex min-h-screen flex-col font-sans text-black ${isAdminRoute ? 'bg-white' : 'bg-cream'}`}
>
	{#if !isAdminRoute}
		<!-- Announcement Bar (above navbar) -->
		<div style="height:2rem; overflow:hidden; background:#1b1918; display:flex; align-items:center; position:sticky; top:0; z-index:51;">
			<div class="ann-track">
				{#each Array(20) as _}
					<span class="ann-item">🚚 Cash on Delivery Available</span>
					<span class="ann-sep">✦</span>
					<span class="ann-item">📦 Nationwide Delivery — Rs. 200 Only</span>
					<span class="ann-sep">✦</span>
				{/each}
			</div>
		</div>

		<!-- Navbar -->
		<header class="sticky top-[2.1rem] z-50 px-3 pt-0 pb-3 sm:px-5">
			<div class="mx-auto max-w-7xl">
				<div class="transition-all duration-300">
					<div class="flex h-14 items-center justify-between gap-2">
						<a href="/" class="group inline-flex min-w-0 shrink-0 items-center gap-2.5">
							<img
								src="/image.png"
								alt="Zylowalls"
								width="640"
								height="640"
								class="h-12 w-12 rounded-full object-cover shadow-[0_14px_30px_rgba(27,25,24,0.28)] ring-2 ring-white/80"
							/>
							<span class="hidden leading-none sm:block">
								<ZylowallsWordmark class="brand-adaptive-text block text-sm" />
								<span
									class="brand-adaptive-text mt-1 block text-[10px] font-semibold tracking-[0.18em] uppercase"
									>Premium Wall Decor</span
								>
							</span>
						</a>

						<nav
							class="mx-auto hidden items-center gap-1 text-xs font-black lg:flex"
							aria-label="Primary navigation"
						>
							{#each primaryNavItems.slice(0, 4) as item}
								<a
									href={item.href}
									class={`rounded-full px-3.5 py-2 transition-all duration-300 ${
										page.url.pathname === item.href ||
										(item.href !== '/' && page.url.pathname.startsWith(item.href))
											? 'bg-[#1b1918] text-white shadow-[0_10px_24px_rgba(27,25,24,0.18)]'
											: 'text-[#1b1918] hover:bg-[#c5a880]/88 hover:text-[#1b1918]'
									}`}
								>
									{item.label}
								</a>
							{/each}
						</nav>

						<form action="/search" method="GET" class="ml-auto hidden min-w-0 lg:block">
							<label
								class="flex h-11 w-[13rem] items-center gap-2 overflow-hidden rounded-full border border-white/24 bg-[#1b1918]/88 pr-3 pl-4 text-white shadow-[0_12px_28px_rgba(27,25,24,0.16)] backdrop-blur-md transition-colors focus-within:bg-[#1b1918]"
							>
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.8"
										d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
								<input
									type="search"
									name="q"
									placeholder="Search wall art..."
									class="h-full w-full border-0 bg-transparent px-0 text-xs font-semibold text-white placeholder:text-white/62 focus:ring-0"
								/>
							</label>
						</form>

						<div class="ml-auto flex items-center gap-1.5">
							<a
								href="/account"
								class={`${iconButtonClass} !hidden lg:!inline-flex`}
								aria-label="Account"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.8"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 20a7 7 0 0114 0"
									/>
								</svg>
							</a>
							<a
								href="/wishlist"
								class={`${iconButtonClass} relative !hidden lg:!inline-flex`}
								aria-label="Wishlist"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.8"
										d="M12 20.25l-1.45-1.32C5.4 14.36 2 11.28 2 7.5A4.5 4.5 0 016.5 3c1.74 0 3.41.81 4.5 2.09A5.96 5.96 0 0115.5 3 4.5 4.5 0 0120 7.5c0 3.78-3.4 6.86-8.55 11.43L12 20.25z"
									/>
								</svg>
								{#if wishlist.totalItems > 0}
									<span
										class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a880] px-1 text-[9px] font-bold text-[#1f2926]"
									>
										{wishlist.totalItems}
									</span>
								{/if}
							</a>
							<a href="/cart" class={`${iconButtonClass} relative`} aria-label="Cart">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.8"
										d="M6 7h15l-1.5 8.25H8.25L6 4.5H3"
									/>
									<circle cx="9" cy="19" r="1.25" fill="currentColor"></circle>
									<circle cx="18" cy="19" r="1.25" fill="currentColor"></circle>
								</svg>
								{#if cart.totalItems > 0}
									<span
										class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a880] px-1 text-[9px] font-bold text-[#1f2926]"
									>
										{cart.totalItems}
									</span>
								{/if}
							</a>
							<button
								type="button"
								class={`${iconButtonClass} lg:!hidden`}
								aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
								aria-expanded={mobileMenuOpen}
								onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
							>
								{#if mobileMenuOpen}
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="1.8"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								{:else}
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="1.8"
											d="M4 7h16M4 12h16M4 17h16"
										/>
									</svg>
								{/if}
							</button>
						</div>
					</div>
				</div>

				{#if mobileMenuOpen}
					<div
						class="mt-2 overflow-hidden rounded-[1.25rem] border border-white/24 bg-[#1b1918]/92 p-3 text-white shadow-[0_22px_60px_rgba(27,25,24,0.22)] backdrop-blur-xl lg:hidden"
					>
						<form action="/search" method="GET">
							<label
								class="flex h-12 items-center gap-3 overflow-hidden rounded-full border border-white/12 bg-white/10 pr-3 pl-4 text-white"
							>
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.8"
										d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
								<input
									type="search"
									name="q"
									placeholder="Search premium wall art"
									class="h-full w-full border-0 bg-transparent px-0 text-sm text-white placeholder:text-white/58 focus:ring-0"
								/>
							</label>
						</form>

						<nav class="mt-3 grid grid-cols-2 gap-2" aria-label="Mobile navigation">
							{#each primaryNavItems as item}
								<a
									href={item.href}
									class={`rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
										page.url.pathname === item.href ||
										(item.href !== '/' && page.url.pathname.startsWith(item.href))
											? 'bg-[#c5a880] text-[#1b1918] shadow-[0_12px_28px_rgba(200,255,70,0.16)]'
											: 'bg-white/9 text-white hover:bg-white/16'
									}`}
									onclick={() => (mobileMenuOpen = false)}
								>
									{item.label}
								</a>
							{/each}
						</nav>

						<div
							class="mt-3 flex items-center justify-between rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-xs font-semibold text-white"
						>
							<span>Free delivery over Rs. 15,000</span>
							<span class="text-[#c5a880]">PKR</span>
						</div>
					</div>
				{/if}
			</div>
		</header>
	{/if}


	<!-- Main Content -->
	<main class="flex-grow">
		{@render children()}
	</main>

	{#if !isAdminRoute}
		<div
			class="fixed right-4 bottom-5 z-50 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6"
		>
			<a
				href={primaryWhatsAppHref}
				target="_blank"
				rel="noreferrer"
				class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/95 bg-[#25D366] text-white shadow-[0_12px_24px_rgba(27,25,24,0.22)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#1fb95a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366] sm:h-10 sm:w-10"
				aria-label="Contact Zylowalls on WhatsApp"
			>
				<svg
					class="h-5 w-5 translate-x-[0.5px] -translate-y-[0.5px] sm:h-[1.35rem] sm:w-[1.35rem]"
					viewBox="0 0 16 16"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.066 7.926a7.9 7.9 0 0 0 1.057 3.965L0 16l4.204-1.103a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.928-7.93a7.9 7.9 0 0 0-2.325-5.606M7.998 14.524a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.002 3.628-2.959 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.331.065-.133.034-.247-.015-.346-.05-.099-.445-1.076-.612-1.47-.16-.39-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.397 2.132 3.383 2.992.473.205.842.327 1.13.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"
					/>
				</svg>
			</a>
		</div>

		<!-- Minimal Footer -->
		<footer class="bg-black pt-16 pb-8 text-white">
			<div class="mx-auto max-w-7xl px-4 text-center sm:px-6 md:text-left lg:px-8">
				<div class="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-4">
					<div class="col-span-1 md:col-span-1">
						<h3 class="mb-6 text-xl"><ZylowallsWordmark /></h3>
						<p class="text-sm font-light text-gray-400">
							Elevating home decor with premium wall art, acrylic calligraphy, and timeless craftsmanship.
						</p>
					</div>
					<div>
						<h4 class="mb-6 text-sm font-medium tracking-widest text-gray-200 uppercase">Shop</h4>
						<ul class="space-y-4 text-sm font-light text-gray-400">
							<li><a href="/shop" class="transition-colors hover:text-gold">All Products</a></li>
							<li>
								<a href="/collections" class="transition-colors hover:text-gold">Categories</a>
							</li>
							<li>
								<a href="/search" class="transition-colors hover:text-gold">Search Catalog</a>
							</li>
							<li>
								<a href="/track" class="transition-colors hover:text-gold font-semibold text-white">Track Order</a>
							</li>
							<li>
								<a href="/size-guide" class="transition-colors hover:text-gold">Size Guide</a>
							</li>
						</ul>
					</div>
					<div>
						<h4 class="mb-6 text-sm font-medium tracking-widest text-gray-200 uppercase">Policies</h4>
						<ul class="space-y-4 text-sm font-light text-gray-400">
							<li><a href="/contact" class="transition-colors hover:text-gold">Contact Us</a></li>
							<li>
								<a href="/policies/shipping" class="transition-colors hover:text-gold">Shipping Policy</a>
							</li>
							<li>
								<a href="/policies/returns" class="transition-colors hover:text-gold">Returns & Exchanges</a>
							</li>
							<li>
								<a href="/faq" class="transition-colors hover:text-gold">Shipping & Returns FAQ</a>
							</li>
							<li>
								<a href="/policies/terms" class="transition-colors hover:text-gold">Terms & Conditions</a>
							</li>
							<li>
								<a href="/policies/privacy" class="transition-colors hover:text-gold">Privacy Policy</a>
							</li>
						</ul>
					</div>
					<div>
						<h4 class="mb-6 text-sm font-medium tracking-widest text-gray-200 uppercase">Contact</h4>
						<ul class="space-y-4 text-sm font-light text-gray-400">
							<li>
								<span class="block text-xs font-medium tracking-wider text-gray-500 uppercase">Email</span>
								<a
									href="https://mail.google.com/mail/?view=cm&fs=1&to=Zylowalls@gmail.com"
									target="_blank"
									rel="noreferrer"
									class="transition-colors hover:text-gold"
								>
									Zylowalls@gmail.com
								</a>
							</li>
							<li>
								<span class="block text-xs font-medium tracking-wider text-gray-500 uppercase">Phone & WhatsApp</span>
								<div class="mt-1 flex flex-col gap-1">
									<a href="tel:+923703772463" class="transition-colors hover:text-gold">
										📞 +92 370 3772463 (Call)
									</a>
									<a href={primaryWhatsAppHref} target="_blank" rel="noreferrer" class="transition-colors hover:text-gold">
										💬 Chat on WhatsApp
									</a>
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div
					class="mt-16 flex flex-col items-center justify-between border-t border-gray-800 pt-8 md:flex-row"
				>
					<div class="text-center text-xs text-gray-500 md:text-left">
						<p>&copy; 2026 <ZylowallsWordmark class="text-[0.9em]" />. All rights reserved.</p>
					</div>
					<div class="mt-4 flex flex-wrap items-center gap-3 text-gray-500 md:mt-0">
						<a
							href="https://facebook.com"
							target="_blank"
							rel="noreferrer"
							class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:border-[#1877F2]/50 hover:bg-[#1877F2]"
							aria-label="Zylowalls Facebook"
						>
							<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
							</svg>
						</a>
						<a
							href="https://instagram.com"
							target="_blank"
							rel="noreferrer"
							class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:border-[#E4405F]/50 hover:bg-[#E4405F]"
							aria-label="Zylowalls Instagram"
						>
							<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
							</svg>
						</a>
						<a
							href="https://pinterest.com"
							target="_blank"
							rel="noreferrer"
							class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:border-[#E60023]/50 hover:bg-[#E60023]"
							aria-label="Zylowalls Pinterest"
						>
							<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.604 0 12.017 0z"/>
							</svg>
						</a>
						<a
							href="https://www.tiktok.com/@_zylowalls_"
							target="_blank"
							rel="noreferrer"
							class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:border-white/30 hover:bg-white/12"
							aria-label="Zylowalls TikTok"
						>
							<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path
									d="M16.6 2.1c.3 2.5 1.7 4 4.2 4.2v4.1c-1.5.1-2.8-.3-4.1-1.1v6.1c0 4.5-4.9 7.3-8.8 5-3.7-2.2-3.6-7.7.2-9.8 1.2-.7 2.4-.9 3.8-.7v4.2c-.3-.1-.6-.1-.9-.1-1.9 0-3 2.1-2 3.7.9 1.5 3.3 1.3 4-.3.2-.4.2-.9.2-1.4V2.1h3.4z"
								/>
							</svg>
						</a>
						<a
							href={primaryWhatsAppHref}
							target="_blank"
							rel="noreferrer"
							class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:border-[#25D366]/50 hover:bg-[#25D366]"
							aria-label="Zylowalls WhatsApp"
						>
							<svg class="h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
								<path
									d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.066 7.926a7.9 7.9 0 0 0 1.057 3.965L0 16l4.204-1.103a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.928-7.93a7.9 7.9 0 0 0-2.325-5.606M7.998 14.524a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.002 3.628-2.959 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.331.065-.133.034-.247-.015-.346-.05-.099-.445-1.076-.612-1.47-.16-.39-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.397 2.132 3.383 2.992.473.205.842.327 1.13.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"
								/>
							</svg>
						</a>
					</div>
				</div>
				<div
					class="mt-8 flex items-center justify-center gap-2 border-t border-gray-800 pt-7 text-center"
				>
					<span class="text-xs font-bold tracking-[0.14em] text-white/45 uppercase">
						Developed by
					</span>
					<a
						href="https://voquarn.com"
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center gap-2 text-sm font-black tracking-[0.16em] text-white uppercase transition-colors hover:text-[#c5a880] sm:text-base"
					>
						<img
							src="/final%20logo%20bhai%20shb.png"
							alt=""
							class="h-6 w-6 rounded-full object-cover ring-1 ring-white/20"
							loading="lazy"
						/>
						<span>Voquarn Code</span>
					</a>
				</div>
			</div>
		</footer>
	{/if}
</div>

<style>
	.brand-adaptive-text {
		color: #1b1918;
		text-shadow:
			0 1px 8px rgba(255, 255, 255, 0.94),
			0 2px 16px rgba(255, 255, 255, 0.62),
			0 1px 10px rgba(20, 53, 45, 0.2);
	}

	.route-loading-pill {
		animation: route-loading-needle 1400ms cubic-bezier(0.65, 0, 0.35, 1) infinite both;
		transform-box: fill-box;
		transform-origin: center;
	}

	@keyframes route-loading-needle {
		0% {
			opacity: 0.78;
			transform: scale(0.94);
		}
		50% {
			opacity: 1;
			transform: scale(1.08);
		}
		100% {
			opacity: 0.78;
			transform: scale(0.94);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.route-loading-pill {
			animation: none;
		}
	}

	/* Announcement ticker */
	:global(.ann-track) {
		display: flex;
		width: max-content;
		align-items: center;
		animation: ann-scroll 22s linear infinite;
		will-change: transform;
	}

	:global(.ann-item) {
		flex-shrink: 0;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #f5ead8;
		padding: 0 1.5rem;
		white-space: nowrap;
	}

	:global(.ann-sep) {
		flex-shrink: 0;
		font-size: 0.45rem;
		color: #c5a880;
		opacity: 0.7;
	}

	@keyframes ann-scroll {
		from { transform: translateX(-50%); }
		to   { transform: translateX(0); }
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.ann-track) {
			animation: none;
		}
	}
</style>
