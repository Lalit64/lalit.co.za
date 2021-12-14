<!-- src/routes/new.svelte -->
<script lang="ts" context="module">
	import type { Load } from '@sveltejs/kit';
	import type { Post } from '$lib/types';

	export const load: Load = async ({ fetch, page: { query } }) => {
		// edit will be an optional query string parameter that'll contain the ID of the post that needs to be updated.
		// If this is set, the post will be updated instead of being created.
		const edit = query.get('edit');

		if (edit) {
			const res = await fetch('http://localhost:1337/posts/' + edit);

			if (res.status === 404) {
				const error = new Error(`The post with ID ${edit} was not found`);
				return { status: 404, error };
			} else {
				const data: Post = await res.json();
				return {
					props: {
						editId: edit,
						title: data.title,
						content: data.content,
						description: data.description
					}
				};
			}
		}

		return { props: {} };
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import user from '$lib/user';
	import { goto } from '$app/navigation';

	export let editId: string;
	export let title = '';
	export let description = '';
	export let content = '';

	onMount(() => {
		if (!$user) goto('/blog/login');
	});

	// To edit the post
	async function editPost() {
		if (!localStorage.getItem('token')) {
			goto('/login');
			return;
		}

		const res = await fetch('http://localhost:1337/posts/' + editId, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: 'Bearer ' + localStorage.getItem('token')
			},
			body: JSON.stringify({ title, description, content })
		});
		if (!res.ok) {
			const data: { message: { messages: { message: string }[] }[] } = await res.json();
			if (data?.message?.[0]?.messages?.[0]?.message) {
				alert(data.message[0].messages[0].message);
			}
		} else {
			const data: Post = await res.json();
			goto('/blog/' + data.id);
		}
	}

	async function createPost() {
		if (!localStorage.getItem('token')) {
			goto('/login');
			return;
		}

		if (editId) {
			// We're supposed to edit, not create
			editPost();
			return;
		}

		const res = await fetch('http://localhost:1337/api/posts', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: 'Bearer ' + localStorage.getItem('token')
			},
			body: JSON.stringify({ title, description, content })
		})
		if (!res.ok) {
			const data: { message: { messages: { message: string }[] }[] } = await res.json();
			if (data?.message?.[0]?.messages?.[0]?.message) {
				alert(data.message[0].messages[0].message);
			}
		} else {
			const data: Post = await res.json();
			goto('/blog/' + data.id);
		}
	}

	let isEditorShown = true;
	let tabSelected = true;
</script>

<div class='min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
	<div class='max-w-md w-full space-y-8'>
		<div>
			<h2 class='mt-6 text-center text-3xl font-extrabold text-gray-900'>
				Create A New Post
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Make Sure to fill out all the fields!
			</p>
		</div>
		<form class='mt-8 space-y-6' on:submit|preventDefault={createPost}>
			<input type='hidden' name='remember' value='true'>
			<div class='rounded-md -space-y-px'>
				<div>
					<label class='sr-only'>Email address</label>
					<input required
								 class=' transition relative block w-full px-3 py-2 border border-gray-30 placeholder-gray-500 my-2 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm shadow'
								 placeholder='Post Title' bind:value={title} >
				</div>
				<div>
					<label class='sr-only'>Password</label>
					<input required
								 class=' transition relative block w-full px-3 py-2 border border-gray-30 placeholder-gray-500 text-gray-900 rounded-lg my-2 focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm shadow'
								 placeholder='Post Description' bind:value={description}  >
				</div>

				<div class='mt-2'>
					<label for='password' class='sr-only'>Password</label>
					<div class='w-full flex '>
						<button type='button' on:click={() => {
							isEditorShown = true
														tabSelected = true
						}} class='w-full border-accent  rounded-t-lg p-2  transition duration-300 border-b-2'>
							Editor
						</button>
					</div>
					{#if isEditorShown}
						<textarea id='password' name='password' autocomplete='current-password' required
											class=' transition resize-auto relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm h-64 shadow'
											placeholder='Post Content' bi
											nd:value={content} ></textarea>
					{/if}
				</div>
			</div>

			<div>
				<button type='submit'
								class='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent'>
          <span class='absolute left-0 inset-y-0 flex items-center pl-3'>
            <!-- Heroicon name: solid/lock-closed -->
            <svg class='h-5 w-5 text-accent group-hover:text-accent' xmlns='http://www.w3.org/2000/svg'
								 viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
              <path fill-rule='evenodd'
										d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
										clip-rule='evenodd' />
            </svg>
          </span>
					Create Post
				</button>
			</div>
		</form>
	</div>
</div>


