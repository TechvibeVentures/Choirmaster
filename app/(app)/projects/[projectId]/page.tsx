import { redirect } from "next/navigation";

export default function ProjectDetailPage({
  params
}: {
  params: { projectId: string };
}) {
  redirect(`/calendar/${params.projectId}`);
}
