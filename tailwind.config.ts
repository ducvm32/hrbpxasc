import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
        ],
      },
      colors: {
        ghn: {
          DEFAULT: "#F26522",
          50: "#FFF3EC",
          100: "#FFE3D1",
          200: "#FFCBA8",
          500: "#F26522",
          // 600/700 đủ tương phản ≥ 4.5:1 với chữ trắng (WCAG AA) — dùng cho nền
          // nút chính và chữ nhấn; #F26522 gốc chỉ đạt ~3.1:1 nên chỉ dùng cho
          // viền/điểm nhấn trang trí, không làm nền cho chữ nhỏ.
          600: "#C2410C",
          700: "#B4440F",
        },
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)",
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.03), 0 4px 16px -4px rgba(15, 23, 42, 0.08)",
        pop: "0 12px 32px -8px rgba(15, 23, 42, 0.18)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "scale-in": "scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slide-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
