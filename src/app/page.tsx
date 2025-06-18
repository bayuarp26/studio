
import PortfolioContent from '@/app/portfolio-content';
import clientPromise from '@/lib/mongodb';
import type { MongoClient, ObjectId, Collection } from 'mongodb';

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

interface SkillDocument {
  _id: ObjectId;
  name: string;
}

// Interface untuk dokumen pengguna admin dari database
interface AdminUserDocument {
  _id: ObjectId;
  username: string;
  // Tambahkan field lain jika ada, misal nama lengkap, judul, dll.
  profileImageUri?: string; // Menyimpan Data URI gambar profil
}


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

export interface SkillData {
  _id: string;
  name: string;
}

export interface PortfolioDataType { // Diganti dari ProfileDataType
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

async function getAdminUserData(): Promise<Partial<AdminUserDocument>> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const adminUsersCollection: Collection<AdminUserDocument> = db.collection("admin_users");
    const adminUser = await adminUsersCollection.findOne({}); // Ambil dokumen admin pertama
    if (adminUser) {
      return {
        username: adminUser.username,
        profileImageUri: adminUser.profileImageUri,
      };
    }
    return {};
  } catch (e) {
    console.error("Failed to fetch admin user data:", e);
    return {};
  }
}


export default async function PortfolioPage() {
  const fetchedProjects = await getProjects();
  const fetchedSkills = await getSkills();
  const adminUserData = await getAdminUserData();

  const heroPlaceholder = "https://placehold.co/240x240.png";
  const aboutPlaceholder = "https://placehold.co/320x400.png";

  const portfolioData: PortfolioDataType = {
    name: "Wahyu Pratomo", // Bisa juga diambil dari adminUserData.username atau field lain jika ada
    title: "Spesialis Media Sosial | Digital Marketing Expert | Strategi dan Kinerja Pemasaran",
    heroTagline: "Membantu merek berkembang di dunia digital dengan strategi yang data-driven dan konten yang menarik.",
    heroImageUrl: (adminUserData.profileImageUri && adminUserData.profileImageUri.startsWith('data:image/')) 
                    ? adminUserData.profileImageUri 
                    : heroPlaceholder,
    heroImageHint: "profile portrait", // Tetap statis atau bisa ditambahkan ke DB
    socialLinks: {
      github: "https://github.com/bayuarp26/",
      linkedin: "https://linkedin.com/in/wahyupratomo26",
    },
    cvUrl: "/download/Wahyu_Pratomo-cv.pdf", // Tetap statis
    about: {
      imageUrl: (adminUserData.profileImageUri && adminUserData.profileImageUri.startsWith('data:image/')) 
                  ? adminUserData.profileImageUri // Menggunakan gambar profil yang sama untuk bagian about
                  : aboutPlaceholder, 
      imageHint: "professional activity", // Tetap statis atau bisa ditambahkan ke DB
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
    copyrightYear: 2025
  };

  return <PortfolioContent portfolioData={portfolioData} />;
}
