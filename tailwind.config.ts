import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blackPrimary: "#0F0F0F",
        blackSoft: "#1A1A1A",
        redPrimary: "#D32F2F",
        redMuted: "#E53935",
        redPrimaryHover: "#B71C1C",
        whitePure: "#FFFFFF",
        grayLight: "#F5F5F5",
        grayBorder: "#3A3A3A",
        textPrimary: "#FFFFFF",
        textSecondary: "#B0B0B0",
        darkBg: "#1D1D1C",
        containerBg: "#262626",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
