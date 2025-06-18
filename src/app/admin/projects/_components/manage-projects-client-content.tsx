
"use client"; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DeleteProjectButton from '@/components/delete-project-button';
import SectionContainer from '@/components/section-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, UserCog, Home, LogOut, ListOrdered } from 'lucide-react'; // Menggunakan ListOrdered
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { logoutAction } from "../../profile/actions"; 
import type { ProjectDataForAdmin as ProjectData } from "../actions"; 
import { useEffect, useState } from 'react';

interface ManageProjectsClientContentProps {
  initialProjects: ProjectData[];
  serverError: string | null;
}

export default function ManageProjectsClientContent({ initialProjects, serverError }: ManageProjectsClientContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);

  useEffect(() => {
    setProjects(initialProjects); 
  }, [initialProjects]);

  useEffect(() => {
    if (serverError) {
      toast({
        variant: "destructive",
        title: "Gagal Memuat Proyek",
        description: serverError,
      });
    }
  }, [serverError, toast]); 


  const handleLogout = async () => {
    const result = await logoutAction();
    if (result.success) {
      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil logout.",
      });
      router.push("/login");
      // router.refresh(); // Dihapus, router.push sudah cukup
    } else {
       toast({
        variant: "destructive",
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat logout.",
      });
    }
  };
  
  const projectsToDisplay = projects || [];


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
      
      {serverError && projectsToDisplay.length === 0 ? (
         <div className="text-center py-10">
          <p className="text-xl text-destructive">Gagal memuat proyek.</p>
          <p className="text-muted-foreground mt-2">{serverError}</p>
           <Button onClick={() => router.refresh()} className="mt-4">Coba Lagi</Button>
        </div>
      ) : !serverError && projectsToDisplay.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">Belum ada proyek yang ditambahkan.</p>
          <p className="text-muted-foreground mt-2">Mulai dengan menambahkan proyek baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsToDisplay.map((project) => (
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
