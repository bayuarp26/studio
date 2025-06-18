
import PortfolioContent from '@/app/portfolio-content';
import clientPromise from '@/lib/mongodb';
import type { MongoClient, ObjectId } from 'mongodb';

interface ProjectDocument {
  _id: ObjectId;
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
}

interface SkillDocument {
  _id: ObjectId;
  name: string;
}

export interface ProjectData {
  _id: string;
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
}

export interface SkillData {
  _id: string;
  name: string;
}

export interface ProfileDataType {
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
    const db = client.db(); // Assumes DB name is in the MONGODB_URI or uses default
    const projectsCollection = db.collection<ProjectDocument>("projects");
    const projects = await projectsCollection.find({}).sort({ createdAt: -1 }).toArray();
    return projects.map(p => ({ ...p, _id: p._id.toString() }));
  } catch (e) {
    console.error("Failed to fetch projects:", e);
    return [];
  }
}

async function getSkills(): Promise<SkillData[]> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(); // Assumes DB name is in the MONGODB_URI or uses default
    const skillsCollection = db.collection<SkillDocument>("skills");
    const skills = await skillsCollection.find({}).sort({ name: 1 }).toArray(); // Sort skills by name
    return skills.map(s => ({ ...s, _id: s._id.toString(), name: s.name }));
  } catch (e) {
    console.error("Failed to fetch skills:", e);
    return [];
  }
}


export default async function PortfolioPage() {
  const fetchedProjects = await getProjects();
  const fetchedSkills = await getSkills();

  const profileData: ProfileDataType = {
    name: "Wahyu Pratomo",
    title: "Spesialis Media Sosial | Digital Marketing Expert | Strategi dan Kinerja Pemasaran",
    heroTagline: "Membantu merek berkembang di dunia digital dengan strategi yang data-driven dan konten yang menarik.",
    heroImageUrl: "/profile.png",
    heroImageHint: "professional portrait",
    socialLinks: {
      github: "https://github.com/bayuarp26/",
      linkedin: "https://linkedin.com/in/wahyupratomo26",
    },
    cvUrl: "/download/Wahyu_Pratomo-cv.pdf",
    about: {
      imageUrl: "/profile.png", // This image can also be made dynamic later
      imageHint: "team collaboration",
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

  return <PortfolioContent profileData={profileData} />;
}
