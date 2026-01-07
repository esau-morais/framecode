import { useMemo } from "react";
import { AnnotationHandler, InnerLine, HighlightedCode } from "codehike/code";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

function buildFocusedLines(
  annotations: HighlightedCode["annotations"],
): Set<number> {
  const lines = new Set<number>();
  for (const ann of annotations) {
    if (ann.name === "focus" && "fromLineNumber" in ann) {
      const from = ann.fromLineNumber as number;
      const to = (ann.toLineNumber as number) ?? from;
      for (let i = from; i <= to; i++) lines.add(i);
    }
  }
  return lines;
}

export function useFocusHandler(code: HighlightedCode): AnnotationHandler {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const focusedLines = useMemo(
    () => buildFocusedLines(code.annotations),
    [code.annotations],
  );

  const hasFocus = focusedLines.size > 0;

  const progress = hasFocus
    ? spring({ frame, fps, config: { damping: 20, stiffness: 100 } })
    : 0;
  const blur = interpolate(progress, [0, 1], [0, 3]);
  const dimOpacity = interpolate(progress, [0, 1], [1, 0.4]);

  return useMemo(
    () => ({
      name: "focus",
      Line: hasFocus
        ? (props) => (
            <InnerLine
              merge={props}
              style={{
                filter: focusedLines.has(props.lineNumber)
                  ? "none"
                  : `blur(${blur}px)`,
                opacity: focusedLines.has(props.lineNumber) ? 1 : dimOpacity,
                display: "block",
              }}
            />
          )
        : undefined,
    }),
    [hasFocus, focusedLines, blur, dimOpacity],
  );
}
