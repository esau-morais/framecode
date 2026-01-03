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
  const paths = [
    configPath,
    "./framecode.json",
    join(homedir(), ".config", "framecode", "config.json"),
  ].filter(Boolean) as string[];

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
