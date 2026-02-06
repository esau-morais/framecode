# FrameCode

[![npm version](https://img.shields.io/npm/v/framecode)](https://www.npmjs.com/package/framecode)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![stars](https://img.shields.io/github/stars/esau-morais/framecode?style=social)](https://github.com/esau-morais/framecode)

CLI-first video generator that turns code snippets into social-ready videos with Remotion + Shiki.

## Features

- 5 built-in themes: `vercel-dark`, `story-gradients`, `retro-terminal`, `github-dark`, `synthwave-84`
- Animations: `morph`, `typewriter`, `cascade` (with per-file overrides)
- Presets: `post` (9:16), `tutorial` (16:9), `square` (1:1)
- Optional brand kit overlay: logo, Twitter/X handle, website, accent color
- Interactive render wizard or fully scripted CLI flow

## Quick Start

```bash
bunx framecode init --local
framecode render "~/projects/demo/src/**/*.ts" -t vercel-dark -a cascade -p tutorial
```

## Installation

```bash
bun add -g framecode
framecode --help
```

## Usage

```bash
# Example 1: Single file
framecode render "~/projects/demo/src/intro.ts" -t story-gradients -a typewriter

# Example 2: Multi-file with per-step overrides in config
framecode render "~/projects/demo/src/**/*.ts" "!**/*.test.ts" -c framecode.json

# Example 3: Add brand kit on render
framecode render "~/projects/demo/src/main.ts" \
  --logo "~/projects/demo/public/logo.png" \
  --twitter framecodehq \
  --website framecode.dev \
  --accent "#ff8800"
```

## Config

Create config with:

```bash
framecode init --local
```

Minimal `framecode.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/esau-morais/framecode/main/framecode.schema.json",
  "theme": "vercel-dark",
  "preset": "tutorial",
  "animation": "cascade",
  "stepConfigs": [{ "file": "intro.ts", "animation": "typewriter", "charsPerSecond": 42 }],
  "brand": { "twitter": "@framecodehq", "accent": "#ff8800" }
}
```

## Themes

```bash
framecode themes
```

Shows built-in themes first, then the full Shiki theme catalog.

## Animations

- `morph`: smooth transition between snapshots
- `typewriter`: character reveal with cursor
- `cascade`: line-by-line reveal with stagger

## Roadmap

Current focus: Phase 1 MVP CLI completion (themes, brand kit, docs polish), then monorepo + web in Phase 2.

## Contributing

```bash
bun install
bun run lint
bun run typecheck
```

## License

MIT
