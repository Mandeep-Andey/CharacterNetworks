/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    dark: 'var(--color-primary-dark)',
                },
                accent: 'var(--color-accent)',
                bg: {
                    white: 'var(--color-bg-white)',
                }
            },
            fontFamily: {
                serif: ['var(--font-serif)', 'serif'],
                sans: ['var(--font-sans)', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
