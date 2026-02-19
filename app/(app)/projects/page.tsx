"use client";

import ProjectDetailView from "@/components/ProjectDetailView";
import { useAppData } from "@/hooks/useAppData";

export default function ProjectsPage() {
  const { getCurrentProject } = useAppData();
  const projectId = getCurrentProject()?.id || "";

  if (!projectId) {
    return null;
  }

  return <ProjectDetailView projectId={projectId} />;
}
