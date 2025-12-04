/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      keyframes: {
        floatUp: {
          "0%": {
            opacity: 0,
            transform: "translateY(0) scale(1)"
          },
          "20%": {
            opacity: 1,
            transform: "translateY(-10px) scale(1.05)"
          },
          "80%": {
            opacity: 0.9,
            transform: "translateY(-50px) scale(1.12)"
          },
          "100%": {
            opacity: 0,
            transform: "translateY(-70px) scale(1.18)"
          },
              },
            },
            animation: {
              floatUp: "floatUp 1.6s ease-out forwards",
            },
          },
  },
  plugins: [],
}

