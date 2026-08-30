/// <reference types="vite/client" />
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { ProjectExplorer } from "../components/ProjectExplorer";
import {
  getAdjacentProjects,
  getProject,
  projects,
} from "../data/projects";
import { ProjectDetail } from "./ProjectDetail";

const basePath = import.meta.env.BASE_URL;
const normalizedBase = basePath.replace(/^\/+|\/+$/g, "");
const pathParts = window.location.pathname.split("/").filter(Boolean);
const relativeParts = normalizedBase && pathParts[0] === normalizedBase
  ? pathParts.slice(1)
  : pathParts;
const projectSlug = relativeParts[0] === "projects" ? relativeParts[1] : undefined;
const project = projectSlug ? getProject(projectSlug) : undefined;

if (project) {
  document.title = `${project.title} — AIGC Works`;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  description?.setAttribute("content", project.description);
}

const content = project ? (
  <ProjectDetail
    project={project}
    projects={projects}
    {...getAdjacentProjects(project.slug)}
    basePath={basePath}
  />
) : (
  <ProjectExplorer projects={projects} basePath={basePath} />
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{content}</StrictMode>,
);
