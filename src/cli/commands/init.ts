import { Command } from "commander";
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import { logger } from "../utils/logger";
import { getConfigPath } from "../utils/config";

export const initCommand = new Command("init")
  .description("Create framecode config file")
  .option("--local", "Create config in current directory")
  .action(async (options) => {
    const isLocal = options.local ?? false;
    const configPath = getConfigPath(isLocal);
    const schemaUrl =
      "https://raw.githubusercontent.com/esau-morais/framecode/main/framecode.schema.json";

    const defaultConfig = {
      $schema: schemaUrl,
      theme: "github-dark",
      preset: "tutorial",
      fps: 30,
    };

    await mkdir(dirname(configPath), { recursive: true });
    await writeFile(configPath, JSON.stringify(defaultConfig, null, 2));

    logger.success(`Created ${configPath}`);
  });
