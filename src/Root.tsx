import { Composition, Folder } from "remotion";
import { Main } from "./Main";
import "./index.css";

import { calculateMetadata } from "./calculate-metadata/calculate-metadata";
import { schema } from "./calculate-metadata/schema";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        defaultProps={{
          steps: null,
          themeColors: null,
          codeWidth: null,
          theme: "github-dark" as const,
          preset: "tutorial" as const,
          animation: "morph" as const,
          charsPerSecond: 30,
        }}
        fps={30}
        height={1080}
        calculateMetadata={calculateMetadata}
        schema={schema}
      />
      <Folder name="Presets">
        <Composition
          id="Preset-Post"
          component={Main}
          width={720}
          height={1280}
          fps={30}
          durationInFrames={150}
          defaultProps={{
            steps: null,
            themeColors: null,
            codeWidth: null,
            theme: "github-dark" as const,
            preset: "post" as const,
            animation: "morph" as const,
            charsPerSecond: 30,
          }}
          calculateMetadata={calculateMetadata}
          schema={schema}
        />
        <Composition
          id="Preset-Tutorial"
          component={Main}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={300}
          defaultProps={{
            steps: null,
            themeColors: null,
            codeWidth: null,
            theme: "github-dark" as const,
            preset: "tutorial" as const,
            animation: "morph" as const,
            charsPerSecond: 30,
          }}
          calculateMetadata={calculateMetadata}
          schema={schema}
        />
        <Composition
          id="Preset-Square"
          component={Main}
          width={1080}
          height={1080}
          fps={30}
          durationInFrames={150}
          defaultProps={{
            steps: null,
            themeColors: null,
            codeWidth: null,
            theme: "github-dark" as const,
            preset: "square" as const,
            animation: "morph" as const,
            charsPerSecond: 30,
          }}
          calculateMetadata={calculateMetadata}
          schema={schema}
        />
      </Folder>
    </>
  );
};
