
import PortfolioContent from '@/app/portfolio-content';
import clientPromise from '@/lib/mongodb';
import type { MongoClient, ObjectId, Collection, Document } from 'mongodb';
import UnderConstructionView from '@/app/under-construction-view';

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
interface ProfileSettingsDocument extends Document {
  _id?: ObjectId;
  profileImageUri?: string;
  cvDataUri?: string; 
  isAppUnderConstruction?: boolean; // Ditambahkan field ini
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

// Fungsi untuk mengambil data pengaturan profil (termasuk gambar profil, CV, dan status "under construction")
async function getProfileSettingsData(): Promise<{
  profileImageUri?: string;
  cvDataUri?: string;
  isAppUnderConstruction?: boolean;
}> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");
    const settings = await profileSettingsCollection.findOne({});

    if (settings) {
      return {
        profileImageUri: settings.profileImageUri,
        cvDataUri: settings.cvDataUri,
        isAppUnderConstruction: settings.isAppUnderConstruction ?? false, // Default ke false jika field tidak ada
      };
    }
    return { isAppUnderConstruction: false }; // Default jika dokumen settings tidak ada
  } catch (e) {
    console.error("Failed to fetch profile settings data:", e);
    return { isAppUnderConstruction: false }; // Default jika terjadi error
  }
}


export default async function PortfolioPage() {
  // Mengambil semua data yang diperlukan, termasuk status "under construction"
  const [
    fetchedProjects, 
    fetchedSkills, 
    profileSettings
  ] = await Promise.all([
    getProjects(),
    getSkills(),
    getProfileSettingsData() // Fungsi ini sekarang juga mengembalikan isAppUnderConstruction
  ]);

  // Jika mode "under construction" aktif, tampilkan halaman khusus
  if (profileSettings.isAppUnderConstruction) {
    return <UnderConstructionView />;
  }

  // Jika tidak, lanjutkan menampilkan konten portofolio
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

