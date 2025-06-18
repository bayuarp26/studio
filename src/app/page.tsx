
import PortfolioContent from '@/app/portfolio-content';
import clientPromise from '@/lib/mongodb';
import type { MongoClient, ObjectId, Collection, Document } from 'mongodb';

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
// Ini akan digunakan untuk mengambil profileImageUri dari koleksi 'profile_settings'
interface ProfileSettingsDocument {
  _id?: ObjectId; // ID bisa kita buat unik atau biarkan MongoDB yang generate
  profileImageUri?: string; // Menyimpan Data URI dari gambar profil
  // Tambahkan field lain untuk pengaturan profil di sini jika perlu
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
    heroImageUrl: string; // URL atau Data URI gambar untuk Hero Section
    heroImageHint: string;
    socialLinks: {
      github: string;
      linkedin: string;
    };
    cvUrl: string;
    about: {
      imageUrl: string; // URL atau Data URI gambar untuk About Section
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
    // Menggunakan database default yang dikonfigurasi di MONGODB_URI (misal: portofolioDB)
    const db = client.db();
    // Koleksi 'projects' akan berada di dalam database default tersebut
    const projectsCollection = db.collection<ProjectDocument>("projects");
    const projects = await projectsCollection.find({}).sort({ createdAt: -1 }).toArray();
    return projects.map(p => ({
      ...p,
      _id: p._id.toString(), // Konversi ObjectId ke string
      createdAt: p.createdAt,
    }));
  } catch (e) {
    console.error("Failed to fetch projects:", e);
    return []; // Kembalikan array kosong jika terjadi error
  }
}

// Fungsi untuk mengambil data keahlian dari MongoDB
async function getSkills(): Promise<SkillData[]> {
  try {
    const client: MongoClient = await clientPromise;
    // Menggunakan database default yang dikonfigurasi di MONGODB_URI
    const db = client.db();
    // Koleksi 'skills' akan berada di dalam database default tersebut
    const skillsCollection = db.collection<SkillDocument>("skills");
    const skills = await skillsCollection.find({}).sort({ name: 1 }).toArray();
    return skills.map(s => ({ ...s, _id: s._id.toString(), name: s.name })); // Konversi ObjectId
  } catch (e) {
    console.error("Failed to fetch skills:", e);
    return []; // Kembalikan array kosong jika terjadi error
  }
}

// Fungsi untuk mengambil data pengaturan profil (termasuk gambar profil) dari MongoDB
async function getProfileSettingsData(): Promise<Partial<ProfileSettingsDocument>> {
  try {
    const client: MongoClient = await clientPromise;
    // Menggunakan database default yang dikonfigurasi di MONGODB_URI
    const db = client.db();
    // Koleksi 'profile_settings' akan berada di dalam database default tersebut
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");
    const settings = await profileSettingsCollection.findOne({}); // Ambil satu dokumen pengaturan (jika ada)
    
    if (settings) {
      return {
        profileImageUri: settings.profileImageUri,
      };
    }
    return {}; // Kembalikan objek kosong jika tidak ada pengaturan
  } catch (e) {
    console.error("Failed to fetch profile settings data:", e);
    return {}; // Kembalikan objek kosong jika terjadi error
  }
}


export default async function PortfolioPage() {
  // Ambil semua data yang dibutuhkan secara paralel
  const [fetchedProjects, fetchedSkills, profileSettings] = await Promise.all([
    getProjects(),
    getSkills(),
    getProfileSettingsData()
  ]);

  // Tentukan URL gambar profil, gunakan placeholder jika tidak ada di database
  // Placeholder untuk Hero Section
  const heroPlaceholder = "https://placehold.co/240x240.png"; 
  // Placeholder untuk About Section
  const aboutPlaceholder = "https://placehold.co/320x400.png"; 

  // Ambil gambar profil dari database, jika tidak ada atau tidak valid, akan null
  const profileImageFromDB = (profileSettings.profileImageUri && profileSettings.profileImageUri.startsWith('data:image/'))
                         ? profileSettings.profileImageUri
                         : null;

  // Struktur data portofolio yang akan dikirim ke komponen client
  const portfolioData: PortfolioDataType = {
    name: "Wahyu Pratomo", 
    title: "Spesialis Media Sosial | Digital Marketing Expert | Strategi dan Kinerja Pemasaran",
    heroTagline: "Membantu merek berkembang di dunia digital dengan strategi yang data-driven dan konten yang menarik.",
    // Gunakan gambar profil dari database, atau placeholder jika tidak ada
    // Pastikan file profile.png ada di public/images/ jika menggunakan path statis
    heroImageUrl: profileImageFromDB || heroPlaceholder,
    heroImageHint: "profile portrait", // Hint untuk AI jika menggunakan placeholder atau gambar dari DB
    socialLinks: {
      github: "https://github.com/bayuarp26/",
      linkedin: "https://linkedin.com/in/wahyupratomo26",
    },
    cvUrl: "/download/Wahyu_Pratomo-cv.pdf", // Path CV
    about: {
      // Gunakan gambar profil yang sama untuk About, atau placeholder yang sesuai jika tidak ada
      imageUrl: profileImageFromDB || aboutPlaceholder, 
      imageHint: "professional activity", // Hint untuk AI
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
    copyrightYear: new Date().getFullYear() // Tahun hak cipta dinamis
  };

  return <PortfolioContent portfolioData={portfolioData} />;
}

    