/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#FF7A00", dark: "#E06500", soft: "#FFF1E5" },
        ink: { DEFAULT: "#0E1A2B", 2: "#1A2A40", 3: "#2A3B55" }, ok: "#1DB954", bad: "#E5383B", muted: "#8A97A8", paper: "#F7F8FA",
      },
      fontFamily: { sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      boxShadow: { card: "0 2px 12px rgba(15,27,45,.08)" },
    },
  },
  plugins: [],
};
