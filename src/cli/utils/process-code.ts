import { highlight, HighlightedCode } from "codehike/code";
import { createTwoslasher } from "twoslash";
import type { StaticFile } from "../../calculate-metadata/get-files";
import {
  Theme,
  loadTheme,
  getThemeColors,
  ThemeColors,
} from "../../calculate-metadata/theme";
import { tabSize, CHAR_WIDTH_RATIO } from "../../font";
import {
  calculateStepFontSize,
  calculateStepDuration,
} from "../../shared/calculations";
import ts from "typescript";

export type CodeStep = {
  code: HighlightedCode;
  fontSize: number;
  durationInFrames: number;
};

export type ProcessedCode = {
  steps: CodeStep[];
  themeColors: ThemeColors;
  codeWidth: number;
  durationInFrames: number;
};

const compilerOptions = {
  lib: ["dom", "es2023"],
  jsx: ts.JsxEmit.React,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
};

let twoslasher: ReturnType<typeof createTwoslasher> | null = null;

function getTwoslasher() {
  if (!twoslasher) {
    twoslasher = createTwoslasher({ compilerOptions });
  }
  return twoslasher;
}

function countChars(code: HighlightedCode): number {
  let count = 0;
  for (const token of code.tokens) {
    if (typeof token === "string") {
      count += token.length;
    } else {
      count += token[0].length;
    }
  }
  return count;
}

async function processSnippet(
  step: StaticFile,
  shikiTheme: Awaited<ReturnType<typeof loadTheme>>,
): Promise<HighlightedCode> {
  const splitted = step.filename.split(".");
  const extension = splitted[splitted.length - 1];

  let code = step.value;
  let twoslashResult = null;

  if (extension === "ts" || extension === "tsx") {
    try {
      twoslashResult = getTwoslasher()(code, extension, { compilerOptions });
      code = twoslashResult.code;
    } catch {
      // If twoslash fails, just use the original code
    }
  }

  const highlighted = await highlight(
    {
      lang: extension,
      meta: step.filename,
      value: code,
    },
    shikiTheme,
  );

  if (!twoslashResult) {
    return highlighted;
  }

  for (const { text, line, character, length } of twoslashResult.queries) {
    const codeblock = await highlight(
      { value: text, lang: "ts", meta: "callout" },
      shikiTheme,
    );
    highlighted.annotations.push({
      name: "callout",
      query: text,
      lineNumber: line + 1,
      data: { character, codeblock },
      fromColumn: character,
      toColumn: character + length,
    });
  }

  for (const { text, line, character, length } of twoslashResult.errors) {
    highlighted.annotations.push({
      name: "error",
      query: text,
      lineNumber: line + 1,
      data: { character },
      fromColumn: character,
      toColumn: character + length,
    });
  }

  return highlighted;
}

export async function processCode(
  files: StaticFile[],
  theme: Theme,
  animation: string,
  charsPerSecond: number,
  width: number,
  height: number,
): Promise<ProcessedCode> {
  const shikiTheme = await loadTheme(theme);
  const themeColors = await getThemeColors(theme);

  const steps = await Promise.all(
    files.map(async (file) => {
      const code = await processSnippet(file, shikiTheme);
      const fontSize = calculateStepFontSize(file.value, width, height);
      const charCount = countChars(code);
      const lineCount = file.value.split("\n").length;
      const durationInFrames = calculateStepDuration(
        charCount,
        lineCount,
        animation,
        charsPerSecond,
      );
      return { code, fontSize, durationInFrames };
    }),
  );

  const maxCharacters = Math.max(
    ...files
      .map(({ value }) => value.split("\n"))
      .flat()
      .map((value) => value.replaceAll("\t", " ".repeat(tabSize)).length),
  );

  const maxFontSize = Math.max(...steps.map((s) => s.fontSize));
  const codeWidth = maxFontSize * CHAR_WIDTH_RATIO * maxCharacters;

  const durationInFrames = steps.reduce(
    (sum, step) => sum + step.durationInFrames,
    0,
  );

  return {
    steps,
    themeColors,
    codeWidth,
    durationInFrames,
  };
}
