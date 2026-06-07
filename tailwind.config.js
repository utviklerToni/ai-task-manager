/** @type {import('tailwindcss').Config} */
module.exports = {
   content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
   ],
   theme: {
      extend: {
         colors: {
            dark: {
               page: '#0a0a0a',
               card: '#141414',
               hover: '#1a1a1a',
               border: '#262626',
               border2: '#333333',
            },
            content: {
               primary: '#ededed',
               secondary: '#888888',
               muted: '#555555',
            },
            accent: {
               cyan: '#06b6d4',
               blue: '#3b82f6',
               purple: '#a855f7',
               green: '#22c55e',
               amber: '#f59e0b',
               red: '#ef4444',
            },
         },
      },
   },
   plugins: [],
};
