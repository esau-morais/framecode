import { Command } from "commander";
import { $ } from "bun";
import { loadConfig } from "../utils/config";
import { logger } from "../utils/logger";
import { themeSchema } from "../../calculate-metadata/theme";
import { copyFile, rm, mkdir } from "fs/promises";
import { extname } from "path";

const PRESETS = {
  tweet: { width: 720, height: 1280 },
  tutorial: { width: 1280, height: 720 },
  square: { width: 720, height: 720 },
} as const;

export const renderCommand = new Command("render")
  .description("Render code files to video")
  .argument("<files...>", "code files to render")
  .option("-o, --output <path>", "output path", "output.mp4")
  .option("-t, --theme <theme>", "syntax theme", "github-dark")
  .option("-p, --preset <preset>", "export preset", "tutorial")
  .option("-f, --fps <number>", "frame rate", "30")
  .option("-w, --width <number>", "custom width")
  .option("-h, --height <number>", "custom height")
  .option("-c, --config <path>", "config file path")
  .action(async (files: string[], options) => {
    const config = await loadConfig(options.config);
    const opts = {
      theme: options.theme ?? config.theme ?? "github-dark",
      preset: options.preset ?? config.preset ?? "tutorial",
      fps: options.fps ?? config.fps ?? "30",
      width: options.width ?? config.width,
      height: options.height ?? config.height,
      output: options.output,
    };

    const result = themeSchema.safeParse(opts.theme);
    if (!result.success) {
      logger.error(`Invalid theme: ${opts.theme}`);
      logger.info(`Run 'framecode themes' to see available themes`);
      process.exit(1);
    }

    await prepareFiles(files);

    const preset =
      PRESETS[opts.preset as keyof typeof PRESETS] ?? PRESETS.tutorial;

    const parseNumber = (
      value: string | undefined,
      name: string,
    ): number | undefined => {
      if (!value) return undefined;
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        logger.error(`Invalid ${name}: ${value} (must be a positive number)`);
        process.exit(1);
      }
      return num;
    };

    const width = parseNumber(opts.width, "width") ?? preset.width;
    const height = parseNumber(opts.height, "height") ?? preset.height;
    const fps = parseNumber(opts.fps, "fps") ?? 30;

    const props = JSON.stringify({
      theme: opts.theme,
      width: opts.width
        ? { type: "fixed", value: Number(opts.width) }
        : { type: "auto" },
    });

    logger.info(`Rendering with theme: ${opts.theme}`);

    try {
      const result =
        await $`bun remotionb render src/index.ts Main ${opts.output} --props=${props} --height=${height} --width=${width} --fps=${fps}`;

      if (!result.exitCode || result.exitCode === 0) {
        logger.success(`Video saved to ${opts.output}`);
      } else {
        throw new Error(`Render process exited with code ${result.exitCode}`);
      }
    } catch (error) {
      logger.error("Rendering failed");
      if (error instanceof Error && error.message) {
        logger.error(error.message);
      }
      throw error;
    } finally {
      await cleanupFiles(files);
    }
  });

async function prepareFiles(files: string[]) {
  await mkdir("public", { recursive: true });

  await Promise.all(
    files.map(async (filePath, i) => {
      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        throw new Error(`File not found: ${filePath}`);
      }
      const ext = extname(filePath);
      await copyFile(filePath, `public/code${i + 1}${ext}`);
    }),
  );
}

async function cleanupFiles(files: string[]) {
  await Promise.all(
    files.map(async (filePath, i) => {
      const ext = extname(filePath);
      await rm(`public/code${i + 1}${ext}`, { force: true });
    }),
  );
}
