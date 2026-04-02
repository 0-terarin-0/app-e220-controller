import type { Config } from "tailwindcss";
import { themer } from "tailwindcss-themer";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [
    themer({
      defaultTheme: {
        extend: {
          colors: {
            background: "#ffffff",
            foreground: "#111827",
            primary: "#3b82f6",
            "primary-foreground": "#ffffff",
            secondary: "#6b7280",
            "secondary-foreground": "#ffffff",
            accent: "#ec4899",
            "accent-foreground": "#ffffff",
            border: "#e5e7eb",
          },
        },
      },
      themes: [
        {
          name: "dark",
          extend: {
            colors: {
              background: "#111827",
              foreground: "#f9fafb",
              primary: "#60a5fa",
              "primary-foreground": "#111827",
              secondary: "#9ca3af",
              "secondary-foreground": "#111827",
              accent: "#f472b6",
              "accent-foreground": "#111827",
              border: "#374151",
            },
          },
        },
      ],
    }),
  ],
};
export default config;
