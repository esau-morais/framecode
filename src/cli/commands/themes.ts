import { Command } from "commander";
import chalk from "chalk";
import {
  themeSchema,
  getThemeColors,
  curatedThemeNames,
} from "../../calculate-metadata/theme";

export const themesCommand = new Command("themes")
  .description("List available themes")
  .action(async () => {
    const themes = themeSchema.options;
    const custom = new Set<string>(curatedThemeNames);
    const builtIns = themes.filter((theme) => custom.has(theme));
    const extra = themes.filter((theme) => !custom.has(theme));

    console.log(chalk.bold("\nBuilt-in Themes:\n"));

    for (const theme of builtIns) {
      try {
        const colors = await getThemeColors(theme);
        const preview = chalk.bgHex(colors.background).hex(colors.foreground)(
          ` ${theme} `,
        );
        console.log(`  ${preview}`);
      } catch {
        console.log(`  ${theme}`);
      }
    }

    console.log(chalk.bold("\nAll Themes:\n"));

    for (const theme of extra) {
      try {
        const colors = await getThemeColors(theme);
        const preview = chalk.bgHex(colors.background).hex(colors.foreground)(
          ` ${theme} `,
        );
        console.log(`  ${preview}`);
      } catch {
        console.log(`  ${theme}`);
      }
    }

    console.log(chalk.dim(`\nTotal: ${themes.length} themes\n`));
  });
