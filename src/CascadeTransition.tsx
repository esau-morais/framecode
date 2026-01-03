import { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { HighlightedCode } from "codehike/code";
import { fontFamily, fontSize as baseFontSize, tabSize } from "./font";

type TimingMode = "spring" | "linear";

interface LineInfo {
  tokens: React.ReactNode[];
}

function tokenizeLines(code: HighlightedCode): LineInfo[] {
  const lines: LineInfo[] = [];
  let currentLine: React.ReactNode[] = [];
  let keyIndex = 0;

  for (const token of code.tokens) {
    if (typeof token === "string") {
      const parts = token.split("\n");
      parts.forEach((part, i) => {
        if (i > 0) {
          lines.push({ tokens: currentLine });
          currentLine = [];
        }
        if (part) {
          currentLine.push(<span key={keyIndex++}>{part}</span>);
        }
      });
    } else {
      const [content, color, style] = token;
      const tokenStyle: React.CSSProperties = {
        ...style,
        color: color ?? style?.color,
      };
      const parts = content.split("\n");
      parts.forEach((part, i) => {
        if (i > 0) {
          lines.push({ tokens: currentLine });
          currentLine = [];
        }
        if (part) {
          currentLine.push(
            <span key={keyIndex++} style={tokenStyle}>
              {part}
            </span>,
          );
        }
      });
    }
  }

  if (currentLine.length > 0) {
    lines.push({ tokens: currentLine });
  }

  while (lines.length > 0 && lines[lines.length - 1].tokens.length === 0) {
    lines.pop();
  }

  return lines;
}

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

  const lines = useMemo(() => tokenizeLines(code), [code]);

  return (
    <pre
      style={{
        fontSize: fontSize ?? baseFontSize,
        lineHeight: 1.5,
        fontFamily,
        tabSize,
        margin: 0,
        whiteSpace: "pre",
      }}
    >
      <code>
        {lines.map((line, index) => {
          const delay = index * staggerDelay;

          const progress =
            timing === "spring"
              ? spring({
                  frame,
                  fps,
                  delay,
                  config: { damping: 20, stiffness: 100 },
                })
              : interpolate(frame, [delay, delay + 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

          const opacity = progress;
          const translateY = interpolate(progress, [0, 1], [10, 0]);

          return (
            <div
              key={index}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
              }}
            >
              {line.tokens.length > 0 ? line.tokens : "\u00A0"}
            </div>
          );
        })}
      </code>
    </pre>
  );
}
