import {
  fontSize as baseFontSize,
  minFontSize,
  horizontalPadding,
  verticalPadding,
  tabSize,
  CHAR_WIDTH_RATIO,
  LINE_HEIGHT,
} from "../font";

const FPS = 30;
const BASE_STEP_DURATION = 90;
const CASCADE_STAGGER_DELAY = 3;

export function calculateStepFontSize(
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

export function calculateStepDuration(
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
