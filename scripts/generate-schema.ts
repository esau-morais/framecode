#!/usr/bin/env bun
import { writeFile } from "fs/promises";
import {
  themeSchema,
  animationSchema,
  presetSchema,
} from "../src/calculate-metadata/schema";

const themes = themeSchema.options;
const animations = animationSchema.options;
const presets = presetSchema.options;

const jsonSchema = {
  $schema: "https://json-schema.org/draft-07/schema",
  type: "object",
  definitions: {
    animation: {
      type: "string",
      enum: animations,
      default: "morph",
    },
    stepConfig: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Filename to match (exact match)",
        },
        animation: {
          $ref: "#/definitions/animation",
          description: "Animation style override for this step",
        },
        charsPerSecond: {
          type: "integer",
          minimum: 1,
          description: "Characters per second for typewriter animation",
        },
      },
      required: ["file"],
      additionalProperties: false,
    },
    brand: {
      type: "object",
      properties: {
        logo: {
          type: "string",
          description: "Logo source URL, data URL, or local file path",
        },
        twitter: {
          type: "string",
          description: "Twitter/X handle watermark",
        },
        website: {
          type: "string",
          description: "Website watermark",
        },
        accent: {
          type: "string",
          pattern: "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$",
          description: "Brand accent color (#RGB or #RRGGBB)",
        },
      },
      additionalProperties: false,
    },
  },
  properties: {
    theme: {
      type: "string",
      enum: themes,
      default: "vercel-dark",
    },
    preset: {
      type: "string",
      enum: presets,
      default: "tutorial",
    },
    animation: {
      $ref: "#/definitions/animation",
    },
    charsPerSecond: {
      type: "integer",
      minimum: 1,
      default: 30,
      description: "Global characters per second for typewriter animation",
    },
    fps: {
      type: "integer",
      minimum: 1,
      maximum: 120,
      default: 30,
    },
    width: {
      type: "integer",
      minimum: 1,
    },
    height: {
      type: "integer",
      minimum: 1,
    },
    brand: {
      $ref: "#/definitions/brand",
    },
    stepConfigs: {
      type: "array",
      items: {
        $ref: "#/definitions/stepConfig",
      },
      description: "Per-step animation configuration overrides",
    },
  },
  additionalProperties: false,
};

await writeFile(
  "framecode.schema.json",
  JSON.stringify(jsonSchema, null, 2) + "\n",
);

console.log("✔ Generated framecode.schema.json");
