<!-- src/routes/blog/[slug].svelte -->
<script lang="ts" context="module">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ page: { params }, fetch }) => {
		// The params object will contain all of the parameters in the route.
		const { slug } = params;

		// Now, we'll fetch the blog post from Strapi
		const res = await fetch('/posts' + slug);

		// A 404 status means "NOT FOUND"
		if (res.status === 404) {
			// We can create a custom error and return it.
			// SvelteKit will automatically show us an error page that we'll learn to customise later on.
			const error = new Error(`The post with ID ${slug} was not found`);
			return { status: 404, error };
		} else {
			const data = await res.json();
			return { props: { post: data } };
		}
	};
</script>

<script lang="ts">
	import type { Post } from '$lib/types';
	import { onMount } from 'svelte';

	export let post: Post;
	let content = post.content;


</script>

<h1 class="text-center text-4xl mt-4">{post.title}</h1>
<p class="text-center mt-2">By: {post.author.username}</p>

<div class="border border-gray-500 my-4 mx-8 p-6 rounded">

</div>
