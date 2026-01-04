import { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HighlightedCode } from "codehike/code";
import { fontFamily, fontSize as baseFontSize, tabSize } from "./font";
import { useThemeColors } from "./calculate-metadata/theme";

interface CharInfo {
  char: string;
  style: React.CSSProperties;
}

export function flattenCode(code: HighlightedCode): CharInfo[] {
  const chars: CharInfo[] = [];

  for (const token of code.tokens) {
    if (typeof token === "string") {
      for (const char of token) {
        chars.push({ char, style: {} });
      }
    } else {
      const [content, color, style] = token;
      const tokenStyle: React.CSSProperties = {
        ...style,
        color: color ?? style?.color,
      };
      for (const char of content) {
        chars.push({ char, style: tokenStyle });
      }
    }
  }

  while (chars.length > 0 && chars[chars.length - 1].char === "\n") {
    chars.pop();
  }

  return chars;
}

interface Segment {
  text: string;
  style: React.CSSProperties;
  startIndex: number;
  isNewline: boolean;
}

function groupCharsIntoSegments(chars: CharInfo[]): Segment[] {
  const segments: Segment[] = [];
  let i = 0;

  while (i < chars.length) {
    const { char, style } = chars[i];

    if (char === "\n") {
      segments.push({ text: "\n", style: {}, startIndex: i, isNewline: true });
      i++;
      continue;
    }

    let text = char;
    const startIndex = i;
    i++;

    while (
      i < chars.length &&
      chars[i].char !== "\n" &&
      chars[i].style.color === style.color
    ) {
      text += chars[i].char;
      i++;
    }

    segments.push({ text, style, startIndex, isNewline: false });
  }

  return segments;
}

export function TypewriterTransition({
  code,
  charsPerSecond = 30,
  fontSize,
}: {
  readonly code: HighlightedCode;
  readonly charsPerSecond?: number;
  readonly fontSize?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const themeColors = useThemeColors();

  const chars = useMemo(() => flattenCode(code), [code]);
  const segments = useMemo(() => groupCharsIntoSegments(chars), [chars]);
  const totalChars = chars.length;

  const typingDuration = (totalChars / charsPerSecond) * fps;

  const charsShown = Math.floor(
    interpolate(frame, [0, typingDuration], [0, totalChars], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }),
  );

  const isComplete = charsShown >= totalChars;
  const blinkInterval = Math.round(fps / 2);
  const cursorVisible = isComplete
    ? Math.floor(frame / blinkInterval) % 2 === 0
    : true;

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
        {segments.map((segment, idx) => {
          const segmentEnd = segment.startIndex + segment.text.length;

          if (segment.startIndex >= charsShown) {
            return null;
          }

          if (segment.isNewline) {
            return <br key={idx} />;
          }

          const visibleLength = Math.min(
            segment.text.length,
            charsShown - segment.startIndex,
          );

          if (segmentEnd <= charsShown) {
            return (
              <span key={idx} style={segment.style}>
                {segment.text}
              </span>
            );
          }

          return (
            <span key={idx} style={segment.style}>
              {segment.text.slice(0, visibleLength)}
            </span>
          );
        })}
        <span
          key="cursor"
          style={{
            display: "inline-block",
            width: "0.6em",
            height: "1.2em",
            backgroundColor: themeColors?.foreground ?? "currentColor",
            opacity: cursorVisible ? 0.8 : 0,
            verticalAlign: "text-bottom",
            marginLeft: 2,
          }}
        />
      </code>
    </pre>
  );
}
