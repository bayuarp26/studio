
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document } from 'mongodb';

// Skema validasi untuk input proyek, mirip dengan ProjectFormValues di client
// tapi ini untuk validasi di server.
const projectInputSchema = z.object({
  title: z.string().min(2),
  imageUrl: z.string().url(),
  imageHint: z.string().min(2),
  description: z.string().min(10),
  details: z.string().min(1), // Akan di-split menjadi array
  tags: z.string().min(1),    // Akan di-split menjadi array
});

// Tipe data yang akan disimpan di MongoDB, mirip dengan ProjectData di src/app/page.tsx
// tapi tanpa _id karena itu akan digenerate MongoDB.
interface ProjectDocumentToInsert {
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
  createdAt: Date; // Menambahkan timestamp
}


export async function addProjectAction(
  data: z.infer<typeof projectInputSchema>
): Promise<{ success: boolean; error?: string; projectId?: string }> {
  try {
    const validationResult = projectInputSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.flatten().fieldErrors);
      // Mengambil pesan error pertama untuk ditampilkan
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, error: firstError || "Data input tidak valid." };
    }

    const validatedData = validationResult.data;

    const client: MongoClient = await clientPromise;
    const db = client.db(); // Menggunakan database yang dikonfigurasi di MONGODB_URI
    const projectsCollection: Collection<Document> = db.collection("projects");

    const detailsArray = validatedData.details
      .split('\n')
      .map(detail => detail.trim())
      .filter(detail => detail.length > 0);

    const tagsArray = validatedData.tags
      .split('\n')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const projectToInsert: ProjectDocumentToInsert = {
      title: validatedData.title,
      imageUrl: validatedData.imageUrl,
      imageHint: validatedData.imageHint,
      description: validatedData.description,
      details: detailsArray,
      tags: tagsArray,
      createdAt: new Date(), // Tambahkan tanggal pembuatan
    };

    const result = await projectsCollection.insertOne(projectToInsert);

    if (result.insertedId) {
      revalidatePath("/"); // Revalidasi halaman utama agar menampilkan proyek baru
      revalidatePath("/admin/add-project"); // Mungkin tidak perlu, tapi bisa untuk membersihkan state form
      return { success: true, projectId: result.insertedId.toString() };
    } else {
      return { success: false, error: "Gagal menyimpan proyek ke database." };
    }
  } catch (error) {
    console.error("Error in addProjectAction:", error);
    let errorMessage = "Terjadi kesalahan pada server.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
