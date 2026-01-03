import { z } from "zod";
import { homedir } from "os";
import { join } from "path";
import { themeSchema } from "../../calculate-metadata/theme";

const configSchema = z.object({
  theme: themeSchema.optional(),
  preset: z.enum(["tweet", "tutorial", "square"]).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
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
