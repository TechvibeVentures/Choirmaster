import ProjectDetailView from "@/components/ProjectDetailView";
import { projects } from "@/lib/mockData";

const getCurrentProjectId = () => {
  const today = new Date();
  const sorted = [...projects].sort(
    (a, b) =>
      new Date(`${a.date_range.start}T00:00:00`).getTime() -
      new Date(`${b.date_range.start}T00:00:00`).getTime()
  );

  const active = sorted.find(
    (project) => new Date(`${project.date_range.end}T00:00:00`) >= today
  );

  return active?.id ?? sorted[0]?.id ?? "";
};

export default function ProjectsPage() {
  const projectId = getCurrentProjectId();

  if (!projectId) {
    return null;
  }

  return <ProjectDetailView projectId={projectId} />;
}
