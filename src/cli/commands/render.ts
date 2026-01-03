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
  .option("--fps <number>", "frame rate", "30")
  .option("--width <number>", "custom width")
  .option("--height <number>", "custom height")
  .option("-c, --config <path>", "config file path")
  .action(async (files: string[], options) => {
    const config = await loadConfig(options.config);
    const opts = { ...config, ...options };

    const result = themeSchema.safeParse(opts.theme);
    if (!result.success) {
      logger.error(`Invalid theme: ${opts.theme}`);
      logger.info(`Run 'framecode themes' to see available themes`);
      process.exit(1);
    }

    await prepareFiles(files);

    const preset =
      PRESETS[opts.preset as keyof typeof PRESETS] ?? PRESETS.tutorial;
    const width = opts.width ? Number(opts.width) : preset.width;
    const height = opts.height ? Number(opts.height) : preset.height;

    const props = JSON.stringify({
      theme: opts.theme,
      width: opts.width
        ? { type: "fixed", value: Number(opts.width) }
        : { type: "auto" },
    });

    logger.info(`Rendering with theme: ${opts.theme}`);

    try {
      await $`bun remotionb render src/index.ts Main ${opts.output} --props=${props} --height=${height} --width=${width} --fps=${opts.fps}`;
    } catch {
      await cleanupFiles(files);
      logger.error("Rendering failed");
      process.exit(1);
    }

    await cleanupFiles(files);

    logger.success(`Video saved to ${opts.output}`);
  });

async function prepareFiles(files: string[]) {
  await mkdir("public", { recursive: true });
  for (let i = 0; i < files.length; i++) {
    const ext = extname(files[i]);
    await copyFile(files[i], `public/code${i + 1}${ext}`);
  }
}

async function cleanupFiles(files: string[]) {
  for (let i = 0; i < files.length; i++) {
    const ext = extname(files[i]);
    await rm(`public/code${i + 1}${ext}`, { force: true });
  }
}
