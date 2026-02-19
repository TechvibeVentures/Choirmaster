import ProjectDetailView from "@/components/ProjectDetailView";

export default function ProjectDetailPage({
  params
}: {
  params: { projectId: string };
}) {
  return <ProjectDetailView projectId={params.projectId} />;
}
