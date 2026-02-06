import React, { useMemo } from "react";
import { Img, staticFile } from "remotion";
import { horizontalPadding } from "./font";
import { useThemeColors } from "./calculate-metadata/theme";
import type { BrandConfig } from "./calculate-metadata/schema";

function normalizeHandle(handle?: string): string | null {
  if (!handle) {
    return null;
  }

  const trimmed = handle.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function normalizeWebsite(website?: string): string | null {
  if (!website) {
    return null;
  }

  const trimmed = website.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^https?:\/\//i, "");
}

function resolveLogoSource(logo: string): string {
  if (/^(https?:)?\/\//i.test(logo) || logo.startsWith("data:")) {
    return logo;
  }

  const normalizedPath = logo.replaceAll("\\", "/").replace(/^\//, "");
  return staticFile(normalizedPath);
}

export function BrandOverlay({ brand }: { readonly brand?: BrandConfig }) {
  const themeColors = useThemeColors();

  const handle = normalizeHandle(brand?.twitter);
  const website = normalizeWebsite(brand?.website);
  const logo = brand?.logo?.trim() ? resolveLogoSource(brand.logo) : null;

  const hasTopLeft = Boolean(logo || website);
  const hasBottomRight = Boolean(handle);

  if (!hasTopLeft && !hasBottomRight) {
    return null;
  }

  const accent = brand?.accent ?? themeColors.icon.foreground;

  const chipStyle = useMemo<React.CSSProperties>(
    () => ({
      border: `1px solid ${accent}`,
      backgroundColor: "rgba(0, 0, 0, 0.58)",
      color: themeColors.foreground,
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 26,
      lineHeight: 1,
      letterSpacing: 0.2,
      fontWeight: 600,
      textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
    }),
    [accent, themeColors.foreground],
  );

  return (
    <>
      {hasTopLeft ? (
        <div
          style={{
            position: "absolute",
            top: 32,
            left: horizontalPadding,
            display: "flex",
            alignItems: "center",
            gap: 12,
            pointerEvents: "none",
          }}
        >
          {logo ? (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                border: `1px solid ${accent}`,
                backgroundColor: "rgba(0, 0, 0, 0.58)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Img
                src={logo}
                style={{
                  width: "80%",
                  height: "80%",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : null}
          {website ? <span style={chipStyle}>{website}</span> : null}
        </div>
      ) : null}
      {hasBottomRight ? (
        <div
          style={{
            position: "absolute",
            right: horizontalPadding,
            bottom: 32,
            pointerEvents: "none",
          }}
        >
          <span style={chipStyle}>{handle}</span>
        </div>
      ) : null}
    </>
  );
}
