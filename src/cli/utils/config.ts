import { z } from "zod";
import { homedir } from "os";
import { join, dirname } from "path";
import { mkdir } from "fs/promises";
import {
  themeSchema,
  animationSchema,
  presetSchema,
  stepConfigSchema,
} from "../../calculate-metadata/schema";

const configSchema = z.object({
  theme: themeSchema.optional(),
  preset: presetSchema.optional(),
  animation: animationSchema.optional(),
  charsPerSecond: z.number().int().positive().optional(),
  fps: z.number().int().min(1).max(120).optional(),
  stepConfigs: z.array(stepConfigSchema).optional(),
});

export type Config = z.infer<typeof configSchema>;

export async function loadConfig(configPath?: string): Promise<Config> {
  if (configPath) {
    const file = Bun.file(configPath);
    if (!(await file.exists())) {
      console.warn(`Warning: Config file not found: ${configPath}`);
      return {};
    }
    try {
      const json = await file.json();
      return configSchema.parse(json);
    } catch {
      console.warn(`Warning: Failed to parse config file: ${configPath}`);
      return {};
    }
  }

  const paths = [
    "./framecode.json",
    join(homedir(), ".config", "framecode", "config.json"),
  ];

  for (const path of paths) {
    try {
      const file = Bun.file(path);
      const json = await file.json();
      return configSchema.parse(json);
    } catch {
      continue;
    }
  }

  return {};
}

export function getConfigPath(local: boolean): string {
  if (local) {
    return "./framecode.json";
  }
  return join(homedir(), ".config", "framecode", "config.json");
}

export async function saveConfig(
  config: Partial<Config>,
  local: boolean = false,
): Promise<boolean> {
  const configPath = getConfigPath(local);

  try {
    await mkdir(dirname(configPath), { recursive: true });

    const existingConfig = await loadConfig(configPath);
    const merged = { ...existingConfig, ...config };

    await Bun.write(configPath, JSON.stringify(merged, null, 2));
    return true;
  } catch {
    return false;
  }
}
