<script lang="ts">
	import { page } from '$app/state';
	import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, jsonLdScript } from '$lib/shared/seo';

	let openFaq = $state<number | null>(0);

	const faqs = [
		{
			question: 'What is your shipping time and delivery charges?',
			answer:
				'Standard shipping within Pakistan costs Rs. 200 and takes 3-5 business days. Orders are dispatched after confirmation.'
		},
		{
			question: 'What is your return and exchange policy?',
			answer:
				'We accept returns and exchanges within 7 days of delivery for undamaged items in original packaging. Custom-made items are non-refundable unless damaged during transit.'
		},
		{
			question: 'What happens if my package arrives damaged?',
			answer:
				'If your order arrives damaged, please take photos/videos and contact us immediately on WhatsApp (+92 370 3772463) or email Zylowalls@gmail.com within 48 hours for a replacement.'
		},
		{
			question: 'Do you offer Cash on Delivery (COD)?',
			answer:
				'Yes, Cash on Delivery is available across Pakistan.'
		},
		{
			question: 'Do you ship internationally?',
			answer:
				'No, currently we only deliver within Pakistan. All orders are shipped with Cash on Delivery nationwide.'
		}
	];

	let faqBreadcrumbs = $derived(
		breadcrumbJsonLd(
			[{ name: 'Home', url: '/' }, { name: 'Shipping & Returns FAQ', url: '/faq' }],
			page.url.origin
		)
	);
</script>

<svelte:head>
	<title>Shipping & Returns FAQ | {SITE_NAME}</title>
	<meta
		name="description"
		content="Find answers to common questions about Zylowalls shipping rates, delivery times, return policy, and order tracking."
	/>
	{@html faqBreadcrumbs}
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
	<div class="mb-12 text-center">
		<h1 class="mb-4 font-serif text-3xl tracking-widest text-black uppercase md:text-4xl">
			Shipping & Returns FAQ
		</h1>
		<p class="text-sm font-light text-gray-500">
			Everything you need to know about delivery, returns, and exchanges.
		</p>
		<div class="mx-auto mt-4 h-[1px] w-12 bg-gold"></div>
	</div>

	<!-- Quick Links Cards -->
	<div class="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<a
			href="/policies/shipping"
			class="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gold hover:shadow-md"
		>
			<div>
				<h2 class="mb-2 font-serif text-lg font-bold text-black group-hover:text-gold">
					Shipping Policy &rarr;
				</h2>
				<p class="text-xs font-light text-gray-600">
					View complete details about Rs. 200 nationwide delivery, international shipping, and dispatch times.
				</p>
			</div>
		</a>

		<a
			href="/policies/returns"
			class="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gold hover:shadow-md"
		>
			<div>
				<h2 class="mb-2 font-serif text-lg font-bold text-black group-hover:text-gold">
					Returns & Exchanges &rarr;
				</h2>
				<p class="text-xs font-light text-gray-600">
					Learn about our 7-day return window, exchange eligibility, and step-by-step return process.
				</p>
			</div>
		</a>
	</div>

	<!-- FAQ Accordion -->
	<div class="space-y-4">
		<h2 class="mb-6 font-serif text-xl tracking-widest text-black uppercase">
			Frequently Asked Questions
		</h2>
		{#each faqs as faq, index}
			<div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
				<button
					type="button"
					onclick={() => (openFaq = openFaq === index ? null : index)}
					class="flex w-full items-center justify-between p-5 text-left text-sm font-medium text-black transition-colors hover:bg-gray-50"
				>
					<span>{faq.question}</span>
					<span class="ml-4 shrink-0 text-gray-400">
						{openFaq === index ? '−' : '+'}
					</span>
				</button>
				{#if openFaq === index}
					<div class="border-t border-gray-100 bg-gray-50/50 p-5 text-sm font-light leading-relaxed text-gray-600">
						{faq.answer}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
