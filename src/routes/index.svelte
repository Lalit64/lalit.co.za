<script>
	import Navbar from '$lib/Navbar/Navbar.svelte';
	import Main from '$lib/Main/Main.svelte';
	import Contact from '$lib/Contact/Contact.svelte';
	import Work from '$lib/Work/Work.svelte';
	import Footer from '$lib/Footer/Footer.svelte';
</script>

<Navbar />
<div class='flex items-center justify-center flex-col'>
	<Main />
	<Contact />
	<Work />
	<Footer />
</div>
