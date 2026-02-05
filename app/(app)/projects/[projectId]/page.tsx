import { notFound } from "next/navigation";
import ProjectDetailView from "@/components/ProjectDetailView";
import { projects } from "@/lib/mockData";

export default function ProjectDetailPage({
  params
}: {
  params: { projectId: string };
}) {
  const project = projects.find((item) => item.id === params.projectId);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView projectId={project.id} />;
}
