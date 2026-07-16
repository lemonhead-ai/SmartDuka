import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./features/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { surface: "var(--color-white)", canvas: "var(--color-grey-soft)", line: "var(--color-grey-mid)", muted: "var(--color-grey-text)", ink: "var(--color-black)", accent: "var(--color-accent)" },
      boxShadow: { elevated: "var(--shadow-elevated)" }
    }
  },
  plugins: []
};

export default config;
