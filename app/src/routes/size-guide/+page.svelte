<script lang="ts">
	import { page } from '$app/state';
	import { SITE_IMAGE, SITE_NAME, absoluteUrl, breadcrumbJsonLd, faqJsonLd } from '$lib/shared/seo';

	const sizeGuideDescription =
		'Choose the perfect size for your wood or acrylic wall art with the Zylowalls sizing guide. Find ideal dimensions for your living room, bedroom, or entryway.';
	let sizeGuideSocialImage = $derived(absoluteUrl(SITE_IMAGE, page.url.origin));
	let sizeGuideFaqJsonLd = faqJsonLd([
		{
			question: 'What size wall art is best for a living room?',
			answer:
				'For a living room, we recommend a Large (60×80cm or 80×100cm) or Extra Large (100×120cm) piece as the main focal point. Group smaller pieces for a gallery wall effect.'
		},
		{
			question: 'What size is suitable for a bedroom?',
			answer:
				'A Medium (40×60cm) or Large (60×80cm) piece above the headboard works beautifully. For smaller walls, a Small (30×40cm) piece is a refined accent.'
		},
		{
			question: 'Can I order a custom size?',
			answer:
				'Yes! Zylowalls specializes in custom sizes. Contact us via WhatsApp and share your wall dimensions for a tailored quote.'
		},
		{
			question: 'How do I measure my wall before ordering?',
			answer:
				'Use a tape measure to find the width and height of the wall space. Leave at least 10-15cm on each side for visual breathing room. Our team can advise on the best fit.'
		}
	]);
	let sizeGuideBreadcrumbJsonLd = $derived(
		breadcrumbJsonLd(
			[{ name: 'Home', url: '/' }, { name: 'Size Guide', url: '/size-guide' }],
			page.url.origin
		)
	);
</script>

<svelte:head>
	<title>Wall Art Size Guide | Zylowalls</title>
	<meta name="description" content={sizeGuideDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={`Wall Art Size Guide | ${SITE_NAME}`} />
	<meta property="og:description" content={sizeGuideDescription} />
	<meta property="og:image" content={sizeGuideSocialImage} />
	<meta name="twitter:title" content={`Wall Art Size Guide | ${SITE_NAME}`} />
	<meta name="twitter:description" content={sizeGuideDescription} />
	<meta name="twitter:image" content={sizeGuideSocialImage} />
	{@html sizeGuideFaqJsonLd}
	{@html sizeGuideBreadcrumbJsonLd}
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
	<!-- Header -->
	<div class="mb-14 text-center">
		<h1 class="mb-4 font-serif text-3xl tracking-widest text-black uppercase md:text-4xl">
			Wall Art Sizing Guide
		</h1>
		<div class="mx-auto mb-6 h-[1px] w-12 bg-gold"></div>
		<p class="mx-auto max-w-xl leading-relaxed font-light text-gray-500">
			Ensure your Zylowalls art fits your space beautifully. Wall decorations feel most balanced when they occupy 60% to 75% of the available wall space. Explore our layout guide below.
		</p>
	</div>

	<!-- How to Measure your wall -->
	<div class="mb-14 border border-gray-200 bg-cream p-8 md:p-12">
		<h2 class="mb-8 text-center font-serif text-xl tracking-widest text-black uppercase">
			How to Choose the Right Size
		</h2>
		<div class="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
			<div>
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-gold text-gold"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M4 6h16M4 12h16M4 18h16"
						/></svg
					>
				</div>
				<h3 class="mb-3 text-sm font-bold tracking-widest uppercase">Measure Your Furniture</h3>
				<p class="text-sm leading-relaxed font-light text-gray-500">
					If hanging art above a sofa, bed, or dining table, aim for the artwork width to be roughly 2/3 to 3/4 the width of the furniture below it.
				</p>
			</div>
			<div>
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-gold text-gold"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
						/></svg
					>
				</div>
				<h3 class="mb-3 text-sm font-bold tracking-widest uppercase">Eye-Level Rule</h3>
				<p class="text-sm leading-relaxed font-light text-gray-500">
					The center of the artwork or the middle point of a panel set should hang at approximately 57 to 60 inches from the floor (standard human eye level).
				</p>
			</div>
			<div>
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-gold text-gold"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M12 4v16m8-8H4"
						/></svg
					>
				</div>
				<h3 class="mb-3 text-sm font-bold tracking-widest uppercase">Spacing Panel Sets</h3>
				<p class="text-sm leading-relaxed font-light text-gray-500">
					When hanging multi-panel sets (e.g. 3-piece sets), leave exactly 1 to 2 inches of spacing between the panels to maintain a continuous visual flow.
				</p>
			</div>
		</div>
	</div>

	<!-- Size Chart Table -->
	<h2 class="mb-6 text-center font-serif text-xl tracking-widest text-black uppercase">
		Standard Art Dimensions
	</h2>
	<div class="mb-14 overflow-x-auto">
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr class="bg-black text-white">
					<th class="px-6 py-4 text-left text-xs font-medium tracking-widest uppercase"
						>Art / Panel Layout</th
					>
					<th class="px-6 py-4 text-left text-xs font-medium tracking-widest uppercase"
						>Dimensions (Inches)</th
					>
					<th class="px-6 py-4 text-left text-xs font-medium tracking-widest uppercase"
						>Dimensions (Metric)</th
					>
					<th class="px-6 py-4 text-left text-xs font-medium tracking-widest uppercase"
						>Ideal Placement</th
					>
				</tr>
			</thead>
			<tbody>
				{#each [
					{ layout: 'Small Single Accent', inches: '12" x 12" / 12" x 16"', metric: '30x30 cm / 30x40 cm', placement: 'Bedside tables, study desks, cozy pillars, narrow corridors' },
					{ layout: 'Medium Single Core', inches: '16" x 16" / 16" x 24"', metric: '40x40 cm / 40x60 cm', placement: 'Office rooms, entryways, kitchen walls, smaller bedrooms' },
					{ layout: 'Large Centerpiece', inches: '24" x 24" / 24" x 36"', metric: '60x60 cm / 60x90 cm', placement: 'Above console tables, fireplace mantels, accent walls' },
					{ layout: '3-Piece Set (Standard)', inches: '12" x 24" each (36" total width)', metric: '30x60 cm each', placement: 'Above 3-seater sofas, queen-size beds, dining rooms' },
					{ layout: '3-Piece Set (Large)', inches: '16" x 32" each (48" total width)', metric: '40x80 cm each', placement: 'Above king-size beds, grand living room walls, office lobbies' }
				] as row, i}
					<tr
						class="{i % 2 === 0
							? 'bg-white'
							: 'bg-gray-50'} border-b border-gray-100 transition-colors hover:bg-cream"
					>
						<td class="px-6 py-4 font-medium text-black">{row.layout}</td>
						<td class="px-6 py-4 text-gray-600">{row.inches}</td>
						<td class="px-6 py-4 text-gray-600">{row.metric}</td>
						<td class="px-6 py-4 text-gray-600">{row.placement}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Custom Sizing -->
	<div class="border-t border-gray-200 pt-12 text-center">
		<h2 class="mb-4 font-serif text-xl tracking-widest text-black uppercase">
			Need Custom Dimensions?
		</h2>
		<p class="mx-auto mb-8 max-w-lg leading-relaxed font-light text-gray-500">
			We specialize in tailor-made wall decorations! If you have a specific size, layout, or design in mind, reach out to us via WhatsApp, and our design team will customize it for your home.
		</p>
		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<a
				href="/contact"
				class="border border-black px-8 py-3 text-sm tracking-widest text-black uppercase transition-colors hover:bg-gray-50"
				>Contact Us</a
			>
			<a
				href="https://wa.me/923703772463"
				target="_blank"
				rel="noreferrer"
				class="flex items-center justify-center gap-2 bg-[#25D366] px-8 py-3 text-sm tracking-widest text-white uppercase transition-opacity hover:opacity-90"
			>
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"
					><path
						d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
					/></svg
				>
				Chat with Designer on WhatsApp
			</a>
		</div>
	</div>
</div>
