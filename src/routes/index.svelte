<script>
	import Navbar from '$lib/components/Navbar/Navbar.svelte';
	import Main from '$lib/components/Main/Main.svelte';
	import Contact from '$lib/components/Contact/Contact.svelte';
	import Work from '$lib/components/Work/Work.svelte';
	import Footer from '$lib/components/Footer/Footer.svelte';
</script>

<Navbar />
<div class='flex items-center justify-center flex-col z-50 w-full'>
	<Main />
	<Contact />
	<Work />
	<Footer />
</div>

<style global>
	img, h1, p, button, form, a {
			z-index: 50 !important;
	}
</style>