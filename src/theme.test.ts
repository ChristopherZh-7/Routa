/// <reference types="vite/client" />
import type { CssVarsTheme } from "@mui/material/styles";
import { theme } from "./theme";

describe("theme", () => {
  it("defines the macOS light and dark palettes", () => {
    const { colorSchemes } = theme as unknown as CssVarsTheme;
    const light = colorSchemes.light!.palette;
    const dark = colorSchemes.dark!.palette;
    expect(light.primary.main).toBe("#007aff");
    expect(dark.primary.main).toBe("#0a84ff");
    expect(light.background.default).toBe("#e6e6eb");
    expect(dark.background.default).toBe("#111113");
  });

  it("uses an Apple-like font stack and no uppercase buttons", () => {
    expect(theme.typography.fontFamily).toMatch(/^-apple-system/);
    expect(theme.typography.button.textTransform).toBe("none");
  });

  it("flattens Paper, Chip and Button by default", () => {
    expect(theme.components?.MuiPaper?.defaultProps?.variant).toBe("outlined");
    expect(theme.components?.MuiChip?.defaultProps?.variant).toBe("outlined");
    expect(theme.components?.MuiButton?.defaultProps?.disableElevation).toBe(true);
  });
});

describe("no hard-coded colors in pages and components", () => {
  const sources = import.meta.glob(["./pages/**/*.tsx", "./components/**/*.tsx", "!./**/*.test.tsx"], {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  it("found the source files", () => expect(Object.keys(sources).length).toBeGreaterThan(10));

  it.each(Object.entries(sources))("%s uses theme tokens only", (_path, src) => {
    expect(src).not.toMatch(/grey\.\d/);
    expect(src).not.toMatch(/["']#[0-9a-fA-F]{3,8}["']/);
  });
});
