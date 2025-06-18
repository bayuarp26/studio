
"use server";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import type { MongoClient, Collection, Document } from 'mongodb';

export async function deleteProjectAction(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  if (!projectId || typeof projectId !== 'string') {
    return { success: false, error: "ID proyek tidak valid." };
  }
   if (!ObjectId.isValid(projectId)) {
    return { success: false, error: "Format ID proyek tidak valid." };
  }

  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(); 
    const projectsCollection: Collection<Document> = db.collection("projects");

    const result = await projectsCollection.deleteOne({ _id: new ObjectId(projectId) });

    if (result.deletedCount === 1) {
      revalidatePath("/"); 
      revalidatePath("/admin/projects"); 
      return { success: true };
    } else {
      return { success: false, error: "Proyek tidak ditemukan atau gagal dihapus." };
    }
  } catch (error) {
    console.error("Error in deleteProjectAction:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat menghapus proyek." };
  }
}

export interface ProjectDataForAdmin {
  _id: string;
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
  createdAt?: Date;
}

interface ProjectDocumentFromDB extends Document {
  _id: ObjectId;
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
  createdAt: Date; 
}

export async function getAdminProjectsAction(): Promise<{ success: boolean; projects?: ProjectDataForAdmin[]; error?: string }> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const projectsCollection = db.collection<ProjectDocumentFromDB>("projects");

    const projectsFromDB = await projectsCollection.find({}).sort({ createdAt: -1 }).toArray();

    const projects: ProjectDataForAdmin[] = projectsFromDB.map(p => ({
      _id: p._id.toString(),
      title: p.title,
      imageUrl: p.imageUrl,
      imageHint: p.imageHint,
      description: p.description,
      details: p.details,
      tags: p.tags,
      createdAt: p.createdAt,
    }));

    return { success: true, projects };
  } catch (error) {
    console.error("Error in getAdminProjectsAction:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat mengambil proyek." };
  }
}
