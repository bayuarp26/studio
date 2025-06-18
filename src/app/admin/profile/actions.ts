
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document, ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import type { SkillData } from "@/app/page";
import { cookies } from "next/headers";
import { hashPassword, comparePassword } from "@/lib/authUtils";

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

const heroImageDataUriSchema = z.string().refine(val => val.startsWith('data:image/'), {
  message: "URL Gambar harus berupa Data URI yang valid.",
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
  newUsername: z.string().min(3, "Username baru minimal 3 karakter.").optional().or(z.literal('')),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter.").optional().or(z.literal('')),
}).refine(data => data.newUsername || data.newPassword, {
    message: "Setidaknya username baru atau password baru harus diisi.",
    path: ["newUsername"]
});

interface AdminUserDocument extends Document {
  _id: ObjectId;
  username: string;
  hashedPassword?: string;
  // profileImageUri untuk foto profil publik telah dipindahkan ke koleksi 'profile_settings'
}

interface ProfileSettingsDocument extends Document {
  _id?: ObjectId; // Bisa jadi kita hanya punya 1 dokumen, jadi _id bisa fixed atau tidak dipakai
  profileImageUri?: string;
  // Tambahkan field lain untuk pengaturan profil di sini jika perlu
}


export async function updateProfileImageAction(
  imageDataUri: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
    if (!tokenCookie) return { success: false, error: "Tidak terautentikasi." };

    const validationResult = heroImageDataUriSchema.safeParse(imageDataUri);
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, error: firstError || "Data URI gambar tidak valid." };
    }

    const validatedDataUri = validationResult.data;
    
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");

    // Update atau buat (upsert) satu dokumen untuk menyimpan foto profil
    // Kita bisa menggunakan ID tetap atau filter kosong jika hanya ada satu dokumen
    await profileSettingsCollection.updateOne(
      {}, // Filter kosong untuk mencocokkan dokumen tunggal, atau gunakan ID spesifik
      { $set: { profileImageUri: validatedDataUri } },
      { upsert: true } // Buat dokumen jika belum ada
    );
    
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
    return { success: false, error: "Terjadi kesalahan pada server saat menambahkan keahlian." };
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
    
    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(skillId)) {
        return { success: false, error: "Format ID keahlian tidak valid." };
    }
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
    return { success: false, error: "Terjadi kesalahan pada server saat menghapus keahlian." };
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

    revalidatePath('/'); 
    revalidatePath('/admin/profile'); 
    return { success: true };

  } catch (error)
{
    console.error("Error in updateCVAction:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat memperbarui CV." };
  }
}

export async function updateAdminCredentialsAction(
  data: z.infer<typeof adminCredentialsSchema>
): Promise<{ success: boolean; error?: string }> {
   const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
   if (!tokenCookie) {
     return { success: false, error: "Sesi tidak ditemukan. Silakan login kembali." };
   }
  
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
    
    const adminUser = await adminUsersCollection.findOne({}); 

    if (!adminUser || !adminUser.hashedPassword) {
      return { success: false, error: "Pengguna admin tidak ditemukan atau konfigurasi salah." };
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, adminUser.hashedPassword);
    if (!isCurrentPasswordValid) {
      return { success: false, error: "Password saat ini salah." };
    }

    const updateData: Partial<Pick<AdminUserDocument, 'username' | 'hashedPassword'>> = {};
    if (newUsername && newUsername.trim() !== "") {
      updateData.username = newUsername.trim();
    }
    if (newPassword && newPassword.trim() !== "") {
      updateData.hashedPassword = await hashPassword(newPassword.trim());
    }

    if (Object.keys(updateData).length === 0) {
        return { success: false, error: "Tidak ada perubahan yang diberikan untuk username atau password."};
    }

    await adminUsersCollection.updateOne(
      { _id: adminUser._id },
      { $set: updateData }
    );

    cookies().delete(ADMIN_AUTH_COOKIE_NAME);
    
    revalidatePath("/admin/profile");
    revalidatePath("/login"); 
    return { success: true };

  } catch (error) {
    console.error("Error in updateAdminCredentialsAction:", error);
    return { success: false, error: "Terjadi kesalahan server saat memperbarui kredensial." };
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  cookies().delete(ADMIN_AUTH_COOKIE_NAME);
  revalidatePath("/login");
  revalidatePath("/admin/profile"); 
  return { success: true };
}

export interface AdminProfileInitialData {
  skills: SkillData[];
  currentHeroImageUrl: string; 
  currentCvUrl: string;
}

export async function getAdminProfileInitialData(): Promise<{ success: boolean; data?: AdminProfileInitialData; error?: string }> {
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    
    const skillsCollection = db.collection<SkillData>("skills");
    const skills = await skillsCollection.find({}).sort({ name: 1 }).toArray();
    const mappedSkills = skills.map(s => ({ ...s, _id: s._id.toString() }));

    // Mengambil foto profil dari koleksi 'profile_settings'
    const profileSettingsCollection = db.collection<ProfileSettingsDocument>("profile_settings");
    const profileSettings = await profileSettingsCollection.findOne({});
    
    let currentHeroImageUrl = "https://placehold.co/240x240.png?text=Profile"; // Default placeholder
    if (profileSettings && profileSettings.profileImageUri && profileSettings.profileImageUri.startsWith('data:image/')) {
      currentHeroImageUrl = profileSettings.profileImageUri;
    }
    
    let currentCvUrl = "/download/Wahyu_Pratomo-cv.pdf"; 
    // Logika untuk mengambil CV path bisa tetap atau diubah jika CV juga disimpan di DB. Saat ini masih dari public.
    // Untuk menyederhanakan, kita asumsikan path CV masih hardcoded atau dikelola secara statis untuk saat ini.

    return { 
      success: true, 
      data: { 
        skills: mappedSkills, 
        currentHeroImageUrl, 
        currentCvUrl 
      } 
    };

  } catch (error) {
    console.error("Error in getAdminProfileInitialData:", error);
    return { success: false, error: "Gagal mengambil data awal profil admin." };
  }
}

    