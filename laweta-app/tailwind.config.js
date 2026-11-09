/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#FD6701", dark: "#E05A00", soft: "#FFEFE3" },
        ink: { DEFAULT: "#141414", 2: "#1F1F22", 3: "#323236" }, ok: "#1DB954", bad: "#E5383B", muted: "#8A97A8", paper: "#F7F8FA",
      },
      fontFamily: { sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      boxShadow: { card: "0 2px 12px rgba(15,27,45,.08)" },
    },
  },
  plugins: [],
};
