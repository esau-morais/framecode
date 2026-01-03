import { z } from "zod";
import { CalculateMetadataFunction } from "remotion";
import { getThemeColors } from "./theme";
import { Props } from "../Main";
import { schema, presetDimensions } from "./schema";
import { processSnippet } from "./process-snippet";
import { getFilesFromStudio } from "./get-files";
import {
  fontSize as baseFontSize,
  horizontalPadding,
  tabSize,
  CHAR_WIDTH_RATIO,
} from "../font";
import { HighlightedCode } from "codehike/code";
import { flattenCode } from "../TypewriterTransition";

export const calculateMetadata: CalculateMetadataFunction<
  z.infer<typeof schema> & Props
> = async ({ props }) => {
  const contents = props.files ?? (await getFilesFromStudio());

  const preset = presetDimensions[props.preset];

  const maxCharacters = Math.max(
    ...contents
      .map(({ value }) => value.split("\n"))
      .flat()
      .map((value) => value.replaceAll("\t", " ".repeat(tabSize)).length)
      .flat(),
  );

  const maxLinesInSnippet = Math.max(
    ...contents.map(({ value }) => value.split("\n").length),
  );

  const themeColors = await getThemeColors(props.theme);

  const twoSlashedCode: HighlightedCode[] = [];
  for (const snippet of contents) {
    twoSlashedCode.push(await processSnippet(snippet, props.theme));
  }

  const finalWidth = preset.width;
  const finalHeight = preset.height;

  const availableHeight = finalHeight - 120;
  const lineHeight = 1.5;
  const maxFontSizeByLines = availableHeight / (maxLinesInSnippet * lineHeight);

  const availableWidth = finalWidth - horizontalPadding * 2;
  const maxFontSizeByWidth =
    maxCharacters > 0
      ? availableWidth / (maxCharacters * CHAR_WIDTH_RATIO)
      : baseFontSize;

  const fontSize = Math.min(
    baseFontSize,
    Math.floor(Math.min(maxFontSizeByLines, maxFontSizeByWidth)),
  );

  const codeWidth = fontSize * CHAR_WIDTH_RATIO * maxCharacters;

  const fps = 30;
  const totalChars = twoSlashedCode.reduce(
    (sum, code) => sum + flattenCode(code).length,
    0,
  );
  const typewriterDuration =
    Math.ceil((totalChars / props.charsPerSecond) * fps) + fps;
  const morphDuration = contents.length * 90;
  const durationInFrames =
    props.animation === "typewriter" ? typewriterDuration : morphDuration;

  return {
    durationInFrames,
    width: finalWidth,
    height: finalHeight,
    props: {
      theme: props.theme,
      preset: props.preset,
      animation: props.animation,
      charsPerSecond: props.charsPerSecond,
      steps: twoSlashedCode,
      themeColors,
      codeWidth,
      fontSize,
    },
  };
};
