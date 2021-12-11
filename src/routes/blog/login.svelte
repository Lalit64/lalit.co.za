<script lang='ts'>
	import type { User } from '$lib/types';
	import user from '$lib/user';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';

	// onMount(() => {
	// 	if ($user) goto('/blog');
	// });

	async function login() {
		const res = await fetch('http://localhost:1337/api/auth/local', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({ identifier: email, password })
		});
		if (res.ok) {
			const data: {user: User, jwt: string} = await res.json();
			localStorage.setItem("token", data.jwt)
			if (data) {
				$user = data.user;
				location.replace('/blog');
			}
		} else {
			const data: { message: { messages: { message: string }[] }[] } = await res.json();
			if (data?.message?.[0]?.messages?.[0]?.message) {
				alert(data.message[0].messages[0].message);
			}
		}
	}


</script>

<div class='min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
	<div class='max-w-md w-full space-y-8'>
		<div>
			<h2 class='mt-6 text-center text-3xl font-extrabold text-gray-900'>
				Sign in to your account
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				For access to create posts on
				<a href="/blog" class="font-medium text-accent">
					my blog!
				</a>
			</p>
		</div>
		<form class='mt-8 space-y-6' on:submit|preventDefault={login}>
			<input type='hidden' name='remember' value='true'>
			<div class='rounded-md shadow-sm -space-y-px'>
				<div>
					<label for='email-address' class='sr-only'>Email address</label>
					<input id='email-address' name='email' type='email' autocomplete='email' required
								 class='appearance-none rounded-none transition relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-accent focus:z-10 sm:text-sm'
								 placeholder='Email address' bind:value={email}>
				</div>
				<div>
					<label for='password' class='sr-only'>Password</label>
					<input id='password' name='password' type='password' autocomplete='current-password' required
								 class='appearance-none transition rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-accent focus:z-10 sm:text-sm'
								 placeholder='Password' bind:value={password}>
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
					Sign in
				</button>
			</div>
		</form>
	</div>
</div>

