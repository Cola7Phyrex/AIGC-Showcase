"use client";

import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Project } from "../data/projects";

type Overlay = "index" | "filter" | null;

export function ProjectExplorer({ projects }: { projects: Project[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [category, setCategory] = useState("全部");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const wheelLocked = useRef(false);
  const touchStart = useRef<number | null>(null);

  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(projects.map((item) => item.category)))],
    [projects],
  );

  const visibleProjects = useMemo(
    () =>
      category === "全部"
        ? projects
        : projects.filter((item) => item.category === category),
    [category, projects],
  );

  const activeProject = visibleProjects[activeIndex] ?? visibleProjects[0];

  const go = (direction: number) => {
    setActiveIndex((current) => {
      const total = visibleProjects.length;
      return (current + direction + total) % total;
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOverlay(null);
        return;
      }

      if (overlay) return;
      if (["ArrowDown", "ArrowRight", "PageDown"].includes(event.key)) {
        event.preventDefault();
        go(1);
      }
      if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        go(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (overlay || Math.abs(event.deltaY) < 12 || wheelLocked.current) return;
    wheelLocked.current = true;
    go(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLocked.current = false;
    }, 650);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStart.current === null || overlay) return;
    const delta = touchStart.current - event.changedTouches[0].clientY;
    if (Math.abs(delta) > 44) go(delta > 0 ? 1 : -1);
    touchStart.current = null;
  };

  const selectProject = (project: Project) => {
    setCategory("全部");
    setActiveIndex(project.order - 1);
    setOverlay(null);
  };

  return (
    <main
      className="portfolio-shell"
      style={
        {
          "--active-accent": activeProject.accent,
          "--active-accent-secondary": activeProject.accentSecondary,
        } as CSSProperties
      }
    >
      <header className="site-header">
        <button
          className="wordmark"
          onClick={() => {
            setCategory("全部");
            setActiveIndex(0);
          }}
          aria-label="返回第一个项目"
        >
          <span>AIGC</span>
          <span>WORKS</span>
        </button>

        <div className="header-meta" aria-hidden="true">
          <span>12 PROJECTS</span>
          <span>2026</span>
        </div>

        <nav className="header-actions" aria-label="作品浏览工具">
          <button onClick={() => setOverlay("index")}>INDEX</button>
          <button onClick={() => setOverlay("filter")}>FILTER</button>
        </nav>
      </header>

      <section
        className="project-stage"
        aria-label="项目空间画廊"
        onWheel={handleWheel}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientY;
        }}
        onTouchEnd={handleTouchEnd}
      >
        <div className="ambient-grid" aria-hidden="true" />
        <div className="ambient-glow" aria-hidden="true" />

        <div className="project-copy" aria-live="polite">
          <div className="eyebrow-row">
            <span>{String(activeProject.order).padStart(2, "0")}</span>
            <span>{activeProject.type}</span>
          </div>
          <h1>{activeProject.title}</h1>

          <div className="platform-list" aria-label="平台与技术栈">
            {activeProject.platforms.map((platform) => (
              <span className="platform-chip" key={platform}>
                {platform}
              </span>
            ))}
          </div>

          <div className="tool-group" aria-label="AIGC 工具">
            <span className="tool-chip tool-chip-core">
              <small>CORE</small>
              {activeProject.coreTool}
            </span>
            {activeProject.auxiliaryTools.map((tool) => (
              <span className="tool-chip" key={tool}>
                <small>AUX</small>
                {tool}
              </span>
            ))}
          </div>
        </div>

        <div className="cards-space" aria-label="项目封面">
          {visibleProjects.map((project, index) => {
            const difference = index - activeIndex;
            const distance = Math.abs(difference);
            const isActive = difference === 0;
            const isVisible = distance <= 2;

            const cardStyle = {
              "--card-accent": project.accent,
              "--card-accent-secondary": project.accentSecondary,
              transform: `translate3d(${difference * 54}%, ${distance * 2.8}%, ${
                -distance * 190
              }px) rotateY(${difference * -16}deg) scale(${Math.max(
                0.64,
                1 - distance * 0.12,
              )})`,
              opacity: isVisible ? Math.max(0.1, 1 - distance * 0.42) : 0,
              zIndex: 20 - distance,
              pointerEvents: isVisible ? "auto" : "none",
              viewTransitionName: isActive ? `project-${project.slug}` : "none",
            } as CSSProperties;

            return (
              <article
                className={`project-card${isActive ? " is-active" : ""}`}
                key={project.slug}
                style={cardStyle}
                aria-hidden={!isVisible}
              >
                <div className="project-card-visual">
                  <div className="cover-grid" />
                  <div className="cover-orbit cover-orbit-a" />
                  <div className="cover-orbit cover-orbit-b" />
                  <div className="cover-number">
                    {String(project.order).padStart(2, "0")}
                  </div>
                  <div className="cover-label">
                    <span>PROJECT</span>
                    <strong>{project.category}</strong>
                  </div>
                </div>

                {isActive ? (
                  <Link
                    className="card-hit-area"
                    href={`/projects/${project.slug}`}
                    aria-label={`查看 ${project.title} 详情`}
                  >
                    <span>OPEN PROJECT</span>
                  </Link>
                ) : (
                  <button
                    className="card-hit-area"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`切换到 ${project.title}`}
                    tabIndex={isVisible ? 0 : -1}
                  >
                    <span>VIEW</span>
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <div className="stage-controls">
          <button onClick={() => go(-1)} aria-label="上一个项目">
            ←
          </button>
          <div className="project-progress" aria-label="项目进度">
            {visibleProjects.map((project, index) => (
              <button
                className={index === activeIndex ? "is-active" : ""}
                key={project.slug}
                onClick={() => setActiveIndex(index)}
                aria-label={`跳转到 ${project.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
          <button onClick={() => go(1)} aria-label="下一个项目">
            →
          </button>
        </div>

        <div className="scroll-cue" aria-hidden="true">
          <span>SCROLL / SWIPE</span>
          <i />
        </div>
      </section>

      {overlay === "index" && (
        <div className="overlay-panel" role="dialog" aria-modal="true" aria-label="项目索引">
          <div className="overlay-heading">
            <div>
              <span className="overlay-kicker">ALL WORKS</span>
              <h2>项目索引</h2>
            </div>
            <button className="close-button" onClick={() => setOverlay(null)}>
              CLOSE ×
            </button>
          </div>
          <div className="index-grid">
            {projects.map((project) => (
              <button key={project.slug} onClick={() => selectProject(project)}>
                <span className="index-number">
                  {String(project.order).padStart(2, "0")}
                </span>
                <span
                  className="index-thumbnail"
                  style={
                    {
                      "--card-accent": project.accent,
                      "--card-accent-secondary": project.accentSecondary,
                    } as CSSProperties
                  }
                />
                <strong>{project.title}</strong>
                <small>{project.category}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {overlay === "filter" && (
        <div className="overlay-panel filter-panel" role="dialog" aria-modal="true" aria-label="项目筛选">
          <div className="overlay-heading">
            <div>
              <span className="overlay-kicker">FILTER WORKS</span>
              <h2>按项目类型浏览</h2>
            </div>
            <button className="close-button" onClick={() => setOverlay(null)}>
              CLOSE ×
            </button>
          </div>
          <div className="filter-options">
            {categories.map((item) => {
              const count =
                item === "全部"
                  ? projects.length
                  : projects.filter((project) => project.category === item).length;
              return (
                <button
                  key={item}
                  className={item === category ? "is-active" : ""}
                  onClick={() => {
                    setCategory(item);
                    setActiveIndex(0);
                    setOverlay(null);
                  }}
                >
                  <span>{item}</span>
                  <small>{String(count).padStart(2, "0")}</small>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
