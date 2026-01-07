import * as p from "@clack/prompts";
import chalk from "chalk";
import { basename } from "path";
import { themeSchema } from "../../calculate-metadata/theme";
import {
  animationSchema,
  presetSchema,
  presetDimensions,
} from "../../calculate-metadata/schema";
import { saveConfig, type Config } from "./config";
import type { StepConfig } from "./process-code";

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
  stepConfigs?: StepConfig[];
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
  const needsOutputPrompt = opts.output === "output.mp4";

  const defaultTheme = opts.theme ?? opts.config?.theme ?? "github-dark";
  const defaultAnimation = opts.animation ?? opts.config?.animation ?? "morph";
  const defaultPreset = opts.preset ?? opts.config?.preset ?? "tutorial";

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

      theme: () => promptThemeSelect(defaultTheme),

      animation: () =>
        p.select({
          message: "Pick an animation",
          initialValue: defaultAnimation,
          options: ANIMATIONS.map((a) => ({
            value: a as string,
            label: a,
            hint:
              a === "morph"
                ? "smooth transitions"
                : a === "typewriter"
                  ? "character reveal"
                  : "line-by-line",
          })),
        }),

      preset: () =>
        p.select({
          message: "Pick a preset",
          initialValue: defaultPreset,
          options: PRESETS.map((pr) => {
            const dims = presetDimensions[pr];
            return {
              value: pr as string,
              label: pr,
              hint: `${dims.width}x${dims.height}`,
            };
          }),
        }),

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
  const theme = group.theme as string;
  const animation = group.animation as string;
  const preset = group.preset as string;
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

  let stepConfigs: StepConfig[] | undefined;

  if (selectedFiles.length > 1) {
    const configurePerStep = await p.confirm({
      message: "Configure animation per file?",
      initialValue: false,
    });

    if (p.isCancel(configurePerStep)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    if (configurePerStep) {
      stepConfigs = await promptPerStepConfig(selectedFiles, animation, cps);
    }
  }

  if (!opts.yes) {
    const summaryLines = [
      `${chalk.dim("Files:")}     ${selectedFiles.join(", ")}`,
      `${chalk.dim("Theme:")}     ${theme}`,
      `${chalk.dim("Animation:")} ${animation}`,
      `${chalk.dim("Preset:")}    ${preset} (${dims.width}x${dims.height})`,
      `${chalk.dim("Output:")}    ${output}`,
      `${chalk.dim("CPS:")}       ${cps}`,
      `${chalk.dim("FPS:")}       ${fps}`,
    ];

    if (stepConfigs && stepConfigs.length > 0) {
      summaryLines.push("");
      summaryLines.push(chalk.dim("Per-file overrides:"));
      for (const sc of stepConfigs) {
        const parts = [`  ${sc.file}:`];
        if (sc.animation) parts.push(`animation=${sc.animation}`);
        if (sc.charsPerSecond) parts.push(`cps=${sc.charsPerSecond}`);
        summaryLines.push(parts.join(" "));
      }
    }

    p.note(summaryLines.join("\n"), "Summary");

    const confirmed = await p.confirm({
      message: "Proceed with render?",
      initialValue: true,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel("Render cancelled");
      process.exit(0);
    }
  }

  const configChanged =
    theme !== opts.config?.theme ||
    animation !== opts.config?.animation ||
    preset !== opts.config?.preset;

  if (configChanged) {
    const saved = await saveConfig({
      theme: theme as Config["theme"],
      animation: animation as Config["animation"],
      preset: preset as Config["preset"],
    });
    if (saved) {
      p.log.info(chalk.dim("Settings saved to config"));
    }
  }

  return { ...result, stepConfigs };
}

async function promptPerStepConfig(
  files: string[],
  defaultAnimation: string,
  defaultCps: number,
): Promise<StepConfig[]> {
  const stepConfigs: StepConfig[] = [];

  for (const filePath of files) {
    const filename = basename(filePath);

    p.log.step(`Configure ${chalk.cyan(filename)}`);

    const stepAnimation = await p.select({
      message: `Animation for ${filename}`,
      options: [
        { value: "__default__", label: `Use default (${defaultAnimation})` },
        ...ANIMATIONS.map((a) => ({
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
      ],
    });

    if (p.isCancel(stepAnimation)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    const animationValue =
      stepAnimation === "__default__" ? undefined : (stepAnimation as string);

    let cpsValue: number | undefined;

    if (animationValue === "typewriter") {
      const stepCps = await p.text({
        message: `Chars per second for ${filename}`,
        initialValue: String(defaultCps),
        validate: (value) => {
          const num = Number(value);
          if (isNaN(num) || num <= 0) return "Must be a positive number";
        },
      });

      if (p.isCancel(stepCps)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      cpsValue = Number(stepCps);
      if (cpsValue === defaultCps) cpsValue = undefined;
    }

    if (animationValue || cpsValue) {
      stepConfigs.push({
        file: filename,
        animation: animationValue as StepConfig["animation"],
        charsPerSecond: cpsValue,
      });
    }
  }

  return stepConfigs;
}

async function promptThemeSelect(defaultTheme: string): Promise<string> {
  const isPopular = POPULAR_THEMES.includes(
    defaultTheme as (typeof POPULAR_THEMES)[number],
  );

  const theme = await p.select({
    message: "Pick a theme",
    initialValue: isPopular ? defaultTheme : "__more__",
    options: [
      ...POPULAR_THEMES.map((t) => ({ value: t as string, label: t })),
      { value: "__more__", label: chalk.dim("More themes...") },
    ],
  });

  if (theme === "__more__") {
    const allTheme = await p.autocomplete({
      message: "Pick a theme (all)",
      options: THEMES.map((t) => ({ value: t as string, label: t })),
      initialValue: defaultTheme,
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
