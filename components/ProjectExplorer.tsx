/* eslint-disable @next/next/no-img-element -- Project covers are static local assets, rendered directly for the gallery transition. */
"use client";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [category, setCategory] = useState("全部");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isAutoExpanding, setIsAutoExpanding] = useState(false);
  const [autoExpansionDuration, setAutoExpansionDuration] = useState(850);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const worksRef = useRef<HTMLElement>(null);
  const navigationLocked = useRef(false);
  const expansionAnimation = useRef(0);
  const navigationTimer = useRef(0);

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
    if (transitionProgress > 0.02 || isAutoExpanding) return;
    setActiveIndex((current) => {
      const total = visibleProjects.length;
      return (current + direction + total) % total;
    });
  };

  const enterProject = () => {
    if (navigationLocked.current) return;
    navigationLocked.current = true;
    window.location.assign(`/projects/${activeProject.slug}`);
  };

  const openProject = () => {
    if (isAutoExpanding || navigationLocked.current) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      enterProject();
      return;
    }

    const duration = Math.max(180, 850 * (1 - transitionProgress));
    setAutoExpansionDuration(duration);
    setIsAutoExpanding(true);
    cancelAnimationFrame(expansionAnimation.current);
    window.clearTimeout(navigationTimer.current);
    expansionAnimation.current = requestAnimationFrame(() => {
      setTransitionProgress(1);
      navigationTimer.current = window.setTimeout(enterProject, duration);
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

  useEffect(() => () => {
    cancelAnimationFrame(expansionAnimation.current);
    window.clearTimeout(navigationTimer.current);
  }, []);

  useEffect(() => {
    if (window.location.hash !== "#works") return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    navigationLocked.current = true;
    let unlockFrame = 0;

    const landingFrame = requestAnimationFrame(() => {
      worksRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      setTransitionProgress(0);
      setIsAutoExpanding(false);
      unlockFrame = requestAnimationFrame(() => {
        navigationLocked.current = false;
      });
    });

    return () => {
      cancelAnimationFrame(landingFrame);
      cancelAnimationFrame(unlockFrame);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  const selectProject = (project: Project) => {
    setCategory("全部");
    setActiveIndex(project.order - 1);
    setTransitionProgress(0);
    setIsAutoExpanding(false);
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
  const startLeft = viewport.width * (mobile ? 0.5 : tablet ? 0.57 : 0.68);
  const startTop = viewport.height * (mobile ? 0.4 : tablet ? 0.42 : 0.5);
  const translateX = (viewport.width * 0.5 - startLeft) * easedProgress;
  const translateY = (viewport.height * 0.5 - startTop) * easedProgress;
  const scaleX = mix(1, viewport.width / startWidth, easedProgress);
  const scaleY = mix(1, viewport.height / startHeight, easedProgress);
  const cardsSpaceStyle = {
    "--transition-progress": transitionProgress,
    "--expansion-duration": `${autoExpansionDuration}ms`,
    width: `${startWidth}px`,
    height: `${startHeight}px`,
    left: `${startLeft}px`,
    top: `${startTop}px`,
    transform: `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), 0) scale3d(${scaleX}, ${scaleY}, 1)`,
  } as CSSProperties;

  const interfaceOpacity = clamp(1 - transitionProgress * 2.4);

  const themeStyle = {
    "--active-accent": activeProject.accent,
    "--active-accent-secondary": activeProject.accentSecondary,
  } as CSSProperties;

  return (
    <main className="portfolio-experience" style={themeStyle}>
      <FluidIntro />

      <section
        ref={worksRef}
        id="works"
        className="portfolio-shell"
        aria-label="作品一览"
      >
        <section
          className={`project-stage${isAutoExpanding ? " is-auto-expanding" : ""}`}
          aria-label="项目空间画廊"
          onWheel={(event) => {
            if (overlay) return;
            const delta = event.deltaY;
            if (delta > 0 || transitionProgress > 0) {
              event.preventDefault();
              const next = clamp(transitionProgress + delta / 900);
              setTransitionProgress(next);
              if (next >= 0.985) enterProject();
            }
          }}
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
            } else if (Math.abs(deltaY) > 44) {
              const next = clamp(
                transitionProgress + (deltaY > 0 ? 0.24 : -0.24),
              );
              setTransitionProgress(next);
              if (next >= 0.985) enterProject();
            }
            touchStart.current = null;
          }}
        >
          <header className="site-header" style={{ opacity: interfaceOpacity }}>
            <a className="wordmark" href="#top" aria-label="返回 Phyrex 开场">
              <span>PHYREX</span>
              <span>WORKS</span>
            </a>

            <div className="header-meta" aria-hidden="true">
              <span>SELECTED WORKS</span>
              <span>{projects.length} PROJECTS</span>
            </div>

            <nav className="header-actions" aria-label="作品浏览工具">
              <button onClick={() => setOverlay("index")}>INDEX</button>
              <button onClick={() => setOverlay("filter")}>FILTER</button>
            </nav>
          </header>

          <div
            className="ambient-grid"
            style={{ opacity: 0.55 * interfaceOpacity }}
            aria-hidden="true"
          />
          <div
            className="ambient-glow"
            style={{ opacity: 0.12 * interfaceOpacity }}
            aria-hidden="true"
          />

          <div
            className="works-section-label"
            style={{ opacity: interfaceOpacity }}
            aria-hidden="true"
          >
            <span>02</span>
            <span>WORKS / ARCHIVE</span>
          </div>

          <div
            className="project-copy"
            style={{ opacity: interfaceOpacity }}
            aria-live="polite"
          >
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

          <div
            className="cards-space"
            data-auto-expanding={isAutoExpanding ? "true" : "false"}
            style={cardsSpaceStyle}
            aria-label="项目封面"
          >
            {visibleProjects.map((project, index) => {
              const difference = index - activeIndex;
              const distance = Math.abs(difference);
              const isActive = difference === 0;
              const isVisible = distance <= 2;
              const carouselOpacity = isVisible
                ? Math.max(0.1, 1 - distance * 0.42)
                : 0;
              const cardStyle = {
                "--card-accent": project.accent,
                "--card-accent-secondary": project.accentSecondary,
                transform: `translate3d(${difference * 54}%, ${distance * 2.8}%, ${
                  -distance * 190
                }px) rotateY(${difference * -16}deg) scale(${Math.max(
                  0.64,
                  1 - distance * 0.12,
                )})`,
                opacity: isActive
                  ? 1
                  : carouselOpacity * clamp(1 - transitionProgress * 2.5),
                zIndex: 20 - distance,
                pointerEvents:
                  isVisible && transitionProgress < 0.08 ? "auto" : "none",
                borderRadius: isActive
                  ? `${mix(mobile ? 10 : 16, 0, easedProgress)}px`
                  : undefined,
                viewTransitionName: isActive
                  ? `project-${project.slug}`
                  : "none",
              } as CSSProperties;

              return (
                <article
                  className={`project-card${isActive ? " is-active" : ""}`}
                  key={project.slug}
                  style={cardStyle}
                  aria-hidden={!isVisible}
                >
                  <div className="project-card-visual">
                    {project.coverImage && (
                      <img
                        className="project-cover-image"
                        src={project.coverImage}
                        alt=""
                        aria-hidden="true"
                      />
                    )}
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

          <div className="stage-controls" style={{ opacity: interfaceOpacity }}>
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

          <button
            className="scroll-cue scroll-cue-button"
            style={{ opacity: interfaceOpacity }}
            onClick={openProject}
          >
            <span>SCROLL TO EXPAND</span>
            <i />
          </button>

          <div
            className="expansion-progress"
            style={{ opacity: transitionProgress > 0 ? 1 : 0 }}
            aria-hidden="true"
          >
            <span style={{ width: `${transitionProgress * 100}%` }} />
          </div>
        </section>
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
                      ...(project.coverImage
                        ? {
                            backgroundImage: `linear-gradient(135deg, rgba(5, 6, 10, 0.08), rgba(5, 6, 10, 0.32)), url("${project.coverImage}")`,
                          }
                        : {}),
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
                    setTransitionProgress(0);
                    setIsAutoExpanding(false);
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
