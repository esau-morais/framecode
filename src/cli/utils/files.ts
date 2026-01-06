import { Glob } from "bun";
import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import { logger } from "./logger";

const CODE_EXTENSIONS =
  "*.{ts,tsx,js,jsx,mjs,cjs,py,rb,go,rs,java,kt,swift,c,cpp,h,hpp,cs,php,vue,svelte}";

const DEFAULT_IGNORES = [
  "node_modules",
  "dist",
  "build",
  "out",
  ".git",
  ".next",
  ".turbo",
  ".cache",
  "coverage",
  ".remotion",
];

async function loadGitignorePatterns(): Promise<string[]> {
  const gitignorePath = ".gitignore";
  const file = Bun.file(gitignorePath);

  if (!(await file.exists())) {
    return [];
  }

  const content = await file.text();
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function shouldIgnore(filePath: string, ignorePatterns: string[]): boolean {
  for (const pattern of ignorePatterns) {
    if (pattern.endsWith("/")) {
      const dir = pattern.slice(0, -1);
      if (
        filePath.startsWith(dir + "/") ||
        filePath.includes("/" + dir + "/")
      ) {
        return true;
      }
    } else if (pattern.includes("/")) {
      const glob = new Glob(pattern);
      if (glob.match(filePath)) return true;
    } else {
      if (
        filePath === pattern ||
        filePath.startsWith(pattern + "/") ||
        filePath.includes("/" + pattern + "/") ||
        filePath.includes("/" + pattern)
      ) {
        return true;
      }
      const glob = new Glob(`**/${pattern}`);
      if (glob.match(filePath)) return true;
    }
  }
  return false;
}

async function getIgnorePatterns(): Promise<string[]> {
  const gitignore = await loadGitignorePatterns();
  return [...DEFAULT_IGNORES, ...gitignore];
}

export async function expandGlobPatterns(
  patterns: string[],
): Promise<string[]> {
  const files: string[] = [];
  const userExcludes: string[] = [];
  const ignorePatterns = await getIgnorePatterns();

  for (const pattern of patterns) {
    if (pattern.startsWith("!")) {
      userExcludes.push(pattern.slice(1));
      continue;
    }

    const isDirectory = await isDir(pattern);
    if (isDirectory) {
      const dirGlob = new Glob(
        `${pattern.replace(/\/$/, "")}/**/${CODE_EXTENSIONS}`,
      );
      for await (const file of dirGlob.scan({ cwd: ".", onlyFiles: true })) {
        if (!shouldIgnore(file, ignorePatterns)) {
          files.push(file);
        }
      }
      continue;
    }

    const hasGlobChars = /[*?[\]{}]/.test(pattern);
    if (hasGlobChars) {
      const glob = new Glob(pattern);
      for await (const file of glob.scan({ cwd: ".", onlyFiles: true })) {
        if (!shouldIgnore(file, ignorePatterns)) {
          files.push(file);
        }
      }
    } else {
      files.push(pattern);
    }
  }

  const uniqueFiles = [...new Set(files)];

  if (userExcludes.length === 0) {
    return uniqueFiles;
  }

  return uniqueFiles.filter((file) => {
    return !userExcludes.some((excludePattern) => {
      const glob = new Glob(excludePattern);
      return glob.match(file);
    });
  });
}

async function isDir(path: string): Promise<boolean> {
  try {
    return (await Bun.file(path).stat()).isDirectory();
  } catch {
    return false;
  }
}

export function isInteractiveTerminal(): boolean {
  return process.stdout.isTTY === true && process.stdin.isTTY === true;
}

export async function promptFileSelection(files: string[]): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  if (files.length === 1) {
    return files;
  }

  const choices = files.map((file) => ({
    name: `${file} ${chalk.dim(`(${getFileSize(file)})`)}`,
    value: file,
  }));

  const selected = await checkbox({
    message:
      "Select files to render (↑↓ navigate, space toggle, a toggle all, type to filter)",
    choices,
    loop: false,
    pageSize: 15,
  });

  if (selected.length === 0) {
    logger.warn("No files selected, exiting");
    process.exit(0);
  }

  return selected;
}

function getFileSize(filePath: string): string {
  try {
    const file = Bun.file(filePath);
    const bytes = file.size;

    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  } catch {
    return "?";
  }
}

const MAX_SCAN_DEPTH = 5;

function getDepth(filePath: string): number {
  return filePath.split("/").length - 1;
}

export async function scanCurrentDirectory(): Promise<string[]> {
  const glob = new Glob(`**/${CODE_EXTENSIONS}`);
  const files: string[] = [];
  const ignorePatterns = await getIgnorePatterns();

  for await (const file of glob.scan({
    cwd: ".",
    onlyFiles: true,
    dot: false,
  })) {
    if (getDepth(file) > MAX_SCAN_DEPTH) continue;
    if (!shouldIgnore(file, ignorePatterns)) {
      files.push(file);
    }
  }

  return files.sort();
}
