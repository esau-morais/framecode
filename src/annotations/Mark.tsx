import { useMemo } from "react";
import { AnnotationHandler, InnerLine } from "codehike/code";
import { interpolate, useCurrentFrame } from "remotion";
import { useThemeColors } from "../calculate-metadata/theme";

const DEFAULT_MARK_COLOR = "rgb(14, 165, 233)";

function withAlpha(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function stripAlpha(color: string): string {
  if (color.startsWith("#")) {
    if (color.length === 9) return color.slice(0, 7);
    if (color.length === 5) return color.slice(0, 4);
  }
  return color;
}

export type GetLineProgress = (lineNumber: number) => number;

export function useMarkHandler(
  getLineProgress: GetLineProgress,
): AnnotationHandler {
  const themeColors = useThemeColors();
  const themeSelectionBg = themeColors.editor.selectionBackground;

  const defaultColors = useMemo(
    () => ({
      border: stripAlpha(themeSelectionBg) || DEFAULT_MARK_COLOR,
      background: themeSelectionBg || withAlpha(DEFAULT_MARK_COLOR, 15),
      inlineBackground: themeSelectionBg || withAlpha(DEFAULT_MARK_COLOR, 20),
    }),
    [themeSelectionBg],
  );

  return useMemo(
    () => ({
      name: "mark",
      AnnotatedLine: ({ annotation, ...props }) => {
        const progress = getLineProgress(props.lineNumber);
        const queryColor = annotation.query;

        const borderColor = queryColor || defaultColors.border;
        const backgroundColor = queryColor
          ? withAlpha(queryColor, 15)
          : defaultColors.background;

        return (
          <div
            style={{
              opacity: progress,
              borderLeft: `solid 2px ${borderColor}`,
              backgroundColor,
            }}
          >
            <InnerLine merge={props} style={{ padding: "0 0.5ch" }} />
          </div>
        );
      },
      Inline: ({ annotation, children }) => {
        const queryColor = annotation?.query;
        const background = queryColor
          ? withAlpha(queryColor, 20)
          : defaultColors.inlineBackground;

        return (
          <span style={{ background, borderRadius: "2px", padding: "1px 3px" }}>
            {children}
          </span>
        );
      },
    }),
    [getLineProgress, defaultColors],
  );
}

const MARK_FADE_START = 20;
const MARK_FADE_END = 30;

export function useMorphMarkHandler(): AnnotationHandler {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [MARK_FADE_START, MARK_FADE_END],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return useMarkHandler(() => progress);
}
