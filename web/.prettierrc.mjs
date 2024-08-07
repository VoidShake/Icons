/** @type {import("prettier").Config} */
export default {
   plugins: ['prettier-plugin-astro'],
   semi: false,
   tabWidth: 3,
   printWidth: 120,
   arrowParens: 'avoid',
   singleQuote: true,
   overrides: [
      {
         files: '*.astro',
         options: {
            parser: 'astro',
         },
      },
   ],
}
