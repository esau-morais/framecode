import { AbsoluteFill, Series } from "remotion";
import { ProgressBar } from "./ProgressBar";
import { CodeTransition } from "./CodeTransition";
import { TypewriterTransition } from "./TypewriterTransition";
import { CascadeTransition } from "./CascadeTransition";
import { HighlightedCode } from "codehike/code";
import { ThemeColors, ThemeProvider } from "./calculate-metadata/theme";
import { useMemo } from "react";
import { RefreshOnCodeChange } from "./ReloadOnCodeChange";
import { verticalPadding, horizontalPadding } from "./font";

import type { animationSchema, schema } from "./calculate-metadata/schema";
import type { z } from "zod";

export type Animation = z.infer<typeof animationSchema>;

export type CodeStep = {
  code: HighlightedCode;
  fontSize: number;
  durationInFrames: number;
  animation: Animation;
  charsPerSecond: number;
};

export type Props = {
  steps: CodeStep[] | null;
  themeColors: ThemeColors | null;
  codeWidth: number | null;
} & Omit<z.infer<typeof schema>, "steps">;

export const Main: React.FC<Props> = ({ steps, themeColors, codeWidth }) => {
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
                {step.animation === "typewriter" ? (
                  <TypewriterTransition
                    code={step.code}
                    charsPerSecond={step.charsPerSecond}
                    fontSize={step.fontSize}
                  />
                ) : step.animation === "cascade" ? (
                  <CascadeTransition
                    code={step.code}
                    fontSize={step.fontSize}
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
