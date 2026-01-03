import { Command } from "commander";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { loadConfig } from "../utils/config";
import { logger, ProgressBar } from "../utils/logger";
import {
  themeSchema,
  animationSchema,
  presetSchema,
  presetDimensions,
} from "../../calculate-metadata/schema";
import { basename, join } from "path";
import type { StaticFile } from "../../calculate-metadata/get-files";

const entryPoint = join(import.meta.dir, "../../index.ts");

async function readFiles(files: string[]): Promise<StaticFile[]> {
  return Promise.all(
    files.map(async (filePath) => {
      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        throw new Error(`File not found: ${filePath}`);
      }
      return {
        filename: basename(filePath),
        value: await file.text(),
      };
    }),
  );
}

export const renderCommand = new Command("render")
  .description("Render code files to video")
  .argument("<files...>", "code files to render")
  .option("-o, --output <path>", "output file path", "output.mp4")
  .option("-t, --theme <name>", "syntax theme", "github-dark")
  .option("-p, --preset <name>", "tweet|tutorial|square", "tutorial")
  .option("-a, --animation <name>", "morph|typewriter|cascade", "morph")
  .option("--cps <number>", "chars per second (typewriter)", "30")
  .option("-f, --fps <number>", "frames per second", "30")
  .option("-c, --config <path>", "config file path")
  .addHelpText(
    "after",
    `
Examples:
  $ framecode render code.ts
  $ framecode render code.ts -t github-dark -p tweet -a typewriter
  $ framecode render file1.ts file2.ts -o video.mp4
  $ framecode render code.ts --cps 50 -a typewriter`,
  )
  .action(async (files: string[], options) => {
    const config = await loadConfig(options.config);

    const theme = options.theme ?? config.theme ?? "github-dark";
    const preset = options.preset ?? config.preset ?? "tutorial";
    const animation = options.animation ?? config.animation ?? "morph";
    const charsPerSecond = Number(options.cps ?? config.charsPerSecond ?? 30);
    const fps = Number(options.fps ?? config.fps ?? 30);
    const output = options.output;

    if (!themeSchema.safeParse(theme).success) {
      logger.error(`Invalid theme: ${theme}`);
      logger.info("Run 'framecode themes' to see available themes");
      process.exit(1);
    }

    if (!animationSchema.safeParse(animation).success) {
      logger.error(`Invalid animation: ${animation}`);
      logger.info("Valid: morph, typewriter, cascade");
      process.exit(1);
    }

    if (!presetSchema.safeParse(preset).success) {
      logger.error(`Invalid preset: ${preset}`);
      logger.info("Valid: tweet (9:16), tutorial (16:9), square (1:1)");
      process.exit(1);
    }

    if (isNaN(charsPerSecond) || charsPerSecond <= 0) {
      logger.error(`Invalid chars-per-second: ${options.cps}`);
      process.exit(1);
    }

    if (isNaN(fps) || fps <= 0 || fps > 120) {
      logger.error(`Invalid fps: ${options.fps} (must be 1-120)`);
      process.exit(1);
    }

    const staticFiles = await readFiles(files);
    const presetDims =
      presetDimensions[preset as keyof typeof presetDimensions];

    const inputProps = {
      theme,
      preset,
      animation,
      charsPerSecond,
      files: staticFiles,
    };

    logger.info(`Rendering ${files.length} file(s) with ${theme} theme`);
    logger.info(`Preset: ${preset} (${presetDims.width}x${presetDims.height})`);

    try {
      const bundleProgress = new ProgressBar("Bundling");
      const bundleLocation = await bundle({
        entryPoint,
        onProgress: (p) => bundleProgress.update(p / 100),
      });

      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: "Main",
        inputProps,
      });

      const renderProgress = new ProgressBar("Rendering");
      await renderMedia({
        composition: {
          ...composition,
          width: presetDims.width,
          height: presetDims.height,
          fps,
        },
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: output,
        inputProps,
        onProgress: ({ progress }) => renderProgress.update(progress),
      });

      logger.success(`Video saved to ${output}`);
    } catch (error) {
      logger.error("Render failed");
      if (error instanceof Error) {
        logger.error(error.message);
      }
      process.exit(1);
    }
  });
