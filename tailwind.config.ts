import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        float: "0 20px 60px rgba(16, 24, 40, 0.14)",
        glow: "0 20px 50px rgba(15, 98, 254, 0.18)"
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(255,255,255,0.5), transparent 32%), radial-gradient(circle at bottom right, rgba(31,105,255,0.18), transparent 26%)"
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -10px, 0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" }
        }
      },
      animation: {
        drift: "drift 8s ease-in-out infinite",
        shimmer: "shimmer 8s ease infinite"
      }
    }
  },
  plugins: []
}

export default config

