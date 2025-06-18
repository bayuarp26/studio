
import Link from 'next/link';
import clientPromise from '@/lib/mongodb';
import type { MongoClient, ObjectId, Document } from 'mongodb';
import { Button } from '@/components/ui/button';
import SectionContainer from '@/components/section-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Home, ImageUp, ListChecks, FileText, UserCog } from 'lucide-react'; // Added FileText
import UpdateProfileImageForm from './_components/update-profile-image-form';
import ManageSkillsSection from './_components/manage-skills-section';
import UpdateCVForm from './_components/update-cv-form'; // Import new component
import type { SkillData, ProfileDataType } from '@/app/page'; 

async function getSkills(): Promise<SkillData[]> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const skillsCollection = db.collection<{ _id: ObjectId; name: string }>("skills");
    const skills = await skillsCollection.find({}).sort({ name: 1 }).toArray();
    return skills.map(s => ({ _id: s._id.toString(), name: s.name }));
  } catch (e) {
    console.error("Failed to fetch skills for admin profile:", e);
    return [];
  }
}

async function getCurrentHeroImageUrl(): Promise<string> {
    return "/profile.png"; 
}

export default async function AdminProfilePage() {
  const skills = await getSkills();
  const initialHeroImageUrl = await getCurrentHeroImageUrl();
  // The current CV URL is static in page.tsx for this example
  const currentCvUrl = "/download/Wahyu_Pratomo-cv.pdf";


  return (
    <SectionContainer id="admin-profile" className="bg-background min-h-screen pt-24 md:pt-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <h1 className="section-title mb-4 sm:mb-0">Pengaturan Profil & Keahlian</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/projects">
              <ListChecks className="mr-2 h-4 w-4" />
              Kelola Proyek
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Halaman Utama
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="shadow-lg md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <ImageUp className="mr-2 h-5 w-5" />
              Ganti Foto Profil
            </CardTitle>
            <CardDescription>Unggah foto profil baru. Foto saat ini akan diganti di halaman utama.</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateProfileImageForm currentImageUrl={initialHeroImageUrl} />
          </CardContent>
        </Card>

        <Card className="shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <UserCog className="mr-2 h-5 w-5" />
              Kelola Keahlian Utama
            </CardTitle>
            <CardDescription>Tambah atau hapus keahlian yang ditampilkan di halaman utama.</CardDescription>
          </CardHeader>
          <CardContent>
            <ManageSkillsSection initialSkills={skills} />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg md:col-span-3"> {/* CV Card spanning full width on md */}
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
      </div>
    </SectionContainer>
  );
}
