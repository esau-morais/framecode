import { AnnotationHandler, InnerLine } from "codehike/code";
import { interpolate, useCurrentFrame } from "remotion";
import { useThemeColors } from "../calculate-metadata/theme";

export const mark: AnnotationHandler = {
  name: "mark",
  AnnotatedLine: ({ annotation, ...props }) => {
    const frame = useCurrentFrame();
    const themeColors = useThemeColors();

    const opacity = interpolate(frame, [25, 35], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const color = annotation.query || themeColors.editor.lineHighlightBackground || "rgb(14 165 233)";

    return (
      <div
        style={{
          opacity,
          borderLeft: `solid 2px ${color}`,
          backgroundColor: `rgb(from ${color} r g b / 0.1)`,
        }}
      >
        <InnerLine merge={props} style={{ padding: "0 0.5ch" }} />
      </div>
    );
  },
  Inline: ({ annotation, children }) => {
    const frame = useCurrentFrame();
    const themeColors = useThemeColors();

    const opacity = interpolate(frame, [25, 35], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const color = annotation?.query || themeColors.editor.lineHighlightBackground || "rgb(14 165 233)";

    return (
      <span
        style={{
          opacity,
          outline: `solid 1px rgb(from ${color} r g b / 0.5)`,
          background: `rgb(from ${color} r g b / 0.13)`,
          borderRadius: "2px",
          padding: "0 2px",
        }}
      >
        {children}
      </span>
    );
  },
};
