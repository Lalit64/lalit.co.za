<script>
	import { init, sendForm } from 'emailjs-com';

	init('user_dYJ3Bc9nYPV7C1DVJ0sfO');

	let form;
	let thanks = false;

	const sendEmail = () => {
		sendForm('service_dzwxu27', 'template_hbfwq18', form, 'user_dYJ3Bc9nYPV7C1DVJ0sfO')
			.then(function(response) {
				thanks = true;
			}, function(error) {
			});
	};

</script>


<div class='w-full relative bg-accent bg-opacity-20' >
	<div class='absolute -top-16' id='contact'></div>
	<img src='/cdn/graphics/waveTop.svg' alt=''>
	<div class='max-w-screen-lg px-5 flex flex-col md:flex-row mx-auto items-center'>
		<div class='max-w-sm py-14 md:py-24 md:pr-5 md:mr-auto'><h2
			class='text-5xl font-header font-bold text-accent mb-4 text-center md:text-left'>Let’s talk</h2>
			<p class='text-accent text-lg text-center md:text-left'>Want to work with me, ask a question, or just chat?
				Drop me a message and I’ll get back to you <strong>within 48 hours</strong>.</p></div>
		<div class='relative w-full md:w-auto lg:-m-28 lg:p-28'>

			<form
				class='relative p-5 mb-5 md:mb-0 self-stretch rounded-lg bg-white lg:bg-transparent ml-auto md:w-96 space-y-4'
				on:submit|preventDefault={sendEmail}
				bind:this={form}
			>
				<div class='flex flex-col'>
					<label for='email' class='label'>Your Email</label>
					<input id='email' type='email' required
								 class='bg-accent bg-opacity-10 rounded border-0 focus:ring-2 transition duration-150 p-2 focus:outline-none'
								 name='email'>
				</div>
				<div class='flex flex-col'>
					<label class='label'>Your Message</label>
					<textarea required name='message'
										class='resize-none h-24 bg-accent bg-opacity-10 rounded border-0 focus:ring-2 transition duration-150 p-2 ring-accent focus:ring-2 focus:outline-none'></textarea>
				</div>
				<button type='submit'
								class='border-2 border-accent rounded py-2 hover:scale-110 transition duration-300 text-sm md:text-base px-4 active:bg-accent active:text-white'>
					Get in touch
				</button>
				<p class='text-green-600 absolute'>
					{#if thanks}
						Thank You for the feedback.
					{/if}
				</p>
			</form>
		</div>
	</div>
	<img src='/cdn/graphics/waveBottom.svg' alt=''>
</div>

