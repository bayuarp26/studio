
import { getAdminProfileInitialData } from "./actions";
import type { AdminProfileInitialData } from "./actions";
import AdminProfileClientContent from "./_components/admin-profile-client-content";

export default async function AdminProfilePage() {
  const result = await getAdminProfileInitialData();

  let initialData: AdminProfileInitialData | null = null;
  let serverError: string | null = null;

  if (result.success && result.data) {
    initialData = result.data;
  } else {
    console.error("Failed to load admin profile initial data:", result.error);
    serverError = result.error || "Gagal memuat data profil dari server.";
  }

  return <AdminProfileClientContent initialData={initialData} serverError={serverError} />;
}
