
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document, ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import type { SkillData, ProfileDataType } from "@/app/page"; // Pastikan path benar
import { cookies } from "next/headers";
import { hashPassword, comparePassword } from "@/lib/authUtils"; // createSessionToken tidak diperlukan di sini

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

// Skema untuk validasi input saat memperbarui foto profil
const profileImageSchema = z.object({
  heroImageUrl: z.string().refine(val => val.startsWith('data:image/'), {
    message: "URL Gambar harus berupa Data URI yang valid.",
  }),
});

// Skema untuk validasi nama keahlian
const skillNameSchema = z.string().min(2, { message: "Nama keahlian minimal 2 karakter." });

// Konstanta dan skema untuk validasi file CV
const MAX_CV_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_CV_TYPES = ["application/pdf"];

const cvFileSchema = z.instanceof(File)
  .refine((file) => file.size <= MAX_CV_SIZE, `Ukuran file CV maksimal ${MAX_CV_SIZE / (1024*1024)}MB.`)
  .refine(
    (file) => ACCEPTED_CV_TYPES.includes(file.type),
    "Format file CV tidak valid. Harap unggah file PDF."
  );

// Skema untuk validasi kredensial admin
const adminCredentialsSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini tidak boleh kosong."),
  newUsername: z.string().min(3, "Username baru minimal 3 karakter.").optional().or(z.literal('')), // Boleh kosong jika tidak ingin diubah
  newPassword: z.string().min(6, "Password baru minimal 6 karakter.").optional().or(z.literal('')), // Boleh kosong jika tidak ingin diubah
}).refine(data => data.newUsername || data.newPassword, {
    message: "Setidaknya username baru atau password baru harus diisi.",
    path: ["newUsername"] // Path bisa ke salah satu field, atau field umum
});

interface AdminUserDocument extends Document {
  _id: ObjectId;
  username: string;
  hashedPassword?: string;
}


export async function updateProfileImageAction(
  imageDataUri: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ambil token dari cookie untuk verifikasi
    const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
    if (!tokenCookie) return { success: false, error: "Tidak terautentikasi." };
    // Verifikasi token bisa ditambahkan di sini jika perlu lapisan keamanan ekstra untuk action ini
    // Untuk saat ini, kita asumsikan middleware sudah menangani autentikasi dasar.

    const validationResult = profileImageSchema.safeParse({ heroImageUrl: imageDataUri });
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, error: firstError || "Data input tidak valid." };
    }

    const validatedDataUri = validationResult.data.heroImageUrl;
    const pageFilePath = path.join(process.cwd(), 'src', 'app', 'page.tsx');
    let fileContent = await fs.readFile(pageFilePath, 'utf-8');

    // Regex untuk mengganti heroImageUrl
    const heroRegex = /(heroImageUrl:\s*["'])(data:image\/[^;]+;base64,[^"']+)(["'])/;
    if (!heroRegex.test(fileContent)) {
        console.warn("Peringatan: Pola heroImageUrl tidak cocok atau tidak menggunakan Data URI di src/app/page.tsx.");
        // Mencoba regex yang lebih umum jika formatnya sedikit berbeda
        const altHeroRegex = /(heroImageUrl:\s*["'])([^"']+)(["'])/;
        if (altHeroRegex.test(fileContent)){
            fileContent = fileContent.replace(altHeroRegex, `$1${validatedDataUri}$3`);
        } else {
            return { success: false, error: "Pola heroImageUrl tidak ditemukan di src/app/page.tsx. Periksa format file." };
        }
    } else {
        fileContent = fileContent.replace(heroRegex, `$1${validatedDataUri}$3`);
    }
    

    // Regex untuk mengganti about.imageUrl
    const aboutImageRegex = /(about:\s*\{\s*[\s\S]*?imageUrl:\s*["'])(data:image\/[^;]+;base64,[^"']+)(["'])/;
     if (!aboutImageRegex.test(fileContent)) {
      console.warn("Peringatan: Pola about.imageUrl tidak cocok atau tidak menggunakan Data URI di src/app/page.tsx. Foto 'Tentang Saya' mungkin tidak diperbarui.");
       const altAboutRegex = /(about:\s*\{\s*[\s\S]*?imageUrl:\s*["'])([^"']+)(["'])/;
        if (altAboutRegex.test(fileContent)){
            fileContent = fileContent.replace(altAboutRegex, `$1${validatedDataUri}$3`);
        } else {
             console.error("Pola about.imageUrl juga tidak ditemukan dengan regex alternatif.");
        }
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
    
    const { ObjectId } = require('mongodb'); // Pastikan ObjectId diimpor dengan benar
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
    let errorMessage = "Terjadi kesalahan pada server saat menghapus keahlian.";
    if (error instanceof Error) {
        errorMessage = error.message;
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
    const newCvUrl = `/download/${newFilename}`; // Path relatif ke public folder
    
    if (cvUrlRegex.test(fileContent)) {
        fileContent = fileContent.replace(cvUrlRegex, `$1${newCvUrl}$3`);
    } else {
        console.warn("Peringatan: Pola cvUrl tidak ditemukan di src/app/page.tsx. URL CV mungkin tidak diperbarui di sana.");
        // Jika ingin mengembalikan error jika pola tidak ditemukan:
        // return { success: false, error: "Pola cvUrl tidak ditemukan di src/app/page.tsx."};
    }
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
    
    // Ambil pengguna admin saat ini (asumsi hanya ada satu atau berdasarkan token jika ada multi-admin)
    // Untuk sistem sederhana ini, kita bisa mengambil pengguna admin pertama.
    // Idealnya, Anda akan mengidentifikasi admin berdasarkan ID dari token sesi.
    const adminUser = await adminUsersCollection.findOne({}); 

    if (!adminUser || !adminUser.hashedPassword) {
      return { success: false, error: "Pengguna admin tidak ditemukan atau konfigurasi salah." };
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, adminUser.hashedPassword);
    if (!isCurrentPasswordValid) {
      return { success: false, error: "Password saat ini salah." };
    }

    const updateData: Partial<AdminUserDocument> = {};
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

    // Hapus cookie sesi untuk memaksa login ulang dengan kredensial baru
    cookies().delete(ADMIN_AUTH_COOKIE_NAME);
    
    revalidatePath("/admin/profile"); // Revalidate path profil admin
    // Tidak perlu revalidate path login, karena itu halaman publik
    return { success: true };

  } catch (error) {
    console.error("Error in updateAdminCredentialsAction:", error);
    return { success: false, error: "Terjadi kesalahan server saat memperbarui kredensial." };
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  cookies().delete(ADMIN_AUTH_COOKIE_NAME);
  return { success: true };
}


// Fungsi untuk mengambil data awal untuk halaman profil admin
interface AdminProfileInitialData {
  skills: SkillData[];
  currentHeroImageUrl: string; // Atau path default
  currentCvUrl: string; // Atau path default
}

export async function getAdminProfileInitialData(): Promise<{ success: boolean; data?: AdminProfileInitialData; error?: string }> {
  try {
    // 1. Ambil Skills dari MongoDB
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const skillsCollection = db.collection<SkillData>("skills");
    const skills = await skillsCollection.find({}).sort({ name: 1 }).toArray();
    const mappedSkills = skills.map(s => ({ ...s, _id: s._id.toString() }));

    // 2. Baca heroImageUrl dan cvUrl dari src/app/page.tsx
    // Ini pendekatan sederhana, untuk aplikasi lebih besar, pertimbangkan menyimpan ini di DB atau file konfigurasi terpisah.
    const pageFilePath = path.join(process.cwd(), 'src', 'app', 'page.tsx');
    const fileContent = await fs.readFile(pageFilePath, 'utf-8');
    
    let currentHeroImageUrl = "/profile.png"; // Default
    const heroRegex = /heroImageUrl:\s*["'](data:image\/[^;]+;base64,[^"']+?)["']/;
    const heroMatch = fileContent.match(heroRegex);
    if (heroMatch && heroMatch[1]) {
      currentHeroImageUrl = heroMatch[1];
    } else {
        const altHeroRegex = /heroImageUrl:\s*["']([^"']+?)["']/;
        const altHeroMatch = fileContent.match(altHeroRegex);
        if (altHeroMatch && altHeroMatch[1]) {
            currentHeroImageUrl = altHeroMatch[1];
        } else {
            console.warn("Tidak dapat mengekstrak heroImageUrl dari page.tsx, menggunakan default.");
        }
    }

    let currentCvUrl = "/download/Wahyu_Pratomo-cv.pdf"; // Default
    const cvRegex = /cvUrl:\s*["'](.*?)["']/;
    const cvMatch = fileContent.match(cvRegex);
    if (cvMatch && cvMatch[1]) {
      currentCvUrl = cvMatch[1];
    } else {
      console.warn("Tidak dapat mengekstrak cvUrl dari page.tsx, menggunakan default.");
    }

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
    let errorMessage = "Gagal mengambil data awal profil admin.";
    if (error instanceof Error) errorMessage = error.message;
    return { success: false, error: errorMessage };
  }
}
