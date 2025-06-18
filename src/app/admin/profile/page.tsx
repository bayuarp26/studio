
import Link from 'next/link';
import clientPromise from '@/lib/mongodb';
import type { MongoClient, ObjectId, Document } from 'mongodb';
import { Button } from '@/components/ui/button';
import SectionContainer from '@/components/section-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Home, ImageUp, ListChecks, Trash2, UserCog } from 'lucide-react';
import UpdateProfileImageForm from './_components/update-profile-image-form';
import ManageSkillsSection from './_components/manage-skills-section';
import type { SkillData, ProfileDataType } from '@/app/page'; // Import from page.tsx

// Duplicating getSkills here for simplicity, or it could be moved to a shared lib
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

// This function will simulate fetching the current heroImageUrl
// In a real scenario with DB-driven profile, this would fetch from DB
// For now, we assume src/app/page.tsx is the source of truth and changes apply there
async function getCurrentHeroImageUrl(): Promise<string> {
    // This is a simplified way to get it. In a real app, this might be structured differently
    // or read directly if page.tsx wasn't modified at runtime this way.
    // For the purpose of this example, we'll assume it's a known static or placeholder.
    // The actual update happens by modifying page.tsx via an action.
    // Let's return the default one defined in page.tsx as a fallback.
    // The admin page will show this, and if updated, page.tsx changes, and a page refresh will show the new one.
    return "/profile.png"; // This is the default one from current page.tsx
}


export default async function AdminProfilePage() {
  const skills = await getSkills();
  // For heroImageUrl, the action directly modifies page.tsx.
  // Displaying the *truly* current one is tricky without reading page.tsx here,
  // which isn't typical for a page component. The UpdateProfileImageForm
  // will handle previewing the newly uploaded image.
  // The image displayed initially could be the one from public for simplicity.
  const initialHeroImageUrl = await getCurrentHeroImageUrl();


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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
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

        <Card className="shadow-lg">
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
      </div>
    </SectionContainer>
  );
}
