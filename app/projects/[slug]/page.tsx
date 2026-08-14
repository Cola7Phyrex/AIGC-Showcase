import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdjacentProjects,
  getProject,
  projects,
} from "../../../data/projects";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { previous, next } = getAdjacentProjects(slug);
  const themeStyle = {
    "--active-accent": project.accent,
    "--active-accent-secondary": project.accentSecondary,
  } as CSSProperties;

  return (
    <main className="detail-page" style={themeStyle}>
      <header className="detail-header">
        <Link className="wordmark wordmark-link" href="/#works">
          <span>AIGC</span>
          <span>WORKS</span>
        </Link>
        <div className="detail-header-center">
          {String(project.order).padStart(2, "0")} / 12
        </div>
        <Link className="back-link" href="/#works">
          ← BACK TO INDEX
        </Link>
      </header>

      <section className="detail-hero">
        <div className="detail-title-block">
          <div className="eyebrow-row">
            <span>{project.type}</span>
            <span className={`status-chip status-${project.statusTone}`}>
              {project.status}
            </span>
          </div>
          <h1>{project.title}</h1>
          <div className="platform-list">
            {project.platforms.map((platform) => (
              <span className="platform-chip" key={platform}>
                {platform}
              </span>
            ))}
          </div>
          <div className="tool-group detail-tools">
            <span className="tool-chip tool-chip-core">
              <small>CORE AIGC</small>
              {project.coreTool}
            </span>
            {project.auxiliaryTools.map((tool) => (
              <span className="tool-chip" key={tool}>
                <small>AUX</small>
                {tool}
              </span>
            ))}
          </div>
        </div>

        <div
          className="detail-cover"
          style={
            {
              viewTransitionName: `project-${project.slug}`,
            } as CSSProperties
          }
        >
          <div className="cover-grid" />
          <div className="cover-orbit cover-orbit-a" />
          <div className="cover-orbit cover-orbit-b" />
          <div className="detail-cover-number">
            {String(project.order).padStart(2, "0")}
          </div>
          <span>16:9 PROJECT COVER PLACEHOLDER</span>
        </div>
      </section>

      <section className="detail-introduction content-section">
        <div className="section-label">
          <span>01</span>
          <span>ABOUT</span>
        </div>
        <div className="introduction-copy">
          <p>{project.description}</p>
          <div className="detail-facts">
            <div>
              <small>PROJECT TYPE</small>
              <strong>{project.category}</strong>
            </div>
            <div>
              <small>STATUS</small>
              <strong>{project.status}</strong>
            </div>
            <div>
              <small>UPDATED</small>
              <strong>2026 / PLACEHOLDER</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section media-section">
        <div className="section-label">
          <span>02</span>
          <span>MEDIA</span>
        </div>
        <div className="section-heading-row">
          <h2>图片 / 视频预览</h2>
          <p>横版与竖版素材可以混排；替换占位素材后无需修改页面结构。</p>
        </div>

        <div className="media-grid">
          {project.media.map((media, index) => (
            <figure
              className={`media-card media-${media.orientation}${
                index === 0 ? " media-featured" : ""
              }`}
              key={media.id}
            >
              <div className="media-placeholder">
                <span>{media.kind === "video" ? "▶" : "+"}</span>
                <strong>{media.orientation === "landscape" ? "16:9" : "9:16"}</strong>
              </div>
              <figcaption>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{media.label}</span>
                <small>{media.kind.toUpperCase()}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="content-section resources-section">
        <div className="section-label">
          <span>03</span>
          <span>LINKS / FILES</span>
        </div>
        <div className="section-heading-row">
          <h2>内容链接 / 源文件</h2>
          <p>网址和文件都由项目数据配置；没有内容时不会生成虚假跳转。</p>
        </div>

        <div className="resource-grid">
          <div className="resource-column">
            <span className="resource-column-title">EXTERNAL LINKS</span>
            {project.links.map((link) =>
              link.url ? (
                <a key={link.label} href={link.url} target="_blank" rel="noreferrer">
                  <span>{link.label}</span>
                  <small>OPEN ↗</small>
                </a>
              ) : (
                <div className="resource-disabled" key={link.label}>
                  <span>{link.label}</span>
                  <small>待添加网址</small>
                </div>
              ),
            )}
          </div>

          <div className="resource-column">
            <span className="resource-column-title">SOURCE FILES</span>
            {project.files.map((file) =>
              file.url ? (
                <a key={file.fileName} href={file.url} download>
                  <span>
                    {file.label}
                    <small>{file.fileName}</small>
                  </span>
                  <small>{file.fileSize} ↓</small>
                </a>
              ) : (
                <div className="file-drop-placeholder" key={file.fileName}>
                  <span className="file-plus">+</span>
                  <span>
                    <strong>{file.label}</strong>
                    <small>待放入项目资源目录并填写文件地址</small>
                  </span>
                  <small>{file.fileSize}</small>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <nav className="next-projects" aria-label="项目间导航">
        {previous && (
          <Link href={`/projects/${previous.slug}`}>
            <small>PREVIOUS</small>
            <span>← {previous.title}</span>
          </Link>
        )}
        {next && (
          <Link href={`/projects/${next.slug}`}>
            <small>NEXT</small>
            <span>{next.title} →</span>
          </Link>
        )}
      </nav>
    </main>
  );
}
