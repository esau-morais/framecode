import * as p from "@clack/prompts";
import chalk from "chalk";
import { themeSchema } from "../../calculate-metadata/theme";
import {
  animationSchema,
  presetSchema,
  presetDimensions,
} from "../../calculate-metadata/schema";
import type { Config } from "./config";

export interface InteractiveOptions {
  files: string[];
  theme?: string;
  animation?: string;
  preset?: string;
  output?: string;
  cps?: number;
  fps?: number;
  yes?: boolean;
  config?: Config;
}

export interface InteractiveResult {
  files: string[];
  theme: string;
  animation: string;
  preset: string;
  output: string;
  cps: number;
  fps: number;
}

const THEMES = themeSchema.options;
const ANIMATIONS = animationSchema.options;
const PRESETS = presetSchema.options;

const POPULAR_THEMES = [
  "github-dark",
  "dracula",
  "nord",
  "tokyo-night",
  "catppuccin-mocha",
  "rose-pine",
  "synthwave-84",
  "one-dark-pro",
] as const;

function getFileSize(filePath: string): string {
  try {
    const file = Bun.file(filePath);
    const bytes = file.size;
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  } catch {
    return "?";
  }
}

export async function runInteractive(
  opts: InteractiveOptions,
): Promise<InteractiveResult> {
  p.intro(chalk.bgCyan.black(" framecode "));

  const needsFilePrompt = opts.files.length > 1;
  const needsThemePrompt = !opts.theme && !opts.config?.theme;
  const needsAnimationPrompt = !opts.animation && !opts.config?.animation;
  const needsPresetPrompt = !opts.preset && !opts.config?.preset;
  const needsOutputPrompt = opts.output === "output.mp4";

  const group = await p.group(
    {
      files: () =>
        needsFilePrompt
          ? p.multiselect({
              message: "Select files to render",
              options: opts.files.map((file) => ({
                value: file,
                label: file,
                hint: getFileSize(file),
              })),
              required: true,
            })
          : Promise.resolve(opts.files),

      theme: () =>
        needsThemePrompt ? promptThemeSelect() : Promise.resolve(null),

      animation: () =>
        needsAnimationPrompt
          ? p.select({
              message: "Pick an animation",
              options: ANIMATIONS.map((a) => ({
                value: a as string,
                label: a,
                hint:
                  a === "morph"
                    ? "smooth transitions"
                    : a === "typewriter"
                      ? "character reveal"
                      : a === "cascade"
                        ? "line-by-line"
                        : "spotlight effect",
              })),
            })
          : Promise.resolve(null),

      preset: () =>
        needsPresetPrompt
          ? p.select({
              message: "Pick a preset",
              options: PRESETS.map((pr) => {
                const dims = presetDimensions[pr];
                return {
                  value: pr as string,
                  label: pr,
                  hint: `${dims.width}x${dims.height}`,
                };
              }),
            })
          : Promise.resolve(null),

      output: ({ results }) =>
        needsOutputPrompt
          ? p.text({
              message: "Output file",
              initialValue: `${(results.files as string[])[0].replace(/\.[^/.]+$/, "")}.mp4`,
              validate: (value) => {
                if (!value) return "Output path required";
                if (!value.endsWith(".mp4")) return "Must end with .mp4";
              },
            })
          : Promise.resolve(null),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    },
  );

  const selectedFiles = group.files as string[];
  const theme =
    (group.theme as string | null) ??
    opts.theme ??
    opts.config?.theme ??
    "github-dark";
  const animation =
    (group.animation as string | null) ??
    opts.animation ??
    opts.config?.animation ??
    "morph";
  const preset =
    (group.preset as string | null) ??
    opts.preset ??
    opts.config?.preset ??
    "tutorial";
  const output = (group.output as string | null) ?? opts.output ?? "output.mp4";
  const cps = opts.cps ?? opts.config?.charsPerSecond ?? 30;
  const fps = opts.fps ?? opts.config?.fps ?? 30;

  const result: InteractiveResult = {
    files: selectedFiles,
    theme,
    animation,
    preset,
    output,
    cps,
    fps,
  };

  const dims = presetDimensions[preset as keyof typeof presetDimensions];

  if (!opts.yes) {
    p.note(
      [
        `${chalk.dim("Files:")}     ${selectedFiles.join(", ")}`,
        `${chalk.dim("Theme:")}     ${theme}`,
        `${chalk.dim("Animation:")} ${animation}`,
        `${chalk.dim("Preset:")}    ${preset} (${dims.width}x${dims.height})`,
        `${chalk.dim("Output:")}    ${output}`,
        `${chalk.dim("CPS:")}       ${cps}`,
        `${chalk.dim("FPS:")}       ${fps}`,
      ].join("\n"),
      "Summary",
    );

    const confirmed = await p.confirm({
      message: "Proceed with render?",
      initialValue: true,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel("Render cancelled");
      process.exit(0);
    }
  }

  return result;
}

async function promptThemeSelect(): Promise<string> {
  const theme = await p.select({
    message: "Pick a theme",
    options: [
      ...POPULAR_THEMES.map((t) => ({ value: t as string, label: t })),
      { value: "__more__", label: chalk.dim("More themes...") },
    ],
  });

  if (theme === "__more__") {
    const allTheme = await p.autocomplete({
      message: "Pick a theme (all)",
      options: THEMES.map((t) => ({ value: t as string, label: t })),
    });
    return allTheme as string;
  }

  return theme as string;
}

export function createRenderSpinner() {
  return p.spinner();
}

export function renderOutro(output: string) {
  p.outro(chalk.green(`Video saved to ${output}`));
}
