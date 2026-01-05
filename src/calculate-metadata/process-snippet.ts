import { highlight } from "codehike/code";
import { StaticFile } from "./get-files";
import { Theme, loadTheme } from "./theme";

export const processSnippetSimple = async (step: StaticFile, theme: Theme) => {
  const splitted = step.filename.split(".");
  const extension = splitted[splitted.length - 1];

  const shikiTheme = await loadTheme(theme);

  const highlighted = await highlight(
    {
      lang: extension,
      meta: step.filename,
      value: step.value,
    },
    shikiTheme,
  );

  return highlighted;
};
