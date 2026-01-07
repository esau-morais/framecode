import { AnnotationHandler, InnerLine } from "codehike/code";
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

export const mark: AnnotationHandler = {
  name: "mark",
  AnnotatedLine: ({ annotation, ...props }) => {
    const themeColors = useThemeColors();
    const queryColor = annotation.query;
    const themeSelectionBg = themeColors.editor.selectionBackground;

    const borderColor =
      queryColor || stripAlpha(themeSelectionBg) || DEFAULT_MARK_COLOR;
    const backgroundColor = queryColor
      ? withAlpha(queryColor, 15)
      : themeSelectionBg || withAlpha(DEFAULT_MARK_COLOR, 15);

    return (
      <div
        style={{
          borderLeft: `solid 2px ${borderColor}`,
          backgroundColor,
        }}
      >
        <InnerLine merge={props} style={{ padding: "0 0.5ch" }} />
      </div>
    );
  },
  Inline: ({ annotation, children }) => {
    const themeColors = useThemeColors();
    const queryColor = annotation?.query;
    const themeSelectionBg = themeColors.editor.selectionBackground;

    const background = queryColor
      ? withAlpha(queryColor, 20)
      : themeSelectionBg || withAlpha(DEFAULT_MARK_COLOR, 20);

    return (
      <span
        style={{
          background,
          borderRadius: "2px",
          padding: "1px 3px",
        }}
      >
        {children}
      </span>
    );
  },
};
