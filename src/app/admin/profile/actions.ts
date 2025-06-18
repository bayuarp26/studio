
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document, ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import type { SkillData } from "@/app/page"; // Ensure correct path
import { cookies } from "next/headers";
import { hashPassword, comparePassword, createSessionToken } from "@/lib/authUtils";

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

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

const adminCredentialsSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini tidak boleh kosong."),
  newUsername: z.string().min(1, "Username baru tidak boleh kosong."),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter."),
});
interface AdminUserDocument extends Document {
  username: string;
  hashedPassword?: string;
}


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
      // If critical, return error. If not, log and proceed.
      // return { success: false, error: "Pola about.imageUrl tidak ditemukan. Pembaruan foto gagal total." };
    } else {
      fileContent = fileContent.replace(aboutImageRegex, `$1${validatedDataUri}$3`);
    }
    
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
    
    // Ensure ObjectId is correctly imported and used if your IDs are ObjectIds
    const { ObjectId } = require('mongodb');
    const result = await skillsCollection.deleteOne({ _id: new ObjectId(skillId) });

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
    const newFilename = "Wahyu_Pratomo-cv.pdf"; 
    const publicDir = path.join(process.cwd(), 'public');
    const downloadDir = path.join(publicDir, 'download');
    const cvFilePath = path.join(downloadDir, newFilename);

    await fs.mkdir(downloadDir, { recursive: true });

    const bytes = await validatedFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(cvFilePath, buffer);

    const pageFilePath = path.join(process.cwd(), 'src', 'app', 'page.tsx');
    let fileContent = await fs.readFile(pageFilePath, 'utf-8');
    
    const cvUrlRegex = /(cvUrl:\s*["'])(.*?)(["'])/;
    const newCvUrl = `/download/${newFilename}`;
    
    fileContent = fileContent.replace(cvUrlRegex, `$1${newCvUrl}$3`);
    await fs.writeFile(pageFilePath, fileContent, 'utf-8');

    revalidatePath('/'); 
    revalidatePath('/admin/profile'); 
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

export async function updateAdminCredentialsAction(
  data: z.infer<typeof adminCredentialsSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const validationResult = adminCredentialsSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, error: firstError || "Data input tidak valid." };
    }

    const { currentPassword, newUsername, newPassword } = validationResult.data;

    const client: MongoClient = await clientPromise;
    const db = client.db();
    const adminUsersCollection: Collection<AdminUserDocument> = db.collection("admin_users");

    // Assuming there's only one admin user or you identify them uniquely.
    // For this simple case, we fetch the first admin user.
    // In a multi-admin system, you'd need a way to identify which admin is logged in.
    const adminUser = await adminUsersCollection.findOne({}); 

    if (!adminUser || !adminUser.hashedPassword) {
      return { success: false, error: "Pengguna admin tidak ditemukan atau konfigurasi salah." };
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, adminUser.hashedPassword);
    if (!isCurrentPasswordValid) {
      return { success: false, error: "Password saat ini salah." };
    }

    const newHashedPassword = await hashPassword(newPassword);
    await adminUsersCollection.updateOne(
      { _id: adminUser._id },
      { $set: { username: newUsername, hashedPassword: newHashedPassword } }
    );

    // Re-issue a new token with the new username if it changed, and clear old one.
    // Or, simply log out and force re-login for simplicity.
    // For this iteration, we'll log them out to ensure the new credentials are used for a new session.
    cookies().delete(ADMIN_AUTH_COOKIE_NAME);
    
    revalidatePath("/admin/profile");
    return { success: true };

  } catch (error) {
    console.error("Error in updateAdminCredentialsAction:", error);
    return { success: false, error: "Terjadi kesalahan server saat memperbarui kredensial." };
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  cookies().delete(ADMIN_AUTH_COOKIE_NAME);
  return { success: true };
  // Client-side will handle redirect after this.
}
