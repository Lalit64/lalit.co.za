<script lang="ts">
	import type { User } from '$lib/types';
	import { goto } from '$app/navigation';
	import user from '$lib/userStore';

	let email = '';
	let password = '';

	async function login() {
		const res = await fetch('http://localhost:1337/auth/local', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({ identifier: email, password })
		});
		if (res.ok) {
			const data: {user: User, jwt: string} = await res.json();
			localStorage.setItem("token", data.jwt)
			if (data) {
				$user = data.user;
				goto('/');
			}
		} else {
			const data: { message: { messages: { message: string }[] }[] } = await res.json();
			if (data?.message?.[0]?.messages?.[0]?.message) {
				alert(data.message[0].messages[0].message);
			}
		}
	}
</script>

<div class='w-screen h-screen flex justify-center items-center bg-gray-100'>
	<form on:submit|preventDefault={login} class='p-10 bg-white rounded-md flex justify-center items-center flex-col shadow-md'>
		<svg xmlns="http://www.w3.org/2000/svg" class="stroke-accent" width="64" height="64" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
			<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
			<path d="M5 7l5 5l-5 5" />
			<line x1="12" y1="19" x2="19" y2="19" />
		</svg>
		<p class='mb-5 text-3xl text-gray-600'>Login</p>
		<div class='flex flex-col w-96'>
			<div class='relative flex-grow my-2'>
				<input type='email' placeholder='Email'
							 class='bg-accent bg-opacity-20 pl-10 w-full placeholder-accent placeholder-opacity-30 rounded border-0 focus:ring-2 transition duration-150 p-2'>
				<div class='absolute top-0 pointer-events-none left-0 h-full px-3 flex items-center align-center'>
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-accent stroke-2" width='22' height='22' viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
						<rect x="3" y="5" width="18" height="14" rx="2" />
						<polyline points="3 7 12 13 21 7" />
					</svg>
				</div>
			</div>
			<div class='relative flex-grow my-2'>
				<input type='password' placeholder='Password'
							 class='bg-accent bg-opacity-20 pl-10 w-full placeholder-accent placeholder-opacity-30 rounded border-0 focus:ring-2 transition duration-150 p-2'>
				<div class='absolute top-0 pointer-events-none left-0 h-full px-3 flex items-center align-center'>
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-accent stroke-2" width="22" height="22" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
						<rect x="5" y="11" width="14" height="10" rx="2" />
						<circle cx="12" cy="16" r="1" />
						<path d="M8 11v-4a4 4 0 0 1 8 0v4" />
					</svg>
				</div>
			</div>
			<button class='bg-accent hover:bg-accent-offset transition text-white font-bold p-2 my-2 rounded w-full' id='login'
							type='submit'><span>Login</span></button>
		</div>
	</form>
</div>
