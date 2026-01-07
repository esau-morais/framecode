import { z } from "zod";
import { themeSchema } from "./theme";

export { themeSchema };

export const presetSchema = z.enum(["post", "tutorial", "square"]);

export const presetDimensions = {
  post: { width: 720, height: 1280 },
  tutorial: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
} as const;

export const animationSchema = z.enum(["morph", "typewriter", "cascade"]);

export const fileSchema = z.object({
  filename: z.string(),
  value: z.string(),
});

export const stepConfigSchema = z.object({
  file: z.string(),
  animation: animationSchema.optional(),
  charsPerSecond: z.number().int().positive().optional(),
});

export const schema = z.object({
  theme: themeSchema,
  preset: presetSchema.default("tutorial"),
  animation: animationSchema.default("morph"),
  charsPerSecond: z.number().int().positive().default(30),
  files: z.array(fileSchema).optional(),
  stepConfigs: z.array(stepConfigSchema).optional(),
});
