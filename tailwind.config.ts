import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceHover: "#F1F5F9",
        ink: "#111827",
        muted: "#64748B",
        line: "#E2E8F0",
        controlBorder: "#64748B",
        accent: "#B91C1C",
        accentHover: "#991B1B",
        accentSoft: "#FEF2F2",
        onAccent: "#FFFFFF",
        success: "#166534",
        caution: "#92400E",
        warning: "#9A3412",
        // Transitional page aliases; use semantic tokens for new components.
        blackPrimary: "#111827",
        blackSoft: "#F1F5F9",
        redPrimary: "#B91C1C",
        redMuted: "#B91C1C",
        redPrimaryHover: "#991B1B",
        whitePure: "#FFFFFF",
        grayLight: "#F8FAFC",
        grayBorder: "#E2E8F0",
        textPrimary: "#111827",
        textSecondary: "#64748B",
        darkBg: "#F8FAFC",
        containerBg: "#FFFFFF",
      },
      boxShadow: {
        card: "0 1px 3px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.04)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
