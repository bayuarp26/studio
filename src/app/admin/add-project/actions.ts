
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document } from 'mongodb';

// Skema validasi untuk input proyek
const projectInputSchema = z.object({
  title: z.string().min(2, { message: "Judul proyek minimal 2 karakter." }),
  imageUrl: z.string().refine(val => val.startsWith('data:image/'), { 
    message: "URL Gambar harus berupa Data URI yang valid (diawali dengan 'data:image/')." 
  }),
  imageHint: z.string().min(2, { message: "Petunjuk gambar minimal 2 karakter." }),
  description: z.string().min(10, { message: "Deskripsi minimal 10 karakter." }),
  details: z.string().min(1, { message: "Detail proyek tidak boleh kosong." }),
  tags: z.string().min(1, { message: "Tag tidak boleh kosong." }),
});

interface ProjectDocumentToInsert {
  title: string;
  imageUrl: string; // Akan menyimpan Data URI
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
  createdAt: Date;
}


export async function addProjectAction(
  data: z.infer<typeof projectInputSchema>
): Promise<{ success: boolean; error?: string; projectId?: string }> {
  try {
    const validationResult = projectInputSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.flatten().fieldErrors);
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, error: firstError || "Data input tidak valid." };
    }

    const validatedData = validationResult.data;

    const client: MongoClient = await clientPromise;
    const db = client.db(); 
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
      imageUrl: validatedData.imageUrl, // Simpan Data URI
      imageHint: validatedData.imageHint,
      description: validatedData.description,
      details: detailsArray,
      tags: tagsArray,
      createdAt: new Date(), 
    };

    const result = await projectsCollection.insertOne(projectToInsert);

    if (result.insertedId) {
      revalidatePath("/"); 
      revalidatePath("/admin/add-project"); 
      revalidatePath("/admin/projects"); // Revalidasi halaman daftar proyek admin
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
    if (error instanceof z.ZodError) {
        errorMessage = error.errors.map(e => e.message).join(', ');
    }
    return { success: false, error: errorMessage };
  }
}

    