import { Command } from "commander";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { loadConfig } from "../utils/config";
import { logger } from "../utils/logger";
import {
  themeSchema,
  animationSchema,
  presetSchema,
  presetDimensions,
} from "../../calculate-metadata/schema";
import type { Theme } from "../../calculate-metadata/theme";
import { basename, join } from "path";
import type { StaticFile } from "../../calculate-metadata/get-files";
import {
  expandGlobPatterns,
  isInteractiveTerminal,
  scanCurrentDirectory,
} from "../utils/files";
import {
  processCode,
  type Animation,
  type StepConfig,
} from "../utils/process-code";
import {
  runInteractive,
  createRenderSpinner,
  renderOutro,
} from "../utils/prompts";

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
  .argument("[files...]", "code files or glob patterns")
  .option("-o, --output <path>", "output file path", "output.mp4")
  .option("-t, --theme <name>", "syntax theme")
  .option("-p, --preset <name>", "post|tutorial|square")
  .option("-a, --animation <name>", "morph|typewriter|cascade|focus")
  .option("--cps <number>", "chars per second (typewriter)", "30")
  .option("-f, --fps <number>", "frames per second", "30")
  .option("-c, --config <path>", "config file path")
  .option("-i, --interactive", "launch interactive mode")
  .option("-y, --yes", "skip confirmation prompt")
  .option("--no-interactive", "disable interactive mode (for CI)")
  .addHelpText(
    "after",
    `
Examples:
  $ framecode render code.ts
  $ framecode render "src/**/*.ts"
  $ framecode render "src/*.ts" "!src/*.test.ts"
  $ framecode render src/ --interactive
  $ framecode render -i
  $ framecode render code.ts -y`,
  )
  .action(async (filesArg: string[], options) => {
    const config = await loadConfig(options.config);
    const isCI = !isInteractiveTerminal();

    let files: string[];
    if (filesArg.length === 0) {
      files = await scanCurrentDirectory();
      if (files.length === 0) {
        logger.error("No code files found in current directory");
        process.exit(1);
      }
    } else {
      files = await expandGlobPatterns(filesArg);
      if (files.length === 0) {
        logger.error("No files matched the provided patterns");
        process.exit(1);
      }
    }

    const shouldInteractive =
      options.interactive === true ||
      (filesArg.length === 0 && !isCI && options.interactive !== false);

    let theme: string;
    let preset: string;
    let animation: string;
    let charsPerSecond: number;
    let fps: number;
    let output: string;
    let selectedFiles: string[];
    let useInteractiveProgress = false;
    let interactiveStepConfigs: StepConfig[] | undefined;

    if (shouldInteractive) {
      const result = await runInteractive({
        files,
        theme: options.theme,
        animation: options.animation,
        preset: options.preset,
        output: options.output,
        cps: options.cps ? Number(options.cps) : undefined,
        fps: options.fps ? Number(options.fps) : undefined,
        yes: options.yes,
        config,
      });

      selectedFiles = result.files;
      theme = result.theme;
      animation = result.animation;
      preset = result.preset;
      output = result.output;
      charsPerSecond = result.cps;
      fps = result.fps;
      interactiveStepConfigs = result.stepConfigs;
      useInteractiveProgress = true;
    } else {
      selectedFiles = files;
      theme = options.theme ?? config.theme ?? "github-dark";
      preset = options.preset ?? config.preset ?? "tutorial";
      animation = options.animation ?? config.animation ?? "morph";
      charsPerSecond = Number(options.cps ?? config.charsPerSecond ?? 30);
      fps = Number(options.fps ?? config.fps ?? 30);
      output = options.output;
    }

    if (!themeSchema.safeParse(theme).success) {
      logger.error(`Invalid theme: ${theme}`);
      logger.info("Run 'framecode themes' to see available themes");
      process.exit(1);
    }

    if (!animationSchema.safeParse(animation).success) {
      logger.error(`Invalid animation: ${animation}`);
      logger.info("Valid: morph, typewriter, cascade, focus");
      process.exit(1);
    }

    if (!presetSchema.safeParse(preset).success) {
      logger.error(`Invalid preset: ${preset}`);
      logger.info("Valid: post (9:16), tutorial (16:9), square (1:1)");
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

    const filenames = new Set(selectedFiles.map((f) => basename(f)));
    const stepConfigsToValidate = interactiveStepConfigs ?? config.stepConfigs;

    if (stepConfigsToValidate) {
      for (const stepConfig of stepConfigsToValidate) {
        if (!filenames.has(stepConfig.file)) {
          logger.warn(
            `Step config for "${stepConfig.file}" doesn't match any provided file`,
          );
        }

        const effectiveAnimation = stepConfig.animation ?? animation;
        if (
          stepConfig.charsPerSecond !== undefined &&
          effectiveAnimation !== "typewriter"
        ) {
          logger.warn(
            `charsPerSecond for "${stepConfig.file}" is only used with typewriter animation`,
          );
        }
      }
    }

    const staticFiles = await readFiles(selectedFiles);
    const presetDims =
      presetDimensions[preset as keyof typeof presetDimensions];

    const spinner = useInteractiveProgress ? createRenderSpinner() : null;

    if (!useInteractiveProgress) {
      logger.info(
        `Rendering ${selectedFiles.length} file(s) with ${theme} theme`,
      );
      logger.info(
        `Preset: ${preset} (${presetDims.width}x${presetDims.height})`,
      );
    }

    const finalStepConfigs = interactiveStepConfigs ?? config.stepConfigs;

    spinner?.start("Processing code...");
    const processed = await processCode(
      staticFiles,
      theme as Theme,
      animation as Animation,
      charsPerSecond,
      presetDims.width,
      presetDims.height,
      finalStepConfigs,
    );

    const inputProps = {
      theme,
      preset,
      animation,
      charsPerSecond,
      steps: processed.steps,
      themeColors: processed.themeColors,
      codeWidth: processed.codeWidth,
    };

    try {
      spinner?.message("Bundling...");
      const bundleLocation = await bundle({
        entryPoint,
        onProgress: () => {},
      });

      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: "Main",
        inputProps,
        logLevel: "error",
        onBrowserLog: () => {},
      });

      spinner?.message("Rendering video...");
      await renderMedia({
        composition: {
          ...composition,
          width: presetDims.width,
          height: presetDims.height,
          fps,
        },
        serveUrl: bundleLocation,
        codec: "h264",
        logLevel: "error",
        onBrowserLog: () => {},
        outputLocation: output,
        inputProps,
        onProgress: () => {},
      });

      spinner?.stop("Done!");

      if (useInteractiveProgress) {
        renderOutro(output);
      } else {
        logger.success(`Video saved to ${output}`);
      }
    } catch (error) {
      spinner?.stop("Failed");
      logger.error("Render failed");
      if (error instanceof Error) {
        logger.error(error.message);
      }
      process.exit(1);
    }
  });
