<script>
	import { base } from '$app/paths';
</script>
<div class='flex flex-col items-center container py-16 justify-center'><img
	src='/cdn/images/Frame.png' alt='profile'
	draggable='false' class='w-1/2 md:w-52 mb-8'>
	<h1 style='color:#0C032F' class='font-header text-4xl md:text-5xl text-center font-bold mb-4 flex'>Hi, I’m <p
		class='text-accent ml-2'>Lalit</p>,
	</h1>
	<p class='text-gray-500 text-lg leading-relaxed max-w-xl text-center mb-7'>I design and build websites using tools
		like <span class='highlight'>Svelte, Supabase and Tailwind.</span> When I’m not freelancing I work on my own
		project, <a href='https://eduspace-gxp.vercel.app' target='_blank'><strong>EduSpace</strong></a>
	</p>
	<div class='flex space-x-4'><a
		class='border-2 border-accent rounded py-2 active:scale-90 transition duration-300 text-sm md:text-base px-4 bg-accent text-white'
		href='{base}/#contact'>Contact Me</a><a
		class='border-2 border-accent rounded py-2 active:scale-90 transition duration-300 text-sm md:text-base px-4 hover:bg-accent hover:text-white'
		href='{base}/blog'>My
		Blog</a>
	</div>
</div>
