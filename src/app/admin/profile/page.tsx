
"use client"; // Added "use client" for useRouter and logoutAction client-side call

import Link from 'next/link';
// Removed direct clientPromise import as data fetching is not direct here anymore
// import clientPromise from '@/lib/mongodb';
// import type { MongoClient, ObjectId, Document } from 'mongodb';
import { Button } from '@/components/ui/button';
import SectionContainer from '@/components/section-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Home, ImageUp, ListChecks, FileText, UserCog, LogOut, KeyRound } from 'lucide-react'; 
import UpdateProfileImageForm from './_components/update-profile-image-form';
import ManageSkillsSection from './_components/manage-skills-section';
import UpdateCVForm from './_components/update-cv-form'; 
import UpdateAdminCredentialsForm from './_components/update-admin-credentials-form'; // New import
import type { SkillData, ProfileDataType } from '@/app/page'; 
import { logoutAction } from "./actions"; // Import logoutAction
import { useRouter } from "next/navigation"; // Import useRouter
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useEffect, useState } from 'react'; // Import useEffect and useState for client-side data

// Data fetching should ideally be done via props or a client-side fetch if page is client component
// For this example, we'll assume skills and profileData are passed as props or fetched client-side

interface AdminProfilePageProps {
  // These would typically be passed as props after server-side fetching in a real scenario
  // For now, we'll fetch them client-side or use placeholders
}

// Dummy function to simulate fetching skills - replace with actual data fetching
async function getSkillsClientSide(): Promise<SkillData[]> {
  // In a real app, this would be an API call or passed via props from a server component
  // For now, returning a default or assuming it's passed, or even fetching from an API endpoint
  // This function is illustrative if we were to fetch client-side
  // For now, we'll manage skills state locally within ManageSkillsSection.
  return []; 
}

async function getCurrentHeroImageUrlClientSide(): Promise<string> {
    return "/profile.png"; 
}


export default function AdminProfilePage({}: AdminProfilePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [initialHeroImageUrl, setInitialHeroImageUrl] = useState("/profile.png");
  const currentCvUrl = "/download/Wahyu_Pratomo-cv.pdf"; // This can remain static if updated by server action


  // Example: Fetch skills client-side (or manage state passed from server component)
  useEffect(() => {
    // This is where you might fetch initial skills if not passed as props
    // For simplicity, ManageSkillsSection now handles its own state based on initial props
    // If you need to re-fetch skills globally for this page, do it here.
    // getSkillsClientSide().then(setSkills); 
    // getCurrentHeroImageUrlClientSide().then(setInitialHeroImageUrl);
    // For now, initialSkills for ManageSkillsSection will be handled by its props
    // And initialHeroImageUrl is set statically or could be fetched
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
    <SectionContainer id="admin-profile" className="bg-background min-h-screen pt-24 md:pt-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <h1 className="section-title mb-4 sm:mb-0">Pengaturan Admin</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/projects">
              <ListChecks className="mr-2 h-4 w-4" />
              Kelola Proyek
            </Link>
          </Button>
           <Button asChild variant="outline">
            <Link href="/admin/add-project">
              <ListChecks className="mr-2 h-4 w-4" />
              Tambah Proyek
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <ImageUp className="mr-2 h-5 w-5" />
              Ganti Foto Profil
            </CardTitle>
            <CardDescription>Unggah foto profil baru. Foto di halaman utama dan "Tentang Saya" akan diganti.</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateProfileImageForm currentImageUrl={initialHeroImageUrl} />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <UserCog className="mr-2 h-5 w-5" />
              Kelola Keahlian Utama
            </CardTitle>
            <CardDescription>Tambah atau hapus keahlian yang ditampilkan di halaman utama.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pass an empty array or fetched skills if available. 
                ManageSkillsSection handles fetching its initial state if this page becomes a server component
                or if initialSkills are passed as props.
            */}
            <ManageSkillsSection initialSkills={skills} />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg"> 
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <FileText className="mr-2 h-5 w-5" />
              Ganti File CV
            </CardTitle>
            <CardDescription>Unggah file CV baru dalam format PDF. File saat ini akan diganti.</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateCVForm currentCvUrl={currentCvUrl} />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
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
