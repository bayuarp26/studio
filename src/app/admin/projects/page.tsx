
import { getAdminProjectsAction } from "./actions";
import type { ProjectDataForAdmin as ProjectData } from "./actions";
import ManageProjectsClientContent from "./_components/manage-projects-client-content";

export default async function ManageProjectsPage() {
  const result = await getAdminProjectsAction();
  
  let projects: ProjectData[] = [];
  let serverError: string | null = null;

  if (result.success && result.projects) {
    projects = result.projects;
  } else {
    console.error("Failed to load admin projects:", result.error);
    serverError = result.error || "Gagal memuat proyek dari server.";
  }

  return <ManageProjectsClientContent initialProjects={projects} serverError={serverError} />;
}
