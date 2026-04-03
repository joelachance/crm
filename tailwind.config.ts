import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1b1a16",
        sand: "#f6efe2",
        mist: "#d7ddd0",
        pine: "#29503b",
        clay: "#e9b17a",
        rose: "#b75c52"
      },
      boxShadow: {
        card: "0 18px 48px rgba(27, 26, 22, 0.08)"
      },
      borderRadius: {
        xl2: "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;

