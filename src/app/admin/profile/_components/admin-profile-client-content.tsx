
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SectionContainer from '@/components/section-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ImageUp, ListChecks, FileText, UserCog, LogOut, KeyRound, PlusCircle, ListOrdered } from 'lucide-react';
import UpdateProfileImageForm from './update-profile-image-form';
import ManageSkillsSection from './manage-skills-section';
import UpdateCVForm from './update-cv-form';
import UpdateAdminCredentialsForm from './update-admin-credentials-form';
import type { SkillData } from '@/app/page';
import { logoutAction } from "../actions";
import type { AdminProfileInitialData as AdminProfilePageData } from "../actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';

interface AdminProfileClientContentProps {
  initialData: AdminProfilePageData | null;
  serverError: string | null;
}

export default function AdminProfileClientContent({ initialData, serverError }: AdminProfileClientContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<AdminProfilePageData | null>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (serverError) {
      toast({
        variant: "destructive",
        title: "Gagal Memuat Data Awal",
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
    } else {
       toast({
        variant: "destructive",
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat logout.",
      });
    }
  };

  if (!data && !serverError) {
    return (
      <SectionContainer id="admin-profile-loading" className="bg-background min-h-screen pt-24 md:pt-32 flex justify-center items-center">
        <p className="text-xl text-muted-foreground">Memuat data profil admin...</p>
      </SectionContainer>
    );
  }

  if (!data && serverError) {
     return (
      <SectionContainer id="admin-profile-error" className="bg-background min-h-screen pt-24 md:pt-32 flex flex-col justify-center items-center">
        <p className="text-xl text-destructive mb-4">Gagal memuat data profil.</p>
        <p className="text-muted-foreground mb-4">{serverError}</p>
        <Button onClick={() => router.refresh()}>Coba Lagi</Button>
      </SectionContainer>
    );
  }

  if (!data) {
     return (
      <SectionContainer id="admin-profile-error" className="bg-background min-h-screen pt-24 md:pt-32 flex flex-col justify-center items-center">
        <p className="text-xl text-destructive mb-4">Data profil tidak tersedia.</p>
         <Button onClick={() => router.refresh()}>Coba Lagi</Button>
      </SectionContainer>
    );
  }


  return (
    <SectionContainer id="admin-profile" className="bg-background min-h-screen pt-24 md:pt-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <h1 className="section-title mb-4 sm:mb-0">Pengaturan Admin</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/add-project">
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Proyek
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/projects">
              <ListOrdered className="mr-2 h-4 w-4" />
              Kelola Proyek
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg transition-all duration-200 ease-out hover:shadow-inner hover:brightness-95">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <ImageUp className="mr-2 h-5 w-5" />
              Ganti Foto Profil
            </CardTitle>
            <CardDescription>Unggah foto profil baru. Foto di halaman utama dan "Tentang Saya" akan diganti.</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateProfileImageForm currentImageUrl={data.currentHeroImageUrl} />
          </CardContent>
        </Card>

        <Card className="shadow-lg transition-all duration-200 ease-out hover:shadow-inner hover:brightness-95">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <UserCog className="mr-2 h-5 w-5" />
              Kelola Keahlian Utama
            </CardTitle>
            <CardDescription>Tambah atau hapus keahlian yang ditampilkan di halaman utama.</CardDescription>
          </CardHeader>
          <CardContent>
            <ManageSkillsSection initialSkills={data.skills} />
          </CardContent>
        </Card>

        <Card className="shadow-lg transition-all duration-200 ease-out hover:shadow-inner hover:brightness-95">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <FileText className="mr-2 h-5 w-5" />
              Ganti File CV
            </CardTitle>
            <CardDescription>Unggah file CV baru dalam format PDF. File saat ini akan diganti.</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateCVForm currentCvUrl={data.currentCvUrl} />
          </CardContent>
        </Card>

        <Card className="shadow-lg transition-all duration-200 ease-out hover:shadow-inner hover:brightness-95">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <KeyRound className="mr-2 h-5 w-5" />
              Ubah Kredensial Admin
            </CardTitle>
            <CardDescription>Ganti username atau password untuk login admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateAdminCredentialsForm />
          </CardContent>
        </Card>
      </div>
    </SectionContainer>
  );
}
