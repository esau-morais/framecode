#!/usr/bin/env bun
import { Command } from "commander";
import { renderCommand } from "./commands/render";
import { themesCommand } from "./commands/themes";
import { initCommand } from "./commands/init";

const program = new Command();

program
  .name("framecode")
  .description(
    "CLI-first video generator that turns code into Twitter-ready videos",
  )
  .version("0.1.0");

program.addCommand(renderCommand);
program.addCommand(themesCommand);
program.addCommand(initCommand);

program.parseAsync();
