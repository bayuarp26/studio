
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

  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(); // Menggunakan database yang dikonfigurasi
    const projectsCollection: Collection<Document> = db.collection("projects");

    const result = await projectsCollection.deleteOne({ _id: new ObjectId(projectId) });

    if (result.deletedCount === 1) {
      revalidatePath("/"); // Revalidasi halaman utama
      revalidatePath("/admin/projects"); // Revalidasi halaman daftar proyek admin
      return { success: true };
    } else {
      return { success: false, error: "Proyek tidak ditemukan atau gagal dihapus." };
    }
  } catch (error) {
    console.error("Error in deleteProjectAction:", error);
    let errorMessage = "Terjadi kesalahan pada server saat menghapus proyek.";
    if (error instanceof Error) {
        // Potentially log more specific error details or handle different error types
        errorMessage = error.message.includes("Argument passed in must be a single String of 12 bytes or a string of 24 hex characters")
          ? "Format ID proyek tidak valid."
          : error.message;
    }
    return { success: false, error: errorMessage };
  }
}
