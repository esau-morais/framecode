import { AbsoluteFill, Series } from "remotion";
import { ProgressBar } from "./ProgressBar";
import { CodeTransition } from "./CodeTransition";
import { TypewriterTransition } from "./TypewriterTransition";
import { CascadeTransition } from "./CascadeTransition";
import { HighlightedCode } from "codehike/code";
import {
  ThemeColors,
  ThemeProvider,
  getThemeVisuals,
} from "./calculate-metadata/theme";
import { useMemo } from "react";
import { RefreshOnCodeChange } from "./ReloadOnCodeChange";
import { verticalPadding, horizontalPadding } from "./font";
import { BrandOverlay } from "./BrandOverlay";

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

export const Main: React.FC<Props> = ({
  steps,
  theme,
  themeColors,
  codeWidth,
  brand,
}) => {
  if (!steps) {
    throw new Error("Steps are not defined");
  }

  const transitionDuration = 30;

  if (!themeColors) {
    throw new Error("Theme colors are not defined");
  }

  const themeVisuals = useMemo(() => {
    return getThemeVisuals(theme, themeColors);
  }, [theme, themeColors]);

  const backgroundStyle: React.CSSProperties = useMemo(() => {
    return {
      backgroundColor: themeVisuals.canvasBackground,
      backgroundImage: themeVisuals.canvasBackgroundImage,
      overflow: "hidden",
    };
  }, [themeVisuals]);

  const overlayStyle: React.CSSProperties | null = useMemo(() => {
    if (themeVisuals.overlayKind === "none") {
      return null;
    }

    if (themeVisuals.overlayKind === "grid") {
      return {
        pointerEvents: "none",
        opacity: themeVisuals.overlayOpacity,
        backgroundImage:
          "linear-gradient(to right, rgba(255, 255, 255, 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      };
    }

    if (themeVisuals.overlayKind === "guides") {
      return {
        pointerEvents: "none",
        opacity: themeVisuals.overlayOpacity,
        backgroundImage:
          "linear-gradient(to right, transparent 11.9%, rgba(255, 255, 255, 0.14) 11.9%, rgba(255, 255, 255, 0.14) 12.1%, transparent 12.1%, transparent 49.9%, rgba(255, 255, 255, 0.18) 49.9%, rgba(255, 255, 255, 0.18) 50.1%, transparent 50.1%, transparent 87.9%, rgba(255, 255, 255, 0.14) 87.9%, rgba(255, 255, 255, 0.14) 88.1%, transparent 88.1%), linear-gradient(to bottom, transparent 17.9%, rgba(255, 255, 255, 0.12) 17.9%, rgba(255, 255, 255, 0.12) 18.1%, transparent 18.1%, transparent 49.9%, rgba(255, 255, 255, 0.15) 49.9%, rgba(255, 255, 255, 0.15) 50.1%, transparent 50.1%, transparent 81.9%, rgba(255, 255, 255, 0.12) 81.9%, rgba(255, 255, 255, 0.12) 82.1%, transparent 82.1%), radial-gradient(circle at 0% 50%, rgba(255, 255, 255, 0.95) 0 3px, transparent 3.5px), radial-gradient(circle at 100% 50%, rgba(255, 255, 255, 0.95) 0 3px, transparent 3.5px)",
      };
    }

    return {
      pointerEvents: "none",
      opacity: themeVisuals.overlayOpacity,
      backgroundImage:
        "repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0) 2px, rgba(158, 255, 182, 0.25) 3px, rgba(0, 0, 0, 0) 4px)",
    };
  }, [themeVisuals]);

  const codeWindowStyle: React.CSSProperties = useMemo(() => {
    return {
      width: codeWidth || "100%",
      maxWidth: "100%",
      padding: `${verticalPadding}px ${horizontalPadding}px`,
      backgroundColor: themeVisuals.codeSurface,
      border: `1px solid ${themeVisuals.codeBorder}`,
      borderRadius: themeVisuals.codeRadius,
      boxShadow: themeVisuals.codeShadow,
      overflow: "hidden",
    };
  }, [codeWidth, themeVisuals]);

  const sequenceStyle: React.CSSProperties = useMemo(() => {
    return {
      display: "flex",
      flexDirection: "column",
      gap: themeVisuals.showFilename ? 24 : 0,
      height: "100%",
    };
  }, [themeVisuals.showFilename]);

  const filenameStyle: React.CSSProperties = useMemo(() => {
    return {
      color: themeVisuals.filenameColor,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: "lowercase",
      opacity: 0.9,
    };
  }, [themeVisuals.filenameColor]);

  return (
    <ThemeProvider themeColors={themeColors}>
      <AbsoluteFill style={backgroundStyle}>
        {overlayStyle ? <AbsoluteFill style={overlayStyle} /> : null}
        <ProgressBar
          steps={steps}
          trackColor={themeVisuals.progressTrack}
          fillColor={brand?.accent ?? themeVisuals.accent}
          top={themeVisuals.progressTop}
          height={themeVisuals.progressHeight}
          gap={themeVisuals.progressGap}
        />
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: `${verticalPadding}px ${horizontalPadding}px`,
          }}
        >
          <div style={codeWindowStyle}>
            <Series>
              {steps.map((step, index) => (
                <Series.Sequence
                  key={index}
                  layout="none"
                  durationInFrames={step.durationInFrames}
                  name={step.code.meta}
                >
                  <div style={sequenceStyle}>
                    {themeVisuals.showFilename ? (
                      <div style={filenameStyle}>{step.code.meta}</div>
                    ) : null}
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
                  </div>
                </Series.Sequence>
              ))}
            </Series>
          </div>
        </AbsoluteFill>
        <BrandOverlay brand={brand} />
      </AbsoluteFill>
      <RefreshOnCodeChange />
    </ThemeProvider>
  );
};
