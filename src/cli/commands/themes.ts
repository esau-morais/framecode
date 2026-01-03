import { Command } from "commander";
import chalk from "chalk";
import { themeSchema, getThemeColors } from "../../calculate-metadata/theme";

export const themesCommand = new Command("themes")
  .description("List available themes")
  .action(async () => {
    const themes = themeSchema.options;

    console.log(chalk.bold("\nAvailable Themes:\n"));

    for (const theme of themes) {
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
