<script lang="ts">
	import { page } from '$app/state';
	import ZylowallsWordmark from '$lib/components/ZylowallsWordmark.svelte';
	import { SITE_IMAGE, SITE_NAME, absoluteUrl, breadcrumbJsonLd, jsonLdScript } from '$lib/shared/seo';

	const aboutDescription =
		'The story of Zylowalls, started by university friends Chand Baloch and Mubashir Ali to bring premium handcrafted wood and acrylic wall art to modern homes.';
	let aboutSocialImage = $derived(absoluteUrl(SITE_IMAGE, page.url.origin));
	let aboutJsonLd = $derived(
		jsonLdScript({
			'@context': 'https://schema.org',
			'@type': 'AboutPage',
			name: `About ${SITE_NAME}`,
			description: aboutDescription,
			url: absoluteUrl('/about', page.url.origin)
		})
	);
	let aboutBreadcrumbJsonLd = $derived(
		breadcrumbJsonLd(
			[{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }],
			page.url.origin
		)
	);
</script>

<svelte:head>
	<title>About Zylowalls | Our Story</title>
	<meta name="description" content={aboutDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={`About ${SITE_NAME} | Our Story`} />
	<meta property="og:description" content={aboutDescription} />
	<meta property="og:image" content={aboutSocialImage} />
	<meta name="twitter:title" content={`About ${SITE_NAME} | Our Story`} />
	<meta name="twitter:description" content={aboutDescription} />
	<meta name="twitter:image" content={aboutSocialImage} />
	{@html aboutJsonLd}
	{@html aboutBreadcrumbJsonLd}
</svelte:head>

<section
	class="relative isolate -mt-[4.25rem] overflow-hidden bg-[#1b1918] text-white md:-mt-[4.75rem]"
>
	<img
		src="/acrylic_calligraphy.png"
		alt="Zylowalls calligraphy art"
		width="1670"
		height="941"
		class="absolute inset-0 -z-30 h-full w-full object-cover object-center opacity-40"
		fetchpriority="high"
	/>
	<div class="absolute inset-0 -z-20 bg-black/60"></div>
	<div
		class="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#fbfaf7] via-[#fbfaf7]/20 to-transparent"
	></div>

	<div
		class="mx-auto flex min-h-[min(680px,82svh)] max-w-7xl items-end px-4 pt-28 pb-10 sm:px-6 md:pt-32 lg:px-8"
	>
		<div class="max-w-3xl">
			<p class="mb-4 text-xs font-black tracking-[0.22em] text-[#c5a880] uppercase">Our Story</p>
			<h1 class="font-serif text-4xl leading-[0.96] uppercase sm:text-6xl md:text-7xl">
				<ZylowallsWordmark class="text-white" />
			</h1>
			<p class="mt-6 max-w-2xl text-base leading-7 font-medium text-white/86 sm:text-lg">
				Premium wood & acrylic wall art crafted to make your home decoration feel intentional, beautiful, and luxury.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<a
					href="/shop"
					class="inline-flex min-h-12 items-center justify-center rounded-full bg-[#c5a880] px-6 text-sm font-black text-[#1b1918] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
				>
					Shop Wall Art
				</a>
				<a
					href="/contact"
					class="inline-flex min-h-12 items-center justify-center rounded-full border border-white/42 bg-white/12 px-6 text-sm font-black text-white backdrop-blur-md transition-colors hover:bg-white hover:text-[#1b1918] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
				>
					Talk to Us
				</a>
			</div>
		</div>
	</div>
</section>

<section class="bg-[#fbfaf7] px-4 py-16 text-[#1b1918] sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		<p class="mb-4 text-xs font-black tracking-[0.2em] text-[#c5a880] uppercase">
			How Zylowalls Started
		</p>
		<h2 class="font-serif text-3xl leading-tight uppercase sm:text-5xl">
			From two university friends to a premium wall art brand.
		</h2>

		<div class="mt-8 space-y-6 text-base leading-8 font-medium text-[#596c62] sm:text-lg">
			<p>
				Zylowalls started with two friends,
				<strong class="font-black text-[#1b1918]">Chand Baloch</strong> and
				<strong class="font-black text-[#1b1918]">Mubashir Ali</strong>. During university, they
				would often talk about their future and plan the kind of business they wanted to build after
				graduation.
			</p>
			<p>
				After graduating, they decided to begin with handcrafted wall art: combining modern laser-cut technology with premium wood and acrylic materials to create stunning calligraphy and wall panels that bring style and serenity to any room.
			</p>
			<p>
				They prepared their first pieces and uploaded their first product showcase video. The response was overwhelming. Art lovers appreciated the high-gloss finishes and intricate details, and from that moment the brand began to grow. What started as a plan between two university friends became
				<strong class="font-black text-[#1b1918]"> Zylowalls</strong>.
			</p>
		</div>
	</div>
</section>
