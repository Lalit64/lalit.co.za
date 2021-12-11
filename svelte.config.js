import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import { resolve } from "path";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		target: '#svelte',
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null
		}),
		vite: {
			resolve: {
				alias: {
					$static: resolve('./static')
				}
			}
		}
	}
};

export default config;
