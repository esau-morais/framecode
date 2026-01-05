import { z } from "zod";
import { CalculateMetadataFunction } from "remotion";
import { getThemeColors } from "./theme";
import { Props, CodeStep } from "../Main";
import { schema, presetDimensions } from "./schema";
import { processSnippetSimple } from "./process-snippet";
import { getFilesFromStudio } from "./get-files";
import { tabSize, CHAR_WIDTH_RATIO } from "../font";
import { flattenCode } from "../TypewriterTransition";
import {
  calculateStepFontSize,
  calculateStepDuration,
} from "../shared/calculations";

export const calculateMetadata: CalculateMetadataFunction<
  z.infer<typeof schema> & Props
> = async ({ props }) => {
  const preset = presetDimensions[props.preset];
  const finalWidth = preset.width;
  const finalHeight = preset.height;

  // If steps are already provided (from CLI processing), use them directly
  if (props.steps && props.themeColors && props.codeWidth !== null) {
    const durationInFrames = props.steps.reduce(
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
        steps: props.steps,
        themeColors: props.themeColors,
        codeWidth: props.codeWidth,
      },
    };
  }

  // Studio dev mode: process files without twoslash (browser context)
  const contents = props.files ?? (await getFilesFromStudio());
  const themeColors = await getThemeColors(props.theme);

  const steps: CodeStep[] = [];
  for (const snippet of contents) {
    const code = await processSnippetSimple(snippet, props.theme);
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
