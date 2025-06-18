
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

// Interface untuk struktur dokumen proyek yang akan dimasukkan ke database
interface ProjectDocumentToInsert {
  title: string;
  imageUrl: string; // Akan menyimpan Data URI gambar proyek
  imageHint: string;
  description: string;
  details: string[];
  tags: string[];
  createdAt: Date; // Tanggal pembuatan proyek
}


export async function addProjectAction(
  data: z.infer<typeof projectInputSchema>
): Promise<{ success: boolean; error?: string; projectId?: string }> {
  try {
    // Validasi input menggunakan skema Zod
    const validationResult = projectInputSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.flatten().fieldErrors);
      // Mengambil pesan error pertama untuk ditampilkan ke pengguna
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, error: firstError || "Data input tidak valid." };
    }

    const validatedData = validationResult.data;

    const client: MongoClient = await clientPromise;
    // Menggunakan database default yang dikonfigurasi di MONGODB_URI (misal: portofolioDB)
    const db = client.db(); 
    // Koleksi 'projects' akan berada di dalam database default tersebut
    const projectsCollection: Collection<Document> = db.collection("projects");

    // Memproses string 'details' menjadi array
    const detailsArray = validatedData.details
      .split('\n') // Pisahkan berdasarkan baris baru
      .map(detail => detail.trim()) // Hapus spasi di awal/akhir setiap detail
      .filter(detail => detail.length > 0); // Hapus detail yang kosong

    // Memproses string 'tags' menjadi array
    const tagsArray = validatedData.tags
      .split('\n') // Pisahkan berdasarkan baris baru
      .map(tag => tag.trim()) // Hapus spasi di awal/akhir setiap tag
      .filter(tag => tag.length > 0); // Hapus tag yang kosong

    // Struktur data proyek yang akan disimpan
    const projectToInsert: ProjectDocumentToInsert = {
      title: validatedData.title,
      imageUrl: validatedData.imageUrl, // Simpan Data URI gambar
      imageHint: validatedData.imageHint,
      description: validatedData.description,
      details: detailsArray,
      tags: tagsArray,
      createdAt: new Date(), // Set tanggal pembuatan saat ini
    };

    // Masukkan dokumen proyek ke koleksi
    const result = await projectsCollection.insertOne(projectToInsert);

    if (result.insertedId) {
      // Revalidasi path untuk memperbarui cache Next.js
      revalidatePath("/"); 
      revalidatePath("/admin/add-project"); 
      revalidatePath("/admin/projects");
      return { success: true, projectId: result.insertedId.toString() };
    } else {
      return { success: false, error: "Gagal menyimpan proyek ke database." };
    }
  } catch (error) {
    console.error("Error in addProjectAction:", error);
    let errorMessage = "Terjadi kesalahan pada server saat menambahkan proyek.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

    