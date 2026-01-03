import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { ProgressBar } from "./ProgressBar";
import { CodeTransition } from "./CodeTransition";
import { TypewriterTransition } from "./TypewriterTransition";
import { CascadeTransition } from "./CascadeTransition";
import { HighlightedCode } from "codehike/code";
import { ThemeColors, ThemeProvider } from "./calculate-metadata/theme";
import { useMemo } from "react";
import { RefreshOnCodeChange } from "./ReloadOnCodeChange";
import { verticalPadding } from "./font";

import type { schema } from "./calculate-metadata/schema";
import type { z } from "zod";

export type Props = {
  steps: HighlightedCode[] | null;
  themeColors: ThemeColors | null;
  codeWidth: number | null;
  fontSize?: number;
} & z.infer<typeof schema>;

export const Main: React.FC<Props> = ({
  steps,
  themeColors,
  codeWidth,
  animation,
  charsPerSecond,
  fontSize,
}) => {
  if (!steps) {
    throw new Error("Steps are not defined");
  }

  const { durationInFrames } = useVideoConfig();
  const stepDuration = durationInFrames / steps.length;
  const transitionDuration = 30;

  if (!themeColors) {
    throw new Error("Theme colors are not defined");
  }

  const backgroundStyle: React.CSSProperties = useMemo(() => {
    return {
      backgroundColor: themeColors.background,
    };
  }, [themeColors]);

  return (
    <ThemeProvider themeColors={themeColors}>
      <AbsoluteFill style={backgroundStyle}>
        <AbsoluteFill
          className="mx-auto"
          style={{
            width: codeWidth || "100%",
          }}
        >
          <ProgressBar steps={steps} />
          <AbsoluteFill
            style={{
              padding: `${verticalPadding}px 0px`,
            }}
          >
            <Series>
              {steps.map((step, index) => (
                <Series.Sequence
                  key={index}
                  layout="none"
                  durationInFrames={stepDuration}
                  name={step.meta}
                >
                  {animation === "typewriter" ? (
                    <TypewriterTransition
                      code={step}
                      charsPerSecond={charsPerSecond}
                      fontSize={fontSize}
                    />
                  ) : animation === "cascade" ? (
                    <CascadeTransition code={step} fontSize={fontSize} />
                  ) : (
                    <CodeTransition
                      oldCode={steps[index - 1]}
                      newCode={step}
                      durationInFrames={transitionDuration}
                      fontSize={fontSize}
                    />
                  )}
                </Series.Sequence>
              ))}
            </Series>
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
      <RefreshOnCodeChange />
    </ThemeProvider>
  );
};
