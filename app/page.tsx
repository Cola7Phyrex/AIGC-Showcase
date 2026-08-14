import type { Metadata } from "next";
import { headers } from "next/headers";
import { ProjectExplorer } from "../components/ProjectExplorer";
import { projects } from "../data/projects";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = `${origin}/og.png`;

  return {
    title: "AIGC Works — 12 Projects",
    description: "十二个 AIGC 项目的沉浸式作品展厅。",
    openGraph: {
      type: "website",
      locale: "zh_CN",
      title: "AIGC Works — 12 Projects",
      description: "十二个 AIGC 项目的沉浸式作品展厅。",
      url: origin,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: "AIGC Works — 12 Projects",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "AIGC Works — 12 Projects",
      description: "十二个 AIGC 项目的沉浸式作品展厅。",
      images: [socialImage],
    },
  };
}

export default function Home() {
  return <ProjectExplorer projects={projects} />;
}
