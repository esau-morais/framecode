import chalk from "chalk";

export const logger = {
  info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
  success: (msg: string) => console.log(chalk.green("✔"), msg),
  error: (msg: string) => console.error(chalk.red("✖"), msg),
  warn: (msg: string) => console.warn(chalk.yellow("⚠"), msg),
};

export class ProgressBar {
  private width = 30;
  private label: string;
  private lastPct = -1;

  constructor(label: string) {
    this.label = label;
  }

  update(progress: number) {
    const pct = Math.round(progress * 100);
    if (pct === this.lastPct) return;
    this.lastPct = pct;

    const filled = Math.round(this.width * progress);
    const empty = this.width - filled;
    const bar = chalk.blue("█").repeat(filled) + chalk.gray("░").repeat(empty);

    process.stdout.write(`\r${chalk.blue("ℹ")} ${this.label} ${bar} ${pct}%`);

    if (pct === 100) process.stdout.write("\n");
  }

  clear() {
    process.stdout.write("\r" + " ".repeat(60) + "\r");
  }
}
