<script lang="ts">
	let { class: className = '', ariaLabel = 'Zylowalls' } = $props<{
		class?: string;
		ariaLabel?: string;
	}>();
</script>

<span class={`zylowalls-wordmark ${className}`} aria-label={ariaLabel}>
	<span class="zylowalls-wordmark__z">Z</span><span>y</span><span>l</span><span>o</span><span class="zylowalls-wordmark__w">w</span><span>a</span><span>l</span><span>l</span><span>s</span>
</span>
