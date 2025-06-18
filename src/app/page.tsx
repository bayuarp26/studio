
import PortfolioContent from '@/app/portfolio-content';
import clientPromise from '@/lib/mongodb';
import type { MongoClient, ObjectId, Collection, Document } from 'mongodb';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/authUtils';

// Interface untuk dokumen proyek dari database
interface ProjectDocument {
  _id: ObjectId;
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
  createdAt: Date;
}

// Interface untuk dokumen keahlian dari database
interface SkillDocument {
  _id: ObjectId;
  name: string;
}

// Interface untuk dokumen pengaturan profil dari database
interface ProfileSettingsDocument {
  _id?: ObjectId;
  profileImageUri?: string;
  cvDataUri?: string; 
}


// Interface untuk data proyek yang akan digunakan di komponen
export interface ProjectData {
  _id: string;
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
  createdAt?: Date;
}

// Interface untuk data keahlian yang akan digunakan di komponen
export interface SkillData {
  _id: string;
  name: string;
}

// Interface utama untuk semua data portofolio yang akan dikirim ke PortfolioContent
export interface PortfolioDataType {
    name: string;
    title: string;
    heroTagline: string;
    heroImageUrl: string;
    heroImageHint: string;
    socialLinks: {
      github: string;
      linkedin: string;
    };
    cvUrl: string; 
    about: {
      imageUrl: string;
      imageHint: string;
      paragraphs: string[];
      education: { institution: string; detail: string }[];
    };
    skills: SkillData[];
    projects: ProjectData[];
    contactEmail: string;
    copyrightYear: number;
}

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

// Fungsi untuk mengambil data proyek dari MongoDB
async function getProjects(): Promise<ProjectData[]> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const projectsCollection = db.collection<ProjectDocument>("projects");
    const projects = await projectsCollection.find({}).sort({ createdAt: -1 }).toArray();
    return projects.map(p => ({
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt,
    }));
  } catch (e) {
    console.error("Failed to fetch projects:", e);
    return [];
  }
}

// Fungsi untuk mengambil data keahlian dari MongoDB
async function getSkills(): Promise<SkillData[]> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const skillsCollection = db.collection<SkillDocument>("skills");
    const skills = await skillsCollection.find({}).sort({ name: 1 }).toArray();
    return skills.map(s => ({ ...s, _id: s._id.toString(), name: s.name }));
  } catch (e) {
    console.error("Failed to fetch skills:", e);
    return [];
  }
}

// Fungsi untuk mengambil data pengaturan profil (termasuk gambar profil dan Data URI CV) dari MongoDB
async function getProfileSettingsData(): Promise<Partial<ProfileSettingsDocument>> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");
    const settings = await profileSettingsCollection.findOne({});

    if (settings) {
      return {
        profileImageUri: settings.profileImageUri,
        cvDataUri: settings.cvDataUri,
      };
    }
    return {};
  } catch (e) {
    console.error("Failed to fetch profile settings data:", e);
    return {};
  }
}


export default async function PortfolioPage() {
  let isAdminLoggedIn = false;
  const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);

  if (tokenCookie && tokenCookie.value) {
    const payload = await verifySessionToken(tokenCookie.value);
    if (payload) {
      isAdminLoggedIn = true;
    }
  }

  if (isAdminLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-primary mb-6">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Sorry, this app is under construction!</h1>
        <p className="text-lg text-muted-foreground mb-8">The main portfolio page is temporarily unavailable now.</p>
        <p className="text-sm text-muted-foreground">
          Please waiting for a view minutes or reload the site.
        </p>
      </div>
    );
  }

  const [fetchedProjects, fetchedSkills, profileSettings] = await Promise.all([
    getProjects(),
    getSkills(),
    getProfileSettingsData()
  ]);

  const heroPlaceholder = "https://placehold.co/240x240.png";
  const aboutPlaceholder = "https://placehold.co/320x400.png";
  
  const profileImageFromDB = (profileSettings.profileImageUri && profileSettings.profileImageUri.startsWith('data:image/'))
                         ? profileSettings.profileImageUri
                         : null;

  const cvDataUriFromDB = (profileSettings.cvDataUri && profileSettings.cvDataUri.startsWith('data:application/pdf;base64,'))
                         ? profileSettings.cvDataUri
                         : ""; 


  const portfolioData: PortfolioDataType = {
    name: "Wahyu Pratomo",
    title: "Spesialis Media Sosial | Digital Marketing Expert | Strategi dan Kinerja Pemasaran",
    heroTagline: "Membantu merek berkembang di dunia digital dengan strategi yang data-driven dan konten yang menarik.",
    heroImageUrl: profileImageFromDB || heroPlaceholder,
    heroImageHint: "profile portrait",
    socialLinks: {
      github: "https://github.com/bayuarp26/",
      linkedin: "https://linkedin.com/in/wahyupratomo26",
    },
    cvUrl: cvDataUriFromDB, 
    about: {
      imageUrl: profileImageFromDB || aboutPlaceholder,
      imageHint: "professional activity",
      paragraphs: [
      "Saya adalah seorang Spesialis Media Sosial dengan fokus pada Pemasaran Digital dan Kinerja Pemasaran.",
      "Memiliki pengalaman selama 9 bulan di industri ini, Saya suka bekerja dengan merek yang memiliki misi dan berkomitmen untuk merepresentasikan produk secara menarik di media sosial."
      ],
      education: [
      { institution: "Sekolah Tinggi Teknologi Indonesia", detail: "Mahasiswa Tingkat Akhir (2020 - 2025)" },
      { institution: "Harisenin.com", detail: "Lulusan Bootcamp Digital Marketing" }
      ]
    },
    skills: fetchedSkills,
    projects: fetchedProjects,
    contactEmail: "wahyupratomo187@gmail.com",
    copyrightYear: new Date().getFullYear()
  };

  return <PortfolioContent portfolioData={portfolioData} />;
}
