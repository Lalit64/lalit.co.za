import pages  from 'gh-pages';

pages.publish(
	'build', // path to public directory
	{
		branch: 'gh-pages',
		repo: 'https://github.com/Lalit64/lalit.co.za.git', // Update to point to your repository
		user: {
			name: 'Lalit64', // update to use your name
			email: 'lalit.yalamanchili@gmail.com' // Update to use your email
		},
		dotfiles: true
	},
	() => {
		console.log('Deploy Complete!');
});
