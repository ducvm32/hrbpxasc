import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ghn: {
          DEFAULT: "#F26522",
          50: "#FFF3EC",
          100: "#FFE3D1",
          500: "#F26522",
          600: "#D9541A",
          700: "#B4440F",
        },
      },
    },
  },
  plugins: [],
};

export default config;
