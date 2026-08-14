export type ProjectStatus = "已完成" | "持续更新" | "开发中";
export type StatusTone = "complete" | "updating" | "building";
export type MediaOrientation = "landscape" | "portrait";

export type ProjectMedia = {
  id: string;
  kind: "image" | "video";
  orientation: MediaOrientation;
  label: string;
};

export type ProjectLink = {
  label: string;
  kind: "website" | "video" | "repository";
  url: string | null;
};

export type ProjectFile = {
  label: string;
  fileName: string;
  fileSize: string;
  url: string | null;
};

export type Project = {
  order: number;
  slug: string;
  title: string;
  type: string;
  category: string;
  platforms: string[];
  coreTool: string;
  auxiliaryTools: string[];
  description: string;
  status: ProjectStatus;
  statusTone: StatusTone;
  accent: string;
  accentSecondary: string;
  media: ProjectMedia[];
  links: ProjectLink[];
  files: ProjectFile[];
};

const categories = [
  "游戏与互动",
  "视频与动画",
  "应用与工具",
  "Agent 应用",
  "自动化",
  "互动叙事",
] as const;

const palettes = [
  ["#7c5cff", "#20d8ff"],
  ["#ff496c", "#ffb54a"],
  ["#21d4a5", "#1b8dff"],
  ["#ff6ee7", "#795cff"],
  ["#f3de5b", "#ff6a3d"],
  ["#63e6ff", "#6467ff"],
  ["#9cff6a", "#1ecab8"],
  ["#ff8f66", "#ff3d91"],
  ["#b88aff", "#4169ff"],
  ["#54e0c7", "#a8ff6a"],
  ["#ffcc4d", "#ff5f78"],
  ["#49bfff", "#9a5cff"],
] as const;

const statuses: Array<{ status: ProjectStatus; tone: StatusTone }> = [
  { status: "已完成", tone: "complete" },
  { status: "持续更新", tone: "updating" },
  { status: "开发中", tone: "building" },
];

const platformSets = [
  ["Web", "TypeScript", "Canvas"],
  ["Video", "After Effects", "ComfyUI"],
  ["iOS", "SwiftUI", "CloudKit"],
  ["macOS", "Python", "Automation"],
  ["H5", "React", "Web Audio"],
  ["PDF", "Agent", "Interactive Story"],
] as const;

export const projects: Project[] = Array.from({ length: 12 }, (_, index) => {
  const order = index + 1;
  const category = categories[index % categories.length];
  const palette = palettes[index];
  const status = statuses[index % statuses.length];
  const platforms = platformSets[index % platformSets.length];

  return {
    order,
    slug: `project-${String(order).padStart(2, "0")}`,
    title: `项目名称 ${String(order).padStart(2, "0")}`,
    type: `${category} · 项目类型占位`,
    category,
    platforms: [...platforms],
    coreTool: `核心 AIGC 工具 ${String.fromCharCode(65 + (index % 6))}`,
    auxiliaryTools: ["辅助工具 01", "辅助工具 02"],
    description:
      "这里将填写项目的完整介绍：它为什么被制作、解决了什么问题、用户可以获得怎样的体验，以及你在项目中完成的关键判断与工作。当前文字用于验证详情页的阅读节奏和排版宽度。",
    status: status.status,
    statusTone: status.tone,
    accent: palette[0],
    accentSecondary: palette[1],
    media: [
      {
        id: `${order}-hero`,
        kind: "video",
        orientation: "landscape",
        label: "横版视频 / 主演示画面",
      },
      {
        id: `${order}-portrait-a`,
        kind: "image",
        orientation: "portrait",
        label: "竖版截图 01",
      },
      {
        id: `${order}-portrait-b`,
        kind: "image",
        orientation: "portrait",
        label: "竖版截图 02",
      },
      {
        id: `${order}-wide`,
        kind: "image",
        orientation: "landscape",
        label: "横版截图 / 制作过程",
      },
    ],
    links: [
      { label: "在线体验", kind: "website", url: null },
      { label: "演示视频", kind: "video", url: null },
      { label: "代码仓库", kind: "repository", url: null },
    ],
    files: [
      {
        label: "项目源文件",
        fileName: "source-file-placeholder.zip",
        fileSize: "待上传",
        url: null,
      },
    ],
  };
});

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getAdjacentProjects(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return { previous: null, next: null };

  return {
    previous: projects[(index - 1 + projects.length) % projects.length],
    next: projects[(index + 1) % projects.length],
  };
}
