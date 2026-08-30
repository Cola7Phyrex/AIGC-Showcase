/* eslint-disable @next/next/no-img-element -- Static GitHub Pages output uses local public assets directly. */
import type { CSSProperties } from "react";
import type { Project } from "../data/projects";

type ProjectDetailProps = {
  project: Project;
  projects: Project[];
  previous: Project | null;
  next: Project | null;
  basePath: string;
};

const withBasePath = (path: string, basePath: string) => {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${base}${path.replace(/^\/+/, "")}`;
};

export function ProjectDetail({
  project,
  projects,
  previous,
  next,
  basePath,
}: ProjectDetailProps) {
  const themeStyle = {
    "--active-accent": project.accent,
    "--active-accent-secondary": project.accentSecondary,
  } as CSSProperties;
  const homeHref = `${basePath}#works`;
  const projectHref = (slug: string) => withBasePath(`projects/${slug}/`, basePath);

  return (
    <main className="detail-page" style={themeStyle}>
      <header className="detail-header">
        <a className="wordmark wordmark-link" href={homeHref}>
          <span>AIGC</span>
          <span>WORKS</span>
        </a>
        <div className="detail-header-center">
          {String(project.order).padStart(2, "0")} / {projects.length}
        </div>
        <a className="back-link" href={homeHref}>← BACK TO INDEX</a>
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
              <span className="platform-chip" key={platform}>{platform}</span>
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
          className={`detail-cover${project.coverImage ? " has-cover" : ""}`}
          style={{ viewTransitionName: `project-${project.slug}` } as CSSProperties}
        >
          {project.coverImage && (
            <img
              className="detail-cover-image"
              src={withBasePath(project.coverImage, basePath)}
              alt={project.coverAlt ?? `${project.title} 封面`}
              fetchPriority="high"
            />
          )}
          <div className="cover-grid" />
          <div className="cover-orbit cover-orbit-a" />
          <div className="cover-orbit cover-orbit-b" />
          <div className="detail-cover-number">
            {String(project.order).padStart(2, "0")}
          </div>
          <span>PROJECT COVER</span>
        </div>
      </section>

      <section className="detail-introduction content-section">
        <div className="section-label"><span>01</span><span>ABOUT</span></div>
        <div className="introduction-copy">
          <p>{project.description}</p>
          <div className="project-highlight">
            <small>WHY IT STANDS OUT</small>
            <p>{project.highlight}</p>
          </div>
          <div className="detail-facts">
            <div><small>PROJECT TYPE</small><strong>{project.category}</strong></div>
            <div><small>STATUS</small><strong>{project.status}</strong></div>
          </div>
        </div>
      </section>

      <section className="content-section media-section">
        <div className="section-label"><span>02</span><span>MEDIA</span></div>
        <div className="section-heading-row"><h2>预览</h2></div>
        <div className="media-grid">
          {project.media.map((media, index) => (
            <figure
              className={`media-card media-${media.orientation}${
                media.layout === "full" || media.layout === "contained" ||
                (index === 0 && !media.layout) ? " media-featured" : ""
              }${media.layout === "tile" ? " media-tile" : ""}${
                media.layout === "contained" ? " media-contained" : ""
              }${media.layout === "pair" ? " media-pair" : ""}${
                media.layout === "triplet" ? " media-triplet" : ""
              }${media.layout === "quartet" ? " media-quartet" : ""}`}
              key={media.id}
            >
              {media.src ? (
                <img
                  className="media-image"
                  src={withBasePath(media.src, basePath)}
                  alt={media.alt ?? media.label}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  style={{
                    aspectRatio: media.aspectRatio ??
                      (media.orientation === "landscape" ? "16 / 9" : "9 / 16"),
                  }}
                />
              ) : (
                <div className="media-placeholder">
                  <span>{media.kind === "video" ? "▶" : "+"}</span>
                  <strong>{media.orientation === "landscape" ? "16:9" : "9:16"}</strong>
                </div>
              )}
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
        <div className="section-label"><span>03</span><span>LINKS / FILES</span></div>
        <div className="section-heading-row"><h2>内容链接 / 源文件</h2></div>
        <div className={`resource-grid${
          project.files.length === 0 || project.links.length === 0
            ? " resource-grid-single-column" : ""
        }`}>
          {project.links.length > 0 && (
            <div className="resource-column">
              <span className="resource-column-title">EXTERNAL LINKS</span>
              {project.links.map((link) => link.url ? (
                <a key={link.label} href={link.url} target="_blank" rel="noreferrer">
                  <span>{link.label}</span><small>OPEN ↗</small>
                </a>
              ) : (
                <div className="resource-disabled" key={link.label}>
                  <span>{link.label}</span><small>待添加网址</small>
                </div>
              ))}
            </div>
          )}
          {project.files.length > 0 && (
            <div className="resource-column">
              <span className="resource-column-title">SOURCE FILES</span>
              {project.files.map((file) => file.url ? (
                <a key={file.fileName} href={withBasePath(file.url, basePath)} download>
                  <span>{file.label}<small>{file.fileName}</small></span>
                  <small>{file.fileSize} ↓</small>
                </a>
              ) : (
                <div className="file-drop-placeholder" key={file.fileName}>
                  <span className="file-plus">+</span>
                  <span><strong>{file.label}</strong><small>待放入项目资源目录并填写文件地址</small></span>
                  <small>{file.fileSize}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <nav className="next-projects" aria-label="项目间导航">
        {previous && (
          <a href={projectHref(previous.slug)}>
            <small>PREVIOUS</small><span>← {previous.title}</span>
          </a>
        )}
        {next && (
          <a href={projectHref(next.slug)}>
            <small>NEXT</small><span>{next.title} →</span>
          </a>
        )}
      </nav>
    </main>
  );
}
