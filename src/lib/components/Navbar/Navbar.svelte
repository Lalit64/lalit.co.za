<script>
	import { scrollto } from 'svelte-scrollto';
	import { base } from '$app/paths';
</script>

<div class='pt-28 font-semibold'>
	<div class='fixed top-0 left-0 w-full bg-gradient-to-b from-white to-transparent z-50'>
		<nav class='relative py-5 max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 font-header'
				 aria-label='Global'>
			<div class='space-x-4 text-sm md:text-base md:space-x-10 flex items-center w-full'><a
				class='mr-auto font-bold text-gray-900' href='{base}/'><span class='sr-only'>Lalit  Yalamanchili</span>
				<svg class='w-8 text-accent' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'
						 stroke-width='2.5' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round'>
					<path stroke='none' d='M0 0h24v24H0z' fill='none' />
					<path d='M5 7l5 5l-5 5' />
					<line x1='12' y1='19' x2='19' y2='19' />
				</svg>
			</a>
				<a class='text-gray-600 hover:text-accent transition duration-300' href='{base}/blog'><span class="absolute bg-yellow-400 px-[6px] text-[15px] font-bold rounded-full hover:text-white text-white relative -right-[65px] -top-[8px] md:-right-[75px] md:-top-[8px]">!</span>Articles</a><a
				class='text-gray-600 hover:text-accent hidden sm:flex transition duration-300' href='' use:scrollto={'#work'}>Work</a>
				<a
				class='border-2 border-accent rounded py-2 active:scale-90 transition duration-300 text-sm md:text-base px-4 hover:bg-accent hover:text-white'
				href='' use:scrollto={'#contact'}>Contact Me</a></div>
		</nav>
	</div>
</div>

<style>
	.pt-28 {
			z-index: 3000 !important;
	}
</style>
