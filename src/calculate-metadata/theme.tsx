import { z } from "zod";
import { bundledThemes, type ThemeRegistration } from "shiki";
import React from "react";

export const themeSchema = z.enum([
  "vercel-dark",
  "story-gradients",
  "retro-terminal",
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

export const curatedThemeNames = [
  "vercel-dark",
  "story-gradients",
  "retro-terminal",
  "github-dark",
  "synthwave-84",
] as const;

type CustomThemeName =
  | "vercel-dark"
  | "story-gradients"
  | "retro-terminal";

const customThemes: Record<CustomThemeName, ThemeRegistration> = {
  "vercel-dark": {
    name: "vercel-dark",
    type: "dark",
    semanticHighlighting: true,
    colors: {
      "editor.background": "#050505",
      "editor.foreground": "#efefef",
      "editor.selectionBackground": "#202020",
      "editor.lineHighlightBackground": "#101010",
      "editor.rangeHighlightBackground": "#101010",
      "icon.foreground": "#ffffff",
    },
    tokenColors: [
      { scope: ["comment"], settings: { foreground: "#666666" } },
      { scope: ["keyword"], settings: { foreground: "#f5f5f5" } },
      { scope: ["string"], settings: { foreground: "#d2d2d2" } },
      {
        scope: ["entity.name.function", "support.function"],
        settings: { foreground: "#ffffff" },
      },
      {
        scope: ["variable", "identifier"],
        settings: { foreground: "#d8d8d8" },
      },
      { scope: ["constant.numeric"], settings: { foreground: "#cccccc" } },
      {
        scope: ["storage.type", "entity.name.type"],
        settings: { foreground: "#e7e7e7" },
      },
      { scope: ["punctuation"], settings: { foreground: "#adadad" } },
    ],
  },
  "story-gradients": {
    name: "story-gradients",
    type: "dark",
    semanticHighlighting: true,
    colors: {
      "editor.background": "#14101f",
      "editor.foreground": "#f7f2ff",
      "editor.selectionBackground": "#2a2041",
      "editor.lineHighlightBackground": "#221a34",
      "editor.rangeHighlightBackground": "#221a34",
      "icon.foreground": "#ffffff",
    },
    tokenColors: [
      { scope: ["comment"], settings: { foreground: "#a68fbe" } },
      { scope: ["keyword"], settings: { foreground: "#ffae57" } },
      { scope: ["string"], settings: { foreground: "#ffa7d3" } },
      {
        scope: ["entity.name.function", "support.function"],
        settings: { foreground: "#f4f6ff" },
      },
      {
        scope: ["variable", "identifier"],
        settings: { foreground: "#dbc7ff" },
      },
      { scope: ["constant.numeric"], settings: { foreground: "#9ee6ff" } },
      {
        scope: ["storage.type", "entity.name.type"],
        settings: { foreground: "#ffe28f" },
      },
      { scope: ["punctuation"], settings: { foreground: "#cebce6" } },
    ],
  },
  "retro-terminal": {
    name: "retro-terminal",
    type: "dark",
    semanticHighlighting: true,
    colors: {
      "editor.background": "#030603",
      "editor.foreground": "#80ff9a",
      "editor.selectionBackground": "#113f1a",
      "editor.lineHighlightBackground": "#08210e",
      "editor.rangeHighlightBackground": "#08210e",
      "icon.foreground": "#8effa8",
    },
    tokenColors: [
      { scope: ["comment"], settings: { foreground: "#3f8e50" } },
      { scope: ["keyword"], settings: { foreground: "#66ff85" } },
      { scope: ["string"], settings: { foreground: "#b8ffc8" } },
      {
        scope: ["entity.name.function", "support.function"],
        settings: { foreground: "#a7ffbb" },
      },
      {
        scope: ["variable", "identifier"],
        settings: { foreground: "#80ff9a" },
      },
      { scope: ["constant.numeric"], settings: { foreground: "#8cf5ff" } },
      {
        scope: ["storage.type", "entity.name.type"],
        settings: { foreground: "#6cf57f" },
      },
      { scope: ["punctuation"], settings: { foreground: "#5de275" } },
    ],
  },
};

const isCustomThemeName = (themeName: Theme): themeName is CustomThemeName => {
  return Object.prototype.hasOwnProperty.call(customThemes, themeName);
};

export async function loadTheme(themeName: Theme): Promise<ThemeRegistration> {
  if (isCustomThemeName(themeName)) {
    return customThemes[themeName];
  }

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

export type ThemeVisuals = {
  canvasBackground: string;
  canvasBackgroundImage?: string;
  overlayKind: "none" | "grid" | "scanlines" | "guides";
  overlayOpacity: number;
  codeSurface: string;
  codeBorder: string;
  codeRadius: number;
  codeShadow: string;
  showFilename: boolean;
  filenameColor: string;
  progressTrack: string;
  progressHeight: number;
  progressGap: number;
  progressTop: number;
  accent: string;
};

function getDefaultThemeVisuals(themeColors: ThemeColors): ThemeVisuals {
  return {
    canvasBackground: themeColors.background,
    overlayKind: "none",
    overlayOpacity: 0,
    codeSurface: "transparent",
    codeBorder: "transparent",
    codeRadius: 0,
    codeShadow: "none",
    showFilename: false,
    filenameColor: themeColors.foreground,
    progressTrack:
      themeColors.editor.lineHighlightBackground ||
      themeColors.editor.rangeHighlightBackground ||
      "rgba(255, 255, 255, 0.15)",
    progressHeight: 6,
    progressGap: 12,
    progressTop: 48,
    accent: themeColors.icon.foreground,
  };
}

const visualOverrides: Record<string, Partial<ThemeVisuals>> = {
  "vercel-dark": {
    canvasBackground: "#050505",
    canvasBackgroundImage:
      "radial-gradient(140% 120% at 50% 50%, #0f0f0f 0%, #070707 58%, #020202 100%)",
    overlayKind: "guides",
    overlayOpacity: 0.5,
    codeSurface: "rgba(3, 3, 3, 0.94)",
    codeBorder: "rgba(255, 255, 255, 0.14)",
    codeRadius: 0,
    codeShadow: "0 32px 100px rgba(0, 0, 0, 0.78)",
    showFilename: false,
    filenameColor: "#b7b7b7",
    progressTrack: "rgba(255, 255, 255, 0.16)",
    progressHeight: 3,
    progressGap: 10,
    progressTop: 36,
    accent: "#ffffff",
  },
  "story-gradients": {
    canvasBackground: "#120b1d",
    canvasBackgroundImage:
      "radial-gradient(circle at 12% 8%, rgba(255, 136, 0, 0.5), transparent 46%), radial-gradient(circle at 88% 18%, rgba(255, 0, 128, 0.45), transparent 48%), linear-gradient(135deg, #28124e 0%, #0f1f4f 100%)",
    codeSurface: "rgba(8, 10, 18, 0.82)",
    codeBorder: "rgba(255, 255, 255, 0.28)",
    codeRadius: 20,
    codeShadow: "0 18px 60px rgba(7, 4, 18, 0.5)",
    progressTrack: "rgba(255, 255, 255, 0.2)",
    progressHeight: 4,
    progressTop: 42,
    accent: "#ffffff",
  },
  "retro-terminal": {
    canvasBackground: "#010701",
    canvasBackgroundImage:
      "radial-gradient(circle at 50% 50%, rgba(17, 75, 27, 0.35), transparent 75%)",
    overlayKind: "scanlines",
    overlayOpacity: 0.22,
    codeSurface: "rgba(0, 0, 0, 0.82)",
    codeBorder: "rgba(136, 255, 154, 0.35)",
    codeRadius: 10,
    codeShadow: "0 18px 60px rgba(0, 0, 0, 0.7)",
    showFilename: true,
    filenameColor: "#6cf57f",
    accent: "#8effa8",
  },
  "github-dark": {
    canvasBackground: "#0d1117",
    codeSurface: "rgba(13, 17, 23, 0.92)",
    codeBorder: "rgba(240, 246, 252, 0.12)",
    codeRadius: 10,
    codeShadow: "0 20px 70px rgba(1, 4, 9, 0.55)",
    showFilename: true,
    filenameColor: "#8b949e",
    accent: "#58a6ff",
  },
  "synthwave-84": {
    canvasBackground: "#241b2f",
    canvasBackgroundImage:
      "radial-gradient(circle at 18% 20%, rgba(255, 0, 178, 0.34), transparent 52%), radial-gradient(circle at 82% 0%, rgba(58, 255, 255, 0.24), transparent 45%), linear-gradient(180deg, #2f1f4f 0%, #10081f 100%)",
    overlayKind: "grid",
    overlayOpacity: 0.2,
    codeSurface: "rgba(29, 23, 46, 0.86)",
    codeBorder: "rgba(255, 255, 255, 0.18)",
    codeRadius: 14,
    codeShadow: "0 24px 74px rgba(16, 8, 31, 0.6)",
    accent: "#ff7edb",
  },
};

export function getThemeVisuals(
  themeName: Theme,
  themeColors: ThemeColors,
): ThemeVisuals {
  const defaults = getDefaultThemeVisuals(themeColors);
  const override = visualOverrides[themeName];

  if (!override) {
    return defaults;
  }

  return {
    ...defaults,
    ...override,
  };
}

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
