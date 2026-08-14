"use client";

import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Project } from "../data/projects";
import { FluidIntro } from "./FluidIntro";

type Overlay = "index" | "filter" | null;

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

const mix = (start: number, end: number, amount: number) =>
  start + (end - start) * amount;

export function ProjectExplorer({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [category, setCategory] = useState("全部");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const transitionRef = useRef<HTMLElement>(null);
  const navigationLocked = useRef(false);

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

  const openProject = () => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    transitionRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOverlay(null);
        return;
      }
      if (overlay) return;
      if (["ArrowRight", "PageDown"].includes(event.key)) {
        event.preventDefault();
        go(1);
      }
      if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        go(-1);
      }
      if (event.key === "Enter" && document.activeElement === document.body) {
        openProject();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    const updateViewport = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    const frame = requestAnimationFrame(updateViewport);
    window.addEventListener("resize", updateViewport);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateTransition = () => {
      const element = transitionRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const travel = Math.max(1, element.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      setTransitionProgress(progress);

      if (
        progress >= 0.985 &&
        !navigationLocked.current &&
        !overlay
      ) {
        navigationLocked.current = true;
        router.push(`/projects/${activeProject.slug}`);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateTransition);
    };

    frame = requestAnimationFrame(updateTransition);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [activeProject.slug, overlay, router]);

  const selectProject = (project: Project) => {
    setCategory("全部");
    setActiveIndex(project.order - 1);
    navigationLocked.current = false;
    setOverlay(null);
  };

  const easedProgress = 1 - Math.pow(1 - transitionProgress, 3);
  const mobile = viewport.width <= 720;
  const tablet = viewport.width <= 1050;
  const startWidth = mobile
    ? viewport.width - 36
    : Math.min(viewport.width * (tablet ? 0.76 : 0.58), 980);
  const startHeight = startWidth * (9 / 16);
  const cardWidth = mix(startWidth, viewport.width, easedProgress);
  const cardHeight = mix(startHeight, viewport.height, easedProgress);
  const cardLeft = mix(
    viewport.width * (mobile ? 0.5 : tablet ? 0.57 : 0.68),
    viewport.width * 0.5,
    easedProgress,
  );
  const cardTop = mix(
    viewport.height * (mobile ? 0.4 : tablet ? 0.42 : 0.5),
    viewport.height * 0.5,
    easedProgress,
  );
  const transitionStyle = {
    "--card-accent": activeProject.accent,
    "--card-accent-secondary": activeProject.accentSecondary,
    "--transition-progress": transitionProgress,
    width: `${cardWidth}px`,
    height: `${cardHeight}px`,
    left: `${cardLeft}px`,
    top: `${cardTop}px`,
    borderRadius: `${mix(mobile ? 10 : 16, 0, easedProgress)}px`,
    viewTransitionName: `project-${activeProject.slug}`,
  } as CSSProperties;

  const themeStyle = {
    "--active-accent": activeProject.accent,
    "--active-accent-secondary": activeProject.accentSecondary,
  } as CSSProperties;

  return (
    <main className="portfolio-experience" style={themeStyle}>
      <FluidIntro />

      <section id="works" className="portfolio-shell" aria-label="作品一览">
        <header className="site-header">
          <a className="wordmark" href="#top" aria-label="返回 Phyrex 开场">
            <span>PHYREX</span>
            <span>WORKS</span>
          </a>

          <div className="header-meta" aria-hidden="true">
            <span>SELECTED WORKS</span>
            <span>12 PROJECTS</span>
          </div>

          <nav className="header-actions" aria-label="作品浏览工具">
            <button onClick={() => setOverlay("index")}>INDEX</button>
            <button onClick={() => setOverlay("filter")}>FILTER</button>
          </nav>
        </header>

        <section
          className="project-stage"
          aria-label="项目空间画廊"
          onTouchStart={(event) => {
            touchStart.current = {
              x: event.touches[0].clientX,
              y: event.touches[0].clientY,
            };
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            if (!start || overlay) return;
            const deltaX = start.x - event.changedTouches[0].clientX;
            const deltaY = start.y - event.changedTouches[0].clientY;
            if (Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY)) {
              go(deltaX > 0 ? 1 : -1);
            }
            touchStart.current = null;
          }}
        >
          <div className="ambient-grid" aria-hidden="true" />
          <div className="ambient-glow" aria-hidden="true" />

          <div className="works-section-label" aria-hidden="true">
            <span>02</span>
            <span>WORKS / ARCHIVE</span>
          </div>

          <div className="project-copy" aria-live="polite">
            <div className="eyebrow-row">
              <span>{String(activeProject.order).padStart(2, "0")}</span>
              <span>{activeProject.type}</span>
            </div>
            <h2>{activeProject.title}</h2>

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

                  <button
                    className="card-hit-area"
                    onClick={() => (isActive ? openProject() : setActiveIndex(index))}
                    aria-label={
                      isActive
                        ? `滚动展开并查看 ${project.title}`
                        : `切换到 ${project.title}`
                    }
                    tabIndex={isVisible ? 0 : -1}
                  >
                    <span>{isActive ? "EXPAND PROJECT" : "VIEW"}</span>
                  </button>
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

          <button className="scroll-cue scroll-cue-button" onClick={openProject}>
            <span>SCROLL TO EXPAND</span>
            <i />
          </button>
        </section>
      </section>

      <section
        ref={transitionRef}
        className="project-expansion-track"
        aria-label={`进入 ${activeProject.title}`}
      >
        <div className="project-expansion-sticky">
          <div className="expansion-backdrop" aria-hidden="true" />
          <div className="expansion-copy" aria-hidden="true">
            <span>{String(activeProject.order).padStart(2, "0")} / 12</span>
            <strong>{activeProject.title}</strong>
            <small>SCROLLING INTO PROJECT</small>
          </div>

          <div className="expansion-card" style={transitionStyle}>
            <div className="project-card-visual">
              <div className="cover-grid" />
              <div className="cover-orbit cover-orbit-a" />
              <div className="cover-orbit cover-orbit-b" />
              <div className="cover-number">
                {String(activeProject.order).padStart(2, "0")}
              </div>
              <div className="expansion-card-title">
                <span>{activeProject.category}</span>
                <strong>{activeProject.title}</strong>
              </div>
            </div>
          </div>

          <div className="expansion-progress" aria-hidden="true">
            <span style={{ width: `${transitionProgress * 100}%` }} />
          </div>
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
                    navigationLocked.current = false;
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
