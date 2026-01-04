import { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Pre,
  HighlightedCode,
  AnnotationHandler,
  InnerLine,
} from "codehike/code";
import { fontFamily, fontSize as baseFontSize, tabSize } from "./font";

export interface FocusRegion {
  startLine: number;
  endLine: number;
}

export function FocusTransition({
  code,
  focusRegions = [],
  blurAmount = 8,
  transitionDuration = 15,
  fontSize,
}: {
  readonly code: HighlightedCode;
  readonly focusRegions?: FocusRegion[];
  readonly blurAmount?: number;
  readonly transitionDuration?: number;
  readonly fontSize?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hasFocus = focusRegions.length > 0;

  if (!hasFocus && process.env.NODE_ENV === "development") {
    console.warn(
      "[FocusTransition] No focus regions specified. Rendering without blur.",
    );
  }

  const blurProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100 },
    durationInFrames: transitionDuration,
  });

  const currentBlur = hasFocus
    ? interpolate(blurProgress, [0, 1], [0, blurAmount])
    : 0;

  const dimOpacity = hasFocus ? interpolate(blurProgress, [0, 1], [1, 0.5]) : 1;

  const focusHandler: AnnotationHandler = useMemo(
    () => ({
      name: "focus",
      Line: (props) => {
        const { lineNumber } = props;
        const isFocused =
          !hasFocus ||
          focusRegions.some(
            (r) => lineNumber >= r.startLine && lineNumber <= r.endLine,
          );

        return (
          <InnerLine
            merge={props}
            style={{
              filter: isFocused ? "none" : `blur(${currentBlur}px)`,
              opacity: isFocused ? 1 : dimOpacity,
              willChange: hasFocus ? "filter, opacity" : undefined,
              display: "block",
            }}
          />
        );
      },
    }),
    [hasFocus, focusRegions, currentBlur, dimOpacity],
  );

  const style: React.CSSProperties = useMemo(
    () => ({
      fontSize: fontSize ?? baseFontSize,
      lineHeight: 1.5,
      fontFamily,
      tabSize,
      margin: 0,
      whiteSpace: "pre",
    }),
    [fontSize],
  );

  return <Pre code={code} handlers={[focusHandler]} style={style} />;
}
