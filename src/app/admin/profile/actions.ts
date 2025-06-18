
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

const MAX_CV_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_CV_TYPES = ["application/pdf"];

const cvFileSchema = z.instanceof(File)
  .refine((file) => file.size <= MAX_CV_SIZE, `Ukuran file CV maksimal ${MAX_CV_SIZE / (1024*1024)}MB.`)
  .refine(
    (file) => ACCEPTED_CV_TYPES.includes(file.type),
    "Format file CV tidak valid. Harap unggah file PDF."
  );


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

    const heroRegex = /(heroImageUrl:\s*["'])(.*?)(["'])/;
    if (!heroRegex.test(fileContent)) {
      console.error("heroImageUrl pattern not found in src/app/page.tsx.");
      return { success: false, error: "Pola heroImageUrl tidak ditemukan di src/app/page.tsx. Periksa format file." };
    }
    fileContent = fileContent.replace(heroRegex, `$1${validatedDataUri}$3`);

    const aboutImageRegex = /(about:\s*\{\s*[\s\S]*?imageUrl:\s*["'])(.*?)(["'])/;
    if (!aboutImageRegex.test(fileContent)) {
      console.error("about.imageUrl pattern not found in src/app/page.tsx. About image will not be updated.");
      return { success: false, error: "Pola about.imageUrl tidak ditemukan di src/app/page.tsx. Pembaruan foto gagal total." };
    }
    fileContent = fileContent.replace(aboutImageRegex, `$1${validatedDataUri}$3`);
    
    await fs.writeFile(pageFilePath, fileContent, 'utf-8');

    revalidatePath('/'); 
    revalidatePath('/admin/profile'); 
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

export async function updateCVAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const cvFile = formData.get("cvFile") as File | null;

    if (!cvFile) {
      return { success: false, error: "File CV tidak ditemukan." };
    }

    const validationResult = cvFileSchema.safeParse(cvFile);
    if (!validationResult.success) {
      const firstError = validationResult.error.flatten().formErrors[0];
      return { success: false, error: firstError || "File CV tidak valid." };
    }

    const validatedFile = validationResult.data;
    const newFilename = "Wahyu_Pratomo-cv.pdf"; // Fixed filename
    const publicDir = path.join(process.cwd(), 'public');
    const downloadDir = path.join(publicDir, 'download');
    const cvFilePath = path.join(downloadDir, newFilename);

    // Ensure download directory exists
    await fs.mkdir(downloadDir, { recursive: true });

    // Save the file
    const bytes = await validatedFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(cvFilePath, buffer);

    // Update cvUrl in src/app/page.tsx to ensure it's correct
    const pageFilePath = path.join(process.cwd(), 'src', 'app', 'page.tsx');
    let fileContent = await fs.readFile(pageFilePath, 'utf-8');
    
    const cvUrlRegex = /(cvUrl:\s*["'])(.*?)(["'])/;
    const newCvUrl = `/download/${newFilename}`;

    if (!cvUrlRegex.test(fileContent)) {
        console.warn("cvUrl pattern not found in src/app/page.tsx. It might be a new setup or the pattern changed.");
        // Attempt to add it if a known structure exists, or handle as appropriate.
        // For now, we'll assume it might need to be updated if present.
    }
    
    fileContent = fileContent.replace(cvUrlRegex, `$1${newCvUrl}$3`);
    await fs.writeFile(pageFilePath, fileContent, 'utf-8');

    revalidatePath('/'); // Revalidate home page
    revalidatePath('/admin/profile'); // Revalidate admin page
    return { success: true };

  } catch (error) {
    console.error("Error in updateCVAction:", error);
    let errorMessage = "Terjadi kesalahan pada server saat memperbarui CV.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
