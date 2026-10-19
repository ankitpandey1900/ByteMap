/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cat: {
          video: "#3b82f6",
          image: "#ec4899",
          audio: "#8b5cf6",
          document: "#10b981",
          archive: "#f59e0b",
          app: "#06b6d4",
          dev: "#6366f1",
          game: "#f97316",
          other: "#64748b",
        },
        comic: {
          yellow: "#facc15",
          amber: "#f59e0b",
          sky: "#38bdf8",
          red: "#ef4444",
          pink: "#ec4899",
          green: "#22c55e",
          purple: "#a855f7",
          ink: "#0f172a",
        }
      },
      fontFamily: {
        comic: ["Fredoka", "'Comic Neue'", "'Plus Jakarta Sans'", "sans-serif"],
        bangers: ["'Bangers'", "cursive"],
        luckiest: ["'Luckiest Guy'", "cursive"],
        comicNeue: ["'Comic Neue'", "cursive"],
        fredoka: ["Fredoka", "sans-serif"],
        heading: ["'Bangers'", "Fredoka", "sans-serif"],
        sans: ["'Plus Jakarta Sans'", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        comic: "3px 3px 0px #0f172a",
        "comic-sm": "2px 2px 0px #0f172a",
        "comic-lg": "4px 4px 0px #0f172a",
        "comic-xl": "6px 6px 0px #0f172a",
        "comic-hover": "4px 4px 0px #0f172a",
        "comic-pop": "5px 5px 0px #0f172a",
        "comic-yellow": "3px 3px 0px #facc15",
        "comic-pink": "3px 3px 0px #ec4899",
        "comic-cyan": "3px 3px 0px #38bdf8",
      },
      borderWidth: {
        '2.5': '2.5px',
        '3': '3px',
      },
      keyframes: {
        "comic-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-6px)" },
          "50%": { transform: "translateY(2px)" },
          "70%": { transform: "translateY(-3px)" },
        },
        "comic-wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(-3deg)" },
          "30%": { transform: "rotate(2.5deg)" },
          "45%": { transform: "rotate(-2deg)" },
          "60%": { transform: "rotate(1.5deg)" },
          "75%": { transform: "rotate(-1deg)" },
        },
      },
      animation: {
        "comic-bounce": "comic-bounce 0.5s ease",
        "comic-wiggle": "comic-wiggle 0.6s ease-in-out",
      },
    },
  },
  plugins: [],
};
