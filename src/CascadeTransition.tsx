import { useMemo, useCallback } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Pre,
  HighlightedCode,
  AnnotationHandler,
  InnerLine,
} from "codehike/code";
import { fontFamily, fontSize as baseFontSize, tabSize } from "./font";
import { useMarkHandler } from "./annotations/Mark";
import { useFocusHandler } from "./annotations/Focus";

type TimingMode = "spring" | "linear";

export function CascadeTransition({
  code,
  staggerDelay = 3,
  timing = "spring",
  fontSize,
}: {
  readonly code: HighlightedCode;
  readonly staggerDelay?: number;
  readonly timing?: TimingMode;
  readonly fontSize?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const getLineProgress = useCallback(
    (lineNum: number) => {
      const delay = (lineNum - 1) * staggerDelay;
      return timing === "spring"
        ? spring({ frame, fps, delay, config: { damping: 20, stiffness: 100 } })
        : interpolate(frame, [delay, delay + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
    },
    [frame, fps, staggerDelay, timing],
  );

  const cascadeHandler: AnnotationHandler = useMemo(
    () => ({
      name: "cascade",
      Line: (props) => {
        const progress = getLineProgress(props.lineNumber);
        const translateY = interpolate(progress, [0, 1], [10, 0]);

        return (
          <InnerLine
            merge={props}
            style={{
              opacity: progress,
              transform: `translate3d(0, ${translateY}px, 0)`,
              display: "block",
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
            }}
          />
        );
      },
    }),
    [getLineProgress],
  );

  const markHandler = useMarkHandler(getLineProgress);

  const focusHandler = useFocusHandler(code);

  const handlers = useMemo(
    () => [cascadeHandler, markHandler, focusHandler],
    [cascadeHandler, markHandler, focusHandler],
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

  return <Pre code={code} handlers={handlers} style={style} />;
}
