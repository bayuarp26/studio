
"use client"; // Added "use client" for useRouter and logoutAction client-side call

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DeleteProjectButton from '@/components/delete-project-button';
import SectionContainer from '@/components/section-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, UserCog, Home, LogOut } from 'lucide-react'; 
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { logoutAction } from "../profile/actions"; // Assuming logoutAction is in profile/actions
import { useEffect, useState } from 'react'; // For client-side state

interface ProjectData {
  _id: string;
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
  createdAt?: Date; 
}

// This function would ideally fetch data from an API endpoint protected by auth
// Or, if this page were a Server Component, data could be fetched server-side
// and passed as props. For a client component as it is now, API fetch is better.
async function getAdminProjectsClientSide(): Promise<ProjectData[]> {
  // Placeholder: Replace with actual API call to fetch projects
  // For example:
  // const response = await fetch('/api/admin/projects');
  // if (!response.ok) {
  //   console.error("Failed to fetch projects for admin");
  //   return [];
  // }
  // const projects = await response.json();
  // return projects.map((p: any) => ({ ...p, createdAt: p.createdAt ? new Date(p.createdAt) : undefined }));
  console.warn("getAdminProjectsClientSide is a placeholder. Implement actual data fetching.");
  return []; // Return empty array for now
}


export default function ManageProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching projects. Replace with actual fetch logic.
    // This is a temporary measure. Ideally, use Server Components or API routes for data.
    const fetchProjects = async () => {
        setIsLoading(true);
        // Simulating API call. In a real app, you'd fetch from an API endpoint.
        // For now, if you have a MongoDB direct fetch function that works on client (not recommended for production),
        // you could call it here, but it's better to build an API.
        // For example:
        // const fetchedProjects = await someClientSideFetchableGetProjectsFunction(); 
        // setProjects(fetchedProjects);
        // Since direct DB access from client is not set up, we'll keep it empty.
        // You need to set up an API route (e.g., /api/admin/projects) to get projects.
        // This would be called from here using fetch().
        console.log("TODO: Implement API fetch for projects in ManageProjectsPage");
        setProjects([]); // Default to empty or show a message
        setIsLoading(false);
    };
    fetchProjects();
  }, []);


  const handleLogout = async () => {
    const result = await logoutAction();
    if (result.success) {
      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil logout.",
      });
      router.push("/login");
    } else {
       toast({
        variant: "destructive",
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat logout.",
      });
    }
  };


  return (
    <SectionContainer id="manage-projects-admin" className="bg-background min-h-screen pt-24 md:pt-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <h1 className="section-title mb-4 sm:mb-0">Kelola Proyek</h1>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            <Button asChild size="lg">
              <Link href="/admin/add-project">
                <PlusCircle className="mr-2 h-5 w-5" />
                Tambah Proyek Baru
              </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/admin/profile">
                    <UserCog className="mr-2 h-4 w-4" />
                    Pengaturan Profil
                </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Halaman Utama
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
        </div>
      </div>
      
      {isLoading ? (
         <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">Memuat proyek...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">Belum ada proyek yang ditambahkan atau gagal memuat.</p>
          <p className="text-muted-foreground mt-2">Mulai dengan menambahkan proyek baru atau periksa konsol untuk error.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project._id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    data-ai-hint={project.imageHint}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg lg:text-xl mb-1 text-primary line-clamp-2">{project.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-3 mb-2">
                  {project.description}
                </CardDescription>
                <div className="flex flex-wrap gap-1 mb-1">
                    {project.tags.slice(0, 4).map((tag, index) => ( 
                       <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                    ))}
                    {project.tags.length > 4 && <Badge variant="outline" className="text-xs px-1.5 py-0.5">+{project.tags.length - 4}</Badge>}
                </div>
                 {project.createdAt && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Dibuat: {new Date(project.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </CardContent>
              <CardFooter className="p-3 border-t bg-muted/30 flex justify-end space-x-2">
                <DeleteProjectButton projectId={project._id} projectTitle={project.title} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
