import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { useThemeColors } from "./calculate-metadata/theme";
import { horizontalPadding } from "./font";
import { CodeStep } from "./Main";
import React from "react";

const Step: React.FC<{
  readonly index: number;
  readonly currentStep: number;
  readonly currentStepProgress: number;
  readonly trackColor?: string;
  readonly fillColor?: string;
}> = ({
  index,
  currentStep,
  currentStepProgress,
  trackColor,
  fillColor,
}) => {
  const themeColors = useThemeColors();

  const outer: React.CSSProperties = useMemo(() => {
    return {
      backgroundColor:
        trackColor ??
        themeColors.editor.lineHighlightBackground ??
        themeColors.editor.rangeHighlightBackground,
      borderRadius: 6,
      overflow: "hidden",
      height: "100%",
      flex: 1,
    };
  }, [themeColors, trackColor]);

  const inner: React.CSSProperties = useMemo(() => {
    return {
      height: "100%",
      backgroundColor: fillColor ?? themeColors.icon.foreground,
      width:
        index > currentStep
          ? 0
          : index === currentStep
            ? currentStepProgress * 100 + "%"
            : "100%",
    };
  }, [fillColor, themeColors.icon.foreground, index, currentStep, currentStepProgress]);

  return (
    <div style={outer}>
      <div style={inner} />
    </div>
  );
};

export function ProgressBar({
  steps,
  trackColor,
  fillColor,
  top = 48,
  height = 6,
  gap = 12,
}: {
  readonly steps: CodeStep[];
  readonly trackColor?: string;
  readonly fillColor?: string;
  readonly top?: number;
  readonly height?: number;
  readonly gap?: number;
}) {
  const frame = useCurrentFrame();

  const { currentStep, currentStepProgress } = useMemo(() => {
    let accumulated = 0;
    for (let i = 0; i < steps.length; i++) {
      const stepEnd = accumulated + steps[i].durationInFrames;
      if (frame < stepEnd) {
        const progress = (frame - accumulated) / steps[i].durationInFrames;
        return { currentStep: i, currentStepProgress: progress };
      }
      accumulated = stepEnd;
    }
    return { currentStep: steps.length - 1, currentStepProgress: 1 };
  }, [frame, steps]);

  const container: React.CSSProperties = useMemo(() => {
    return {
      position: "absolute",
      top,
      height,
      left: horizontalPadding,
      right: horizontalPadding,
      display: "flex",
      gap,
    };
  }, [gap, height, top]);

  return (
    <div style={container}>
      {steps.map((_, index) => (
        <Step
          key={index}
          trackColor={trackColor}
          fillColor={fillColor}
          currentStep={currentStep}
          currentStepProgress={currentStepProgress}
          index={index}
        />
      ))}
    </div>
  );
}
