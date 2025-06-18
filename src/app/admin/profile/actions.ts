
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

// Skema untuk validasi Data URI gambar
const heroImageDataUriSchema = z.string().refine(val => val.startsWith('data:image/'), {
  message: "URL Gambar harus berupa Data URI yang valid (diawali dengan 'data:image/').",
});

// Skema untuk validasi nama keahlian
const skillNameSchema = z.string().min(2, { message: "Nama keahlian minimal 2 karakter." });

// Konstanta untuk validasi file CV
const MAX_CV_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_CV_TYPES = ["application/pdf"];

// Skema untuk validasi file CV
const cvFileSchema = z.instanceof(File)
  .refine((file) => file.size <= MAX_CV_SIZE, `Ukuran file CV maksimal ${MAX_CV_SIZE / (1024*1024)}MB.`)
  .refine(
    (file) => ACCEPTED_CV_TYPES.includes(file.type),
    "Format file CV tidak valid. Harap unggah file PDF."
  );

// Skema untuk validasi kredensial admin
const adminCredentialsSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini tidak boleh kosong."),
  newUsername: z.string().min(3, "Username baru minimal 3 karakter.").optional().or(z.literal('')),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter.").optional().or(z.literal('')),
}).refine(data => data.newUsername || data.newPassword, {
    message: "Setidaknya username baru atau password baru harus diisi.",
    path: ["newUsername"] // Path untuk error jika validasi refine gagal
});

// Interface untuk dokumen pengguna admin di database
// Field profileImageUri untuk foto profil publik telah dipindahkan ke koleksi 'profile_settings'
interface AdminUserDocument extends Document {
  _id: ObjectId;
  username: string;
  hashedPassword?: string;
}

// Interface untuk dokumen pengaturan profil di database
// Dokumen ini akan disimpan dalam koleksi 'profile_settings'
interface ProfileSettingsDocument extends Document {
  _id?: ObjectId; // ID bisa kita buat unik atau biarkan MongoDB yang generate
  profileImageUri?: string; // Menyimpan Data URI dari gambar profil
  // Tambahkan field lain untuk pengaturan profil di sini jika perlu
}


export async function updateProfileImageAction(
  imageDataUri: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verifikasi sesi admin
    const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
    if (!tokenCookie) return { success: false, error: "Tidak terautentikasi." };

    // Validasi input imageDataUri
    const validationResult = heroImageDataUriSchema.safeParse(imageDataUri);
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, error: firstError || "Data URI gambar tidak valid." };
    }
    const validatedDataUri = validationResult.data;
    
    const client: MongoClient = await clientPromise;
    // Menggunakan database default yang dikonfigurasi di MONGODB_URI (misal: portofolioDB)
    const db = client.db();
    // Koleksi 'profile_settings' akan berada di dalam database default tersebut
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");

    // Update atau buat (upsert) satu dokumen untuk menyimpan foto profil
    // Kita bisa menggunakan filter kosong jika hanya ada satu dokumen pengaturan global
    await profileSettingsCollection.updateOne(
      {}, // Filter kosong akan mencocokkan/membuat satu dokumen global
      { $set: { profileImageUri: validatedDataUri } },
      { upsert: true } // Membuat dokumen jika belum ada
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
    // Verifikasi sesi admin
    const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
    if (!tokenCookie) return { success: false, error: "Tidak terautentikasi." };

    const validationResult = skillNameSchema.safeParse(name);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.flatten().formErrors[0] || "Nama keahlian tidak valid." };
    }

    const validatedName = validationResult.data;

    const client: MongoClient = await clientPromise;
    // Menggunakan database default yang dikonfigurasi di MONGODB_URI
    const db = client.db();
    // Koleksi 'skills' akan berada di dalam database default tersebut
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
  // Verifikasi sesi admin
  const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
  if (!tokenCookie) return { success: false, error: "Tidak terautentikasi." };

  if (!skillId || typeof skillId !== 'string') {
    return { success: false, error: "ID keahlian tidak valid." };
  }

  try {
    const client: MongoClient = await clientPromise;
    // Menggunakan database default yang dikonfigurasi di MONGODB_URI
    const db = client.db();
    // Koleksi 'skills' akan berada di dalam database default tersebut
    const skillsCollection: Collection<Document> = db.collection("skills");
    
    const { ObjectId } = require('mongodb'); // Pastikan ObjectId diimpor atau di-require
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
    // Verifikasi sesi admin
    const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
    if (!tokenCookie) return { success: false, error: "Tidak terautentikasi." };

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
    const newFilename = "Wahyu_Pratomo-cv.pdf"; // Nama file CV yang konsisten
    const publicDir = path.join(process.cwd(), 'public');
    const downloadDir = path.join(publicDir, 'download');
    const cvFilePath = path.join(downloadDir, newFilename);

    // Pastikan direktori /public/download ada
    await fs.mkdir(downloadDir, { recursive: true });

    // Baca file dan tulis ke sistem file
    const bytes = await validatedFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(cvFilePath, buffer);

    revalidatePath('/'); // Revalidasi halaman utama untuk memperbarui link CV jika perlu
    revalidatePath('/admin/profile'); // Revalidasi halaman profil admin
    return { success: true };

  } catch (error) {
    console.error("Error in updateCVAction:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat memperbarui CV." };
  }
}

export async function updateAdminCredentialsAction(
  data: z.infer<typeof adminCredentialsSchema>
): Promise<{ success: boolean; error?: string }> {
   // Verifikasi sesi admin
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
    // Menggunakan database default yang dikonfigurasi di MONGODB_URI
    const db = client.db();
    // Koleksi 'admin_users' akan berada di dalam database default tersebut
    const adminUsersCollection: Collection<AdminUserDocument> = db.collection("admin_users");
    
    // Asumsi hanya ada satu pengguna admin, cari tanpa filter spesifik atau dengan filter yang sesuai
    const adminUser = await adminUsersCollection.findOne({}); 

    if (!adminUser || !adminUser.hashedPassword) {
      // Jika tidak ada admin user, atau password belum di-hash (migrasi dari sistem lama)
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
        // Ini seharusnya sudah ditangani oleh refine di skema Zod, tapi sebagai pengaman tambahan
        return { success: false, error: "Tidak ada perubahan yang diberikan untuk username atau password."};
    }

    await adminUsersCollection.updateOne(
      { _id: adminUser._id }, // Targetkan dokumen admin yang benar
      { $set: updateData }
    );

    // Hapus cookie sesi setelah kredensial diubah untuk memaksa login ulang
    cookies().delete(ADMIN_AUTH_COOKIE_NAME);
    
    revalidatePath("/admin/profile");
    revalidatePath("/login"); // Untuk memastikan halaman login direfresh jika ada perubahan sesi
    return { success: true };

  } catch (error) {
    console.error("Error in updateAdminCredentialsAction:", error);
    return { success: false, error: "Terjadi kesalahan server saat memperbarui kredensial." };
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  cookies().delete(ADMIN_AUTH_COOKIE_NAME);
  revalidatePath("/login");
  revalidatePath("/admin/profile"); // Revalidasi halaman profil juga
  revalidatePath("/"); // Revalidasi halaman utama
  return { success: true };
}

// Interface untuk data awal yang dibutuhkan halaman profil admin
export interface AdminProfileInitialData {
  skills: SkillData[];
  currentHeroImageUrl: string; // URL atau Data URI dari gambar profil saat ini
  currentCvUrl: string; // URL dari CV saat ini
}

// Fungsi untuk mengambil data awal untuk halaman profil admin
export async function getAdminProfileInitialData(): Promise<{ success: boolean; data?: AdminProfileInitialData; error?: string }> {
  try {
    const client: MongoClient = await clientPromise;
    // Menggunakan database default yang dikonfigurasi di MONGODB_URI
    const db = client.db();
    
    // Mengambil data keahlian dari koleksi 'skills'
    const skillsCollection = db.collection<SkillData>("skills");
    const skills = await skillsCollection.find({}).sort({ name: 1 }).toArray();
    // Konversi _id ObjectId ke string untuk serialisasi
    const mappedSkills = skills.map(s => ({ ...s, _id: s._id.toString() }));

    // Mengambil foto profil dari koleksi 'profile_settings'
    // Koleksi 'profile_settings' akan berada di dalam database default
    const profileSettingsCollection = db.collection<ProfileSettingsDocument>("profile_settings");
    const profileSettings = await profileSettingsCollection.findOne({}); // Ambil dokumen pengaturan tunggal
    
    let currentHeroImageUrl = "https://placehold.co/240x240.png?text=Profile"; // Default placeholder
    if (profileSettings && profileSettings.profileImageUri && profileSettings.profileImageUri.startsWith('data:image/')) {
      currentHeroImageUrl = profileSettings.profileImageUri;
    }
    
    // Path CV saat ini masih dianggap statis dari folder public/download
    let currentCvUrl = "/download/Wahyu_Pratomo-cv.pdf"; 
    // Anda bisa menambahkan logika di sini jika path CV juga disimpan di database

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

    