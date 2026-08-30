import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";

const outputDirectory = new URL("../dist-github-pages/", import.meta.url);
const indexFile = new URL("index.html", outputDirectory);

await copyFile(indexFile, new URL("404.html", outputDirectory));
await writeFile(new URL(".nojekyll", outputDirectory), "");

const projectEntries = await readdir(
  new URL("../public/projects/", import.meta.url),
  { withFileTypes: true },
);

await Promise.all(
  projectEntries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    const projectDirectory = new URL(`projects/${entry.name}/`, outputDirectory);
    await mkdir(projectDirectory, { recursive: true });
    await copyFile(indexFile, new URL("index.html", projectDirectory));
  }),
);
