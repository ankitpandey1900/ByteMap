/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Category colors
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
        // Comic accent palette
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        comic: ["'Luckiest Guy'", "Fredoka", "sans-serif"],
        fredoka: ["Fredoka", "sans-serif"],
        heading: ["Fredoka", "sans-serif"],
        sans: ["'Plus Jakarta Sans'", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        comic: "3px 3px 0px #0f172a",
        "comic-lg": "4px 4px 0px #0f172a",
        "comic-xl": "6px 6px 0px #0f172a",
        "comic-sm": "2px 2px 0px #0f172a",
        "comic-colored": "3px 3px 0px #0f172a, 0 0 0 2px rgba(250, 204, 21, 0.5)",
        "comic-glow-amber": "3px 3px 0px #0f172a, 0 0 12px rgba(245, 158, 11, 0.35)",
        "comic-glow-sky": "3px 3px 0px #0f172a, 0 0 12px rgba(56, 189, 248, 0.35)",
        "comic-glow-pink": "3px 3px 0px #0f172a, 0 0 12px rgba(236, 72, 153, 0.35)",
        "comic-glow-green": "3px 3px 0px #0f172a, 0 0 12px rgba(34, 197, 94, 0.35)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        spotlight: {
          "0%": { opacity: "0", transform: "translate(-72%, -62%) scale(0.5)" },
          "100%": { opacity: "1", transform: "translate(-50%,-40%) scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "comic-wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(-3deg)" },
          "30%": { transform: "rotate(2.5deg)" },
          "45%": { transform: "rotate(-2deg)" },
          "60%": { transform: "rotate(1.5deg)" },
          "75%": { transform: "rotate(-1deg)" },
        },
        "comic-pop": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "80%": { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "comic-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-6px)" },
          "50%": { transform: "translateY(2px)" },
          "70%": { transform: "translateY(-3px)" },
        },
        "comic-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "comic-slide-up": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        spotlight: "spotlight 2s ease .75s 1 forwards",
        shimmer: "shimmer 2s linear infinite",
        "comic-wiggle": "comic-wiggle 0.6s ease-in-out",
        "comic-pop": "comic-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "comic-bounce": "comic-bounce 0.5s ease",
        "comic-float": "comic-float 3s ease-in-out infinite",
        "comic-slide-up": "comic-slide-up 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
