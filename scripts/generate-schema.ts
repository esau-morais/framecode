#!/usr/bin/env bun
import { writeFile } from "fs/promises";
import { themeSchema } from "../src/calculate-metadata/theme";

const themes = themeSchema.options;

const jsonSchema = {
  $schema: "https://json-schema.org/draft-07/schema",
  type: "object",
  properties: {
    theme: {
      type: "string",
      enum: themes,
      default: "github-dark",
    },
    preset: {
      type: "string",
      enum: ["tweet", "tutorial", "square"],
      default: "tutorial",
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
  },
  additionalProperties: false,
};

await writeFile(
  "framecode.schema.json",
  JSON.stringify(jsonSchema, null, 2) + "\n",
);

console.log("✔ Generated framecode.schema.json");
