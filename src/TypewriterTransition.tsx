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

  const elements: React.ReactNode[] = [];
  for (let i = 0; i < charsShown; i++) {
    const { char, style } = chars[i];
    if (char === "\n") {
      elements.push(<br key={`br-${i}`} />);
    } else {
      elements.push(
        <span key={i} style={style}>
          {char}
        </span>,
      );
    }
  }

  elements.push(
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
    />,
  );

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
      <code>{elements}</code>
    </pre>
  );
}
