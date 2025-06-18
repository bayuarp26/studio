
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
interface AdminUserDocument extends Document {
  _id: ObjectId;
  username: string;
  hashedPassword?: string;
}

// Interface untuk dokumen pengaturan profil di database
// Dokumen ini akan disimpan dalam koleksi 'profile_settings' di dalam database default (misal: portofolioDB)
interface ProfileSettingsDocument extends Document {
  _id?: ObjectId; 
  profileImageUri?: string; // Menyimpan Data URI dari gambar profil
  cvUrl?: string; // Menyimpan path publik ke file CV
}


export async function updateProfileImageAction(
  imageDataUri: string
): Promise<{ success: boolean; error?: string }> {
  console.log("updateProfileImageAction: Mulai proses.");
  try {
    // Verifikasi sesi admin
    const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
    if (!tokenCookie) {
      console.error("updateProfileImageAction: Error - Tidak terautentikasi.");
      return { success: false, error: "Tidak terautentikasi." };
    }
    console.log("updateProfileImageAction: Sesi admin terverifikasi.");

    // Validasi input imageDataUri
    const validationResult = heroImageDataUriSchema.safeParse(imageDataUri);
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      console.error("updateProfileImageAction: Error validasi Data URI -", firstError);
      return { success: false, error: firstError || "Data URI gambar tidak valid." };
    }
    const validatedDataUri = validationResult.data;
    console.log("updateProfileImageAction: Validasi Data URI berhasil.");
    
    const client: MongoClient = await clientPromise;
    const db = client.db(); // Menggunakan database default (misal: portofolioDB)
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings"); // Koleksi 'profile_settings' di dalam portofolioDB

    console.log("updateProfileImageAction: Mencoba menyimpan URI gambar profil ke database.");
    await profileSettingsCollection.updateOne(
      {}, 
      { $set: { profileImageUri: validatedDataUri } },
      { upsert: true } 
    );
    console.log("updateProfileImageAction: URI gambar profil berhasil disimpan ke database.");
    
    revalidatePath('/'); 
    revalidatePath('/admin/profile'); 
    console.log("updateProfileImageAction: Path direvalidasi. Proses selesai.");
    return { success: true };

  } catch (error: any) {
    console.error("updateProfileImageAction: Terjadi kesalahan pada server:", error);
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
  console.log(`addSkillAction: Mulai proses untuk skill "${name}".`);
  try {
    // Verifikasi sesi admin
    const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
    if (!tokenCookie) {
      console.error("addSkillAction: Error - Tidak terautentikasi.");
      return { success: false, error: "Tidak terautentikasi." };
    }
    console.log("addSkillAction: Sesi admin terverifikasi.");

    const validationResult = skillNameSchema.safeParse(name);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.flatten().formErrors[0] || "Nama keahlian tidak valid.";
      console.error("addSkillAction: Error validasi nama skill -", errorMsg);
      return { success: false, error: errorMsg };
    }

    const validatedName = validationResult.data;
    console.log("addSkillAction: Validasi nama skill berhasil.");

    const client: MongoClient = await clientPromise;
    const db = client.db(); // Menggunakan database default (misal: portofolioDB)
    const skillsCollection: Collection<Document> = db.collection("skills"); // Koleksi 'skills' di dalam portofolioDB

    console.log(`addSkillAction: Mencari skill eksisting dengan nama "${validatedName}".`);
    const existingSkill = await skillsCollection.findOne({ name: { $regex: `^${validatedName}$`, $options: 'i' } });
    if (existingSkill) {
      const errorMsg = `Keahlian "${validatedName}" sudah ada.`;
      console.warn("addSkillAction:", errorMsg);
      return { success: false, error: errorMsg };
    }
    console.log("addSkillAction: Skill belum ada, melanjutkan penambahan.");

    const result = await skillsCollection.insertOne({ name: validatedName, createdAt: new Date() });

    if (result.insertedId) {
      console.log(`addSkillAction: Skill "${validatedName}" berhasil ditambahkan dengan ID: ${result.insertedId}.`);
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
      console.error("addSkillAction: Gagal menyimpan keahlian ke database (tidak ada insertedId).");
      return { success: false, error: "Gagal menyimpan keahlian ke database." };
    }
  } catch (error: any) {
    console.error("addSkillAction: Terjadi kesalahan pada server:", error);
    return { success: false, error: `Terjadi kesalahan pada server saat menambahkan keahlian: ${error.message || 'Kesalahan tidak diketahui'}` };
  }
}

export async function deleteSkillAction(
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`deleteSkillAction: Mulai proses untuk skill ID "${skillId}".`);
  // Verifikasi sesi admin
  const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
  if (!tokenCookie) {
    console.error("deleteSkillAction: Error - Tidak terautentikasi.");
    return { success: false, error: "Tidak terautentikasi." };
  }
  console.log("deleteSkillAction: Sesi admin terverifikasi.");

  if (!skillId || typeof skillId !== 'string') {
    console.error("deleteSkillAction: Error - ID keahlian tidak valid (bukan string atau kosong).");
    return { success: false, error: "ID keahlian tidak valid." };
  }

  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(); // Menggunakan database default (misal: portofolioDB)
    const skillsCollection: Collection<Document> = db.collection("skills"); // Koleksi 'skills' di dalam portofolioDB
    
    const { ObjectId } = require('mongodb'); 
    if (!ObjectId.isValid(skillId)) {
        console.error(`deleteSkillAction: Error - Format ID keahlian tidak valid: "${skillId}".`);
        return { success: false, error: "Format ID keahlian tidak valid." };
    }
    console.log(`deleteSkillAction: Mencoba menghapus skill dengan ID: ${skillId}.`);
    const result = await skillsCollection.deleteOne({ _id: new ObjectId(skillId) });

    if (result.deletedCount === 1) {
      console.log(`deleteSkillAction: Skill dengan ID "${skillId}" berhasil dihapus.`);
      revalidatePath("/");
      revalidatePath("/admin/profile");
      return { success: true };
    } else {
      console.warn(`deleteSkillAction: Keahlian dengan ID "${skillId}" tidak ditemukan atau gagal dihapus (deletedCount: ${result.deletedCount}).`);
      return { success: false, error: "Keahlian tidak ditemukan atau gagal dihapus." };
    }
  } catch (error: any) {
    console.error("deleteSkillAction: Terjadi kesalahan pada server:", error);
    return { success: false, error: `Terjadi kesalahan pada server saat menghapus keahlian: ${error.message || 'Kesalahan tidak diketahui'}` };
  }
}

export async function updateCVAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  console.log("updateCVAction: Mulai proses pembaruan CV.");
  try {
    // Verifikasi sesi admin
    const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
    if (!tokenCookie) {
      console.error("updateCVAction: Error - Tidak terautentikasi.");
      return { success: false, error: "Tidak terautentikasi." };
    }
    console.log("updateCVAction: Sesi admin terverifikasi.");

    const cvFile = formData.get("cvFile") as File | null;

    if (!cvFile) {
      console.error("updateCVAction: Error - File CV tidak ditemukan dalam FormData.");
      return { success: false, error: "File CV tidak ditemukan." };
    }
    console.log(`updateCVAction: File CV diterima: ${cvFile.name}, Tipe: ${cvFile.type}, Ukuran: ${cvFile.size}`);

    const validationResult = cvFileSchema.safeParse(cvFile);
    if (!validationResult.success) {
      const firstError = validationResult.error.flatten().formErrors[0];
      console.error("updateCVAction: Error validasi file CV -", firstError);
      return { success: false, error: firstError || "File CV tidak valid." };
    }
    console.log("updateCVAction: Validasi file CV berhasil.");

    const validatedFile = validationResult.data;
    const newFilename = "Wahyu_Pratomo-cv.pdf"; 
    const publicDir = path.join(process.cwd(), 'public');
    const downloadDir = path.join(publicDir, 'download');
    const cvFilePath = path.join(downloadDir, newFilename);
    const publicCvUrl = `/download/${newFilename}`; // Path publik CV

    console.log(`updateCVAction: Path direktori public: ${publicDir}`);
    console.log(`updateCVAction: Path direktori download: ${downloadDir}`);
    console.log(`updateCVAction: Path file CV tujuan: ${cvFilePath}`);
    console.log(`updateCVAction: URL CV publik: ${publicCvUrl}`);

    try {
      console.log(`updateCVAction: Mencoba membuat direktori: ${downloadDir} jika belum ada.`);
      await fs.mkdir(downloadDir, { recursive: true });
      console.log(`updateCVAction: Direktori ${downloadDir} berhasil dibuat atau sudah ada.`);
    } catch (mkdirError: any) {
      console.error(`updateCVAction: Gagal membuat direktori ${downloadDir}:`, mkdirError);
      return { success: false, error: `Gagal menyiapkan direktori penyimpanan CV: ${mkdirError.message}` };
    }

    try {
      console.log(`updateCVAction: Mencoba menulis file ke: ${cvFilePath}`);
      const bytes = await validatedFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(cvFilePath, buffer);
      console.log(`updateCVAction: File CV berhasil ditulis ke ${cvFilePath}.`);
    } catch (writeFileError: any) {
      console.error(`updateCVAction: Gagal menulis file CV ke ${cvFilePath}:`, writeFileError);
      // Pertimbangkan untuk tidak melanjutkan jika file gagal ditulis, tergantung kebutuhan
      // Jika URL tetap disimpan ke DB meski file gagal ditulis, bisa jadi ada CV link yang rusak
      return { success: false, error: `Gagal menyimpan file CV secara fisik: ${writeFileError.message}` };
    }

    // Simpan URL publik CV ke database
    const client: MongoClient = await clientPromise;
    const db = client.db(); // Menggunakan database default (misal: portofolioDB)
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings"); // Koleksi 'profile_settings' di dalam portofolioDB

    console.log("updateCVAction: Mencoba menyimpan URL CV ke database.");
    await profileSettingsCollection.updateOne(
      {}, 
      { $set: { cvUrl: publicCvUrl } },
      { upsert: true } 
    );
    console.log("updateCVAction: URL CV berhasil disimpan ke database.");

    revalidatePath('/'); 
    revalidatePath('/admin/profile'); 
    console.log("updateCVAction: Path berhasil direvalidasi. Proses pembaruan CV selesai.");
    return { success: true };

  } catch (error: any) { // Tangkap semua jenis error di blok utama
    console.error("updateCVAction: Terjadi kesalahan umum pada server saat memperbarui CV:", error);
    return { success: false, error: `Terjadi kesalahan pada server saat memperbarui CV: ${error.message || 'Kesalahan tidak diketahui'}` };
  }
}

export async function updateAdminCredentialsAction(
  data: z.infer<typeof adminCredentialsSchema>
): Promise<{ success: boolean; error?: string }> {
   console.log("updateAdminCredentialsAction: Mulai proses.");
   const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
   if (!tokenCookie) {
     console.error("updateAdminCredentialsAction: Error - Sesi tidak ditemukan.");
     return { success: false, error: "Sesi tidak ditemukan. Silakan login kembali." };
   }
   console.log("updateAdminCredentialsAction: Sesi admin terverifikasi.");
  
  try {
    const validationResult = adminCredentialsSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      console.error("updateAdminCredentialsAction: Error validasi input -", firstError);
      return { success: false, error: firstError || "Data input tidak valid." };
    }
    console.log("updateAdminCredentialsAction: Validasi input berhasil.");

    const { currentPassword, newUsername, newPassword } = validationResult.data;

    const client: MongoClient = await clientPromise;
    const db = client.db(); // Menggunakan database default (misal: portofolioDB)
    const adminUsersCollection: Collection<AdminUserDocument> = db.collection("admin_users"); // Koleksi 'admin_users' di dalam portofolioDB
    
    console.log("updateAdminCredentialsAction: Mencari pengguna admin.");
    const adminUser = await adminUsersCollection.findOne({}); 

    if (!adminUser || !adminUser.hashedPassword) {
      console.error("updateAdminCredentialsAction: Error - Pengguna admin tidak ditemukan atau konfigurasi salah (tidak ada hashedPassword).");
      return { success: false, error: "Pengguna admin tidak ditemukan atau konfigurasi salah." };
    }
    console.log("updateAdminCredentialsAction: Pengguna admin ditemukan.");

    const isCurrentPasswordValid = await comparePassword(currentPassword, adminUser.hashedPassword);
    if (!isCurrentPasswordValid) {
      console.warn("updateAdminCredentialsAction: Password saat ini salah.");
      return { success: false, error: "Password saat ini salah." };
    }
    console.log("updateAdminCredentialsAction: Password saat ini valid.");

    const updateData: Partial<Pick<AdminUserDocument, 'username' | 'hashedPassword'>> = {};
    if (newUsername && newUsername.trim() !== "") {
      updateData.username = newUsername.trim();
      console.log(`updateAdminCredentialsAction: Username baru akan diupdate menjadi: "${updateData.username}".`);
    }
    if (newPassword && newPassword.trim() !== "") {
      updateData.hashedPassword = await hashPassword(newPassword.trim());
      console.log("updateAdminCredentialsAction: Password baru akan diupdate (hash baru dibuat).");
    }

    if (Object.keys(updateData).length === 0) {
        console.warn("updateAdminCredentialsAction: Tidak ada perubahan yang diberikan untuk username atau password.");
        return { success: false, error: "Tidak ada perubahan yang diberikan untuk username atau password."};
    }

    console.log("updateAdminCredentialsAction: Melakukan update kredensial di database.");
    await adminUsersCollection.updateOne(
      { _id: adminUser._id }, 
      { $set: updateData }
    );
    console.log("updateAdminCredentialsAction: Kredensial berhasil diupdate di database.");

    cookies().delete(ADMIN_AUTH_COOKIE_NAME);
    console.log("updateAdminCredentialsAction: Cookie sesi admin dihapus (logout).");
    
    revalidatePath("/admin/profile");
    revalidatePath("/login"); 
    console.log("updateAdminCredentialsAction: Path direvalidasi. Proses selesai.");
    return { success: true };

  } catch (error: any) {
    console.error("updateAdminCredentialsAction: Terjadi kesalahan server:", error);
    return { success: false, error: `Terjadi kesalahan server saat memperbarui kredensial: ${error.message || 'Kesalahan tidak diketahui'}` };
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  console.log("logoutAction: Mulai proses logout.");
  cookies().delete(ADMIN_AUTH_COOKIE_NAME);
  revalidatePath("/login");
  revalidatePath("/admin/profile"); 
  revalidatePath("/"); 
  console.log("logoutAction: Cookie sesi admin dihapus dan path direvalidasi. Logout berhasil.");
  return { success: true };
}

// Interface untuk data awal yang dibutuhkan halaman profil admin
export interface AdminProfileInitialData {
  skills: SkillData[];
  currentHeroImageUrl: string; 
  currentCvUrl: string; 
}

// Fungsi untuk mengambil data awal untuk halaman profil admin
export async function getAdminProfileInitialData(): Promise<{ success: boolean; data?: AdminProfileInitialData; error?: string }> {
  console.log("getAdminProfileInitialData: Mulai mengambil data awal profil admin.");
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(); // Menggunakan database default (misal: portofolioDB)
    
    const skillsCollection = db.collection<SkillData>("skills"); // Koleksi 'skills' di dalam portofolioDB
    const skills = await skillsCollection.find({}).sort({ name: 1 }).toArray();
    const mappedSkills = skills.map(s => ({ ...s, _id: s._id.toString() }));
    console.log(`getAdminProfileInitialData: ${mappedSkills.length} skill ditemukan.`);

    const profileSettingsCollection = db.collection<ProfileSettingsDocument>("profile_settings"); // Koleksi 'profile_settings' di dalam portofolioDB
    const profileSettings = await profileSettingsCollection.findOne({}); 
    console.log("getAdminProfileInitialData: Pengaturan profil diambil:", profileSettings ? "Ada data" : "Tidak ada data/kosong");
    
    let currentHeroImageUrl = "https://placehold.co/240x240.png?text=Profile"; 
    if (profileSettings && profileSettings.profileImageUri && profileSettings.profileImageUri.startsWith('data:image/')) {
      currentHeroImageUrl = profileSettings.profileImageUri;
      console.log("getAdminProfileInitialData: URI gambar profil dari DB digunakan.");
    } else {
      console.log("getAdminProfileInitialData: URI gambar profil dari DB tidak ada atau tidak valid, menggunakan placeholder.");
    }
    
    let currentCvUrl = "/download/Wahyu_Pratomo-cv.pdf"; // Default jika tidak ada di DB
    if (profileSettings && profileSettings.cvUrl) {
      currentCvUrl = profileSettings.cvUrl;
      console.log(`getAdminProfileInitialData: URL CV dari DB digunakan: "${currentCvUrl}".`);
    } else {
      console.log("getAdminProfileInitialData: URL CV dari DB tidak ada, menggunakan default.");
    }
    
    console.log("getAdminProfileInitialData: Pengambilan data awal profil admin berhasil.");
    return { 
      success: true, 
      data: { 
        skills: mappedSkills, 
        currentHeroImageUrl, 
        currentCvUrl 
      } 
    };

  } catch (error: any) {
    console.error("getAdminProfileInitialData: Gagal mengambil data awal profil admin:", error);
    return { success: false, error: `Gagal mengambil data awal profil admin: ${error.message || 'Kesalahan tidak diketahui'}` };
  }
}


    