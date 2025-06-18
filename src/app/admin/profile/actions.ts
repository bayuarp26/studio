
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document, ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import type { SkillData } from "@/app/page"; // Ensure correct path

const profileImageSchema = z.object({
  heroImageUrl: z.string().refine(val => val.startsWith('data:image/'), {
    message: "URL Gambar harus berupa Data URI yang valid.",
  }),
});

const skillNameSchema = z.string().min(2, { message: "Nama keahlian minimal 2 karakter." });

export async function updateProfileImageAction(
  imageDataUri: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validationResult = profileImageSchema.safeParse({ heroImageUrl: imageDataUri });
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, error: firstError || "Data input tidak valid." };
    }

    const validatedDataUri = validationResult.data.heroImageUrl;

    const pageFilePath = path.join(process.cwd(), 'src', 'app', 'page.tsx');
    let fileContent = await fs.readFile(pageFilePath, 'utf-8');

    // Regex to find heroImageUrl: "..." or heroImageUrl: '...'
    // It captures the part inside the quotes.
    const regex = /(heroImageUrl:\s*["'])(.*?)(["'])/;
    
    if (!regex.test(fileContent)) {
      console.error("heroImageUrl pattern not found in src/app/page.tsx. Content:", fileContent.substring(0, 500));
      return { success: false, error: "Pola heroImageUrl tidak ditemukan di src/app/page.tsx. Periksa format file." };
    }

    // Replace the existing URL with the new Data URI, ensuring quotes are preserved or set.
    fileContent = fileContent.replace(regex, `$1${validatedDataUri}$3`);
    
    await fs.writeFile(pageFilePath, fileContent, 'utf-8');

    revalidatePath('/'); // Revalidate the home page where the image is displayed
    revalidatePath('/admin/profile'); // Revalidate the admin page
    return { success: true };

  } catch (error) {
    console.error("Error in updateProfileImageAction:", error);
    let errorMessage = "Terjadi kesalahan pada server saat memperbarui foto profil.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}


export async function addSkillAction(
  name: string
): Promise<{ success: boolean; error?: string; newSkill?: SkillData }> {
  try {
    const validationResult = skillNameSchema.safeParse(name);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.flatten().formErrors[0] || "Nama keahlian tidak valid." };
    }

    const validatedName = validationResult.data;

    const client: MongoClient = await clientPromise;
    const db = client.db();
    const skillsCollection: Collection<Document> = db.collection("skills");

    // Check if skill already exists (case-insensitive check)
    const existingSkill = await skillsCollection.findOne({ name: { $regex: `^${validatedName}$`, $options: 'i' } });
    if (existingSkill) {
      return { success: false, error: `Keahlian "${validatedName}" sudah ada.` };
    }

    const result = await skillsCollection.insertOne({ name: validatedName, createdAt: new Date() });

    if (result.insertedId) {
      revalidatePath("/");
      revalidatePath("/admin/profile");
      return { 
        success: true, 
        newSkill: { 
          _id: result.insertedId.toString(), 
          name: validatedName 
        } 
      };
    } else {
      return { success: false, error: "Gagal menyimpan keahlian ke database." };
    }
  } catch (error) {
    console.error("Error in addSkillAction:", error);
    let errorMessage = "Terjadi kesalahan pada server.";
     if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

export async function deleteSkillAction(
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  if (!skillId || typeof skillId !== 'string') {
    return { success: false, error: "ID keahlian tidak valid." };
  }

  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const skillsCollection: Collection<Document> = db.collection("skills");
    
    const result = await skillsCollection.deleteOne({ _id: new (require('mongodb').ObjectId)(skillId) });

    if (result.deletedCount === 1) {
      revalidatePath("/");
      revalidatePath("/admin/profile");
      return { success: true };
    } else {
      return { success: false, error: "Keahlian tidak ditemukan atau gagal dihapus." };
    }
  } catch (error) {
    console.error("Error in deleteSkillAction:", error);
    let errorMessage = "Terjadi kesalahan pada server saat menghapus keahlian.";
    if (error instanceof Error) {
        errorMessage = error.message.includes("Argument passed in must be a single String of 12 bytes or a string of 24 hex characters")
          ? "Format ID keahlian tidak valid."
          : error.message;
    }
    return { success: false, error: errorMessage };
  }
}
