import { z } from "zod";
import { themeSchema } from "./theme";

export { themeSchema };

export const presetSchema = z.enum(["tweet", "tutorial", "square"]);

export const presetDimensions = {
  tweet: { width: 720, height: 1280 },
  tutorial: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
} as const;

export const animationSchema = z.enum([
  "morph",
  "typewriter",
  "cascade",
  "focus",
]);

export const fileSchema = z.object({
  filename: z.string(),
  value: z.string(),
});

export const schema = z.object({
  theme: themeSchema,
  preset: presetSchema.default("tutorial"),
  animation: animationSchema.default("morph"),
  charsPerSecond: z.number().int().positive().default(30),
  files: z.array(fileSchema).optional(),
});
