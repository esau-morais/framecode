import { getStaticFiles } from "@remotion/studio";

export type StaticFile = {
  filename: string;
  value: string;
};

export const getFilesFromStudio = async (): Promise<StaticFile[]> => {
  const files = getStaticFiles();

  const contents = files.map(async (file): Promise<StaticFile> => {
    const res = await fetch(file.src);
    const text = await res.text();
    return { filename: file.name, value: text };
  });

  return Promise.all(contents);
};
