import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],

	build: {
		// Increase chunk size warning threshold
		chunkSizeWarningLimit: 800,
		rollupOptions: {
			output: {
				// Split GSAP into its own chunk so it's lazy-loaded only on pages that need it
				manualChunks(id) {
					if (id.includes('gsap')) return 'gsap';
					if (id.includes('node_modules')) return 'vendor';
				}
			}
		}
	},

	server: {
		watch: {
			usePolling: true,
			interval: 500,
			ignored: ['**/.svelte-kit/**', '**/node_modules/**', '**/.git/**', '**/.vercel/**']
		}
	},

	// Aggressive dependency pre-bundling for faster dev startup
	optimizeDeps: {
		include: ['gsap']
	}
});
