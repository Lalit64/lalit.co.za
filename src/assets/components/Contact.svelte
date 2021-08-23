<script>
	import emailjs from 'emailjs-com';

	const sendEmail = (e) => {
		e.preventDefault();
		// generate a five digit number for the contact_number variable
		// these IDs from the previous steps
		emailjs
			.sendForm('service_dzwxu27', 'template_hg1rfhs', e.target, 'user_dYJ3Bc9nYPV7C1DVJ0sfO')
			.then(
				function () {
					console.log('SUCCESS!');
				},
				function (error) {
					console.log('FAILED...', error);
				}
			);
		e.target.reset();
	};
</script>

<main class="bd-grid" style="">
	<section class="contact section" id="contact">
		<h2 class="section-title contact-title">Contact<br /></h2>

		<div class="contact__container bd-grid">
			<form on:submit={sendEmail} class="contact__form">
				<input type="text" placeholder="Name" name="name" class="contact__input" />
				<input type="mail" placeholder="Email" class="contact__input" name="email" />
				<!--prettier-ignore-->
				<textarea
					name="message"
					style="resize: none; font-family: Poppins, sans-serif;"
					id=""
					placeholder="Message"
					cols="0"
					rows="10"
					class="contact__input"></textarea>
				<input type="submit" value="Send" class="contact__button button" />
			</form>
		</div>
	</section>
</main>
