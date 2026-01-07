import { z } from "zod";
import { bundledThemes, type ThemeRegistration } from "shiki";
import React from "react";

export const themeSchema = z.enum([
  "github-dark",
  "github-light",
  "nord",
  "dracula",
  "monokai",
  "tokyo-night",
  "catppuccin-mocha",
  "rose-pine",
  "synthwave-84",
  "material-theme-darker",
  "one-dark-pro",
  "vitesse-dark",
  "vitesse-light",
  "min-dark",
  "min-light",
  "night-owl",
  "ayu-dark",
  "gruvbox-dark-medium",
  "gruvbox-light-medium",
  "everforest-dark",
  "everforest-light",
  "kanagawa-wave",
  "rose-pine-moon",
  "rose-pine-dawn",
  "catppuccin-latte",
  "catppuccin-frappe",
  "catppuccin-macchiato",
  "github-dark-dimmed",
  "github-dark-high-contrast",
  "github-light-high-contrast",
  "dark-plus",
  "light-plus",
  "poimandres",
  "slack-dark",
  "one-light",
  "material-theme-lighter",
  "material-theme-ocean",
  "material-theme-palenight",
  "dracula-soft",
  "houston",
]);

export type Theme = z.infer<typeof themeSchema>;

export async function loadTheme(themeName: Theme): Promise<ThemeRegistration> {
  const themeModule = bundledThemes[themeName as keyof typeof bundledThemes];
  if (!themeModule) {
    throw new Error(`Theme ${themeName} not found in Shiki`);
  }
  const themeData = await themeModule();
  return "default" in themeData ? themeData.default : themeData;
}

export async function getThemeColors(themeName: Theme) {
  const theme = await loadTheme(themeName);
  const colors = theme.colors || {};
  return {
    background: colors["editor.background"] || "#000000",
    foreground: colors["editor.foreground"] || "#ffffff",
    editor: {
      background: colors["editor.background"] || "#000000",
      foreground: colors["editor.foreground"] || "#ffffff",
      lineHighlightBackground: colors["editor.lineHighlightBackground"] || "",
      rangeHighlightBackground: colors["editor.rangeHighlightBackground"] || "",
      selectionBackground: colors["editor.selectionBackground"] || "",
    },
    icon: {
      foreground:
        colors["icon.foreground"] || colors["editor.foreground"] || "#ffffff",
    },
  };
}

export type ThemeColors = Awaited<ReturnType<typeof getThemeColors>>;

export const ThemeColorsContext = React.createContext<ThemeColors | null>(null);

export const useThemeColors = () => {
  const themeColors = React.useContext(ThemeColorsContext);
  if (!themeColors) {
    throw new Error("ThemeColorsContext not found");
  }

  return themeColors;
};

export const ThemeProvider = ({
  children,
  themeColors,
}: {
  readonly children: React.ReactNode;
  readonly themeColors: ThemeColors;
}) => {
  return (
    <ThemeColorsContext.Provider value={themeColors}>
      {children}
    </ThemeColorsContext.Provider>
  );
};
