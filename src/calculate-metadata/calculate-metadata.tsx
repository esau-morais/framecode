import { z } from "zod";
import { CalculateMetadataFunction } from "remotion";
import { getThemeColors } from "./theme";
import { Props, CodeStep } from "../Main";
import { schema, presetDimensions } from "./schema";
import { processSnippet } from "./process-snippet";
import { getFilesFromStudio } from "./get-files";
import {
  fontSize as baseFontSize,
  minFontSize,
  horizontalPadding,
  verticalPadding,
  tabSize,
  CHAR_WIDTH_RATIO,
  LINE_HEIGHT,
} from "../font";
import { flattenCode } from "../TypewriterTransition";

const FPS = 30;
const BASE_STEP_DURATION = 90;
const CASCADE_STAGGER_DELAY = 3;

function calculateStepFontSize(
  content: string,
  width: number,
  height: number,
): number {
  const lines = content.split("\n");
  const lineCount = lines.length;
  const maxChars = Math.max(
    ...lines.map((line) => line.replaceAll("\t", " ".repeat(tabSize)).length),
  );

  const availableHeight = height - verticalPadding * 2;
  const availableWidth = width - horizontalPadding * 2;

  const maxFontSizeByLines = availableHeight / (lineCount * LINE_HEIGHT);
  const maxFontSizeByWidth =
    maxChars > 0
      ? availableWidth / (maxChars * CHAR_WIDTH_RATIO)
      : baseFontSize;

  return Math.max(
    minFontSize,
    Math.min(
      baseFontSize,
      Math.floor(Math.min(maxFontSizeByLines, maxFontSizeByWidth)),
    ),
  );
}

function calculateStepDuration(
  charCount: number,
  lineCount: number,
  animation: string,
  charsPerSecond: number,
): number {
  switch (animation) {
    case "typewriter":
      return Math.ceil((charCount / charsPerSecond) * FPS) + FPS;
    case "cascade":
      return lineCount * CASCADE_STAGGER_DELAY + FPS;
    default:
      return BASE_STEP_DURATION;
  }
}

export const calculateMetadata: CalculateMetadataFunction<
  z.infer<typeof schema> & Props
> = async ({ props }) => {
  const contents = props.files ?? (await getFilesFromStudio());

  const preset = presetDimensions[props.preset];
  const finalWidth = preset.width;
  const finalHeight = preset.height;

  const themeColors = await getThemeColors(props.theme);

  const steps: CodeStep[] = [];
  for (const snippet of contents) {
    const code = await processSnippet(snippet, props.theme);
    const fontSize = calculateStepFontSize(
      snippet.value,
      finalWidth,
      finalHeight,
    );
    const charCount = flattenCode(code).length;
    const lineCount = snippet.value.split("\n").length;
    const durationInFrames = calculateStepDuration(
      charCount,
      lineCount,
      props.animation,
      props.charsPerSecond,
    );
    steps.push({ code, fontSize, durationInFrames });
  }

  const maxCharacters = Math.max(
    ...contents
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
    durationInFrames,
    width: finalWidth,
    height: finalHeight,
    props: {
      theme: props.theme,
      preset: props.preset,
      animation: props.animation,
      charsPerSecond: props.charsPerSecond,
      steps,
      themeColors,
      codeWidth,
    },
  };
};
