import { AbsoluteFill, Series } from "remotion";
import { ProgressBar } from "./ProgressBar";
import { CodeTransition } from "./CodeTransition";
import { TypewriterTransition } from "./TypewriterTransition";
import { CascadeTransition } from "./CascadeTransition";
import { FocusTransition } from "./FocusTransition";
import { HighlightedCode } from "codehike/code";
import { ThemeColors, ThemeProvider } from "./calculate-metadata/theme";
import { useMemo } from "react";
import { RefreshOnCodeChange } from "./ReloadOnCodeChange";
import { verticalPadding, horizontalPadding } from "./font";

import type { schema } from "./calculate-metadata/schema";
import type { z } from "zod";

export type CodeStep = {
  code: HighlightedCode;
  fontSize: number;
  durationInFrames: number;
};

export type Props = {
  steps: CodeStep[] | null;
  themeColors: ThemeColors | null;
  codeWidth: number | null;
} & z.infer<typeof schema>;

export const Main: React.FC<Props> = ({
  steps,
  themeColors,
  codeWidth,
  animation,
  charsPerSecond,
}) => {
  if (!steps) {
    throw new Error("Steps are not defined");
  }

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
        <ProgressBar steps={steps} />
        <AbsoluteFill
          className="mx-auto"
          style={{
            width: codeWidth || "100%",
            padding: `${verticalPadding}px ${horizontalPadding}px`,
          }}
        >
          <Series>
            {steps.map((step, index) => (
              <Series.Sequence
                key={index}
                layout="none"
                durationInFrames={step.durationInFrames}
                name={step.code.meta}
              >
                {animation === "typewriter" ? (
                  <TypewriterTransition
                    code={step.code}
                    charsPerSecond={charsPerSecond}
                    fontSize={step.fontSize}
                  />
                ) : animation === "cascade" ? (
                  <CascadeTransition
                    code={step.code}
                    fontSize={step.fontSize}
                  />
                ) : animation === "focus" ? (
                  <FocusTransition
                    code={step.code}
                    fontSize={step.fontSize}
                    focusRegions={[{ startLine: 2, endLine: 3 }]}
                  />
                ) : (
                  <CodeTransition
                    oldCode={steps[index - 1]?.code ?? null}
                    newCode={step.code}
                    durationInFrames={transitionDuration}
                    fontSize={step.fontSize}
                  />
                )}
              </Series.Sequence>
            ))}
          </Series>
        </AbsoluteFill>
      </AbsoluteFill>
      <RefreshOnCodeChange />
    </ThemeProvider>
  );
};
