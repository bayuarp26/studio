
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document, ObjectId } from 'mongodb';
import type { SkillData } from "@/app/page";
import { cookies } from "next/headers";
import { hashPassword, comparePassword } from "@/lib/authUtils";

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

const heroImageDataUriSchema = z.string().refine(val => val.startsWith('data:image/'), {
  message: "URL Gambar harus berupa Data URI yang valid (diawali dengan 'data:image/').",
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

const cvDataUriSchema = z.string().refine(val => val.startsWith('data:application/pdf;base64,'), {
  message: "CV harus berupa Data URI PDF yang valid.",
});

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
}

interface ProfileSettingsDocument extends Document {
  _id?: ObjectId;
  profileImageUri?: string;
  cvDataUri?: string;
  isAppUnderConstruction?: boolean;
  constructionModeActiveUntil?: Date | null;
}


export async function updateProfileImageAction(
  imageDataUri: string
): Promise<{ success: boolean; error?: string }> {
  console.log("updateProfileImageAction: Mulai proses.");
  try {
    const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
    if (!tokenCookie) {
      console.error("updateProfileImageAction: Error - Tidak terautentikasi.");
      return { success: false, error: "Tidak terautentikasi." };
    }
    console.log("updateProfileImageAction: Sesi admin terverifikasi.");

    const validationResult = heroImageDataUriSchema.safeParse(imageDataUri);
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      console.error("updateProfileImageAction: Error validasi Data URI -", firstError);
      return { success: false, error: firstError || "Data URI gambar tidak valid." };
    }
    const validatedDataUri = validationResult.data;
    console.log("updateProfileImageAction: Validasi Data URI berhasil.");

    const client: MongoClient = await clientPromise;
    const db = client.db(); 
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");

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
    const db = client.db(); 
    const skillsCollection: Collection<Document> = db.collection("skills");

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
    const db = client.db(); 
    const skillsCollection: Collection<Document> = db.collection("skills");

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
): Promise<{ success: boolean; error?: string; newCvDataUri?: string }> {
  console.log("updateCVAction: Mulai proses pembaruan CV dengan Data URI.");
  try {
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

    const fileValidationResult = cvFileSchema.safeParse(cvFile);
    if (!fileValidationResult.success) {
      const firstError = fileValidationResult.error.flatten().formErrors[0];
      console.error("updateCVAction: Error validasi file CV (sebelum Data URI) -", firstError);
      return { success: false, error: firstError || "File CV tidak valid." };
    }
    console.log("updateCVAction: Validasi file CV (sebelum Data URI) berhasil.");

    const bytes = await cvFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const cvDataUriString = `data:${cvFile.type};base64,${buffer.toString('base64')}`;
    console.log("updateCVAction: File CV berhasil dikonversi ke Data URI (potongan):", cvDataUriString.substring(0, 100) + "...");

    const dataUriValidationResult = cvDataUriSchema.safeParse(cvDataUriString);
    if (!dataUriValidationResult.success) {
      const firstError = dataUriValidationResult.error.flatten().formErrors[0];
      console.error("updateCVAction: Error validasi Data URI CV -", firstError);
      return { success: false, error: firstError || "Data URI CV yang dihasilkan tidak valid." };
    }
    const validatedCvDataUri = dataUriValidationResult.data;
    console.log("updateCVAction: Validasi Data URI CV berhasil.");

    const client: MongoClient = await clientPromise;
    const db = client.db(); 
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");

    console.log("updateCVAction: Mencoba menyimpan Data URI CV ke database.");
    await profileSettingsCollection.updateOne(
      {},
      { $set: { cvDataUri: validatedCvDataUri } }, 
      { upsert: true }
    );
    console.log("updateCVAction: Data URI CV berhasil disimpan ke database.");

    revalidatePath('/');
    revalidatePath('/admin/profile');
    console.log("updateCVAction: Path berhasil direvalidasi. Proses pembaruan CV selesai.");
    return { success: true, newCvDataUri: validatedCvDataUri };

  } catch (error: any) { 
    console.error("updateCVAction: Terjadi kesalahan umum pada server saat memperbarui CV:", error);
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
    const db = client.db(); 
    const adminUsersCollection: Collection<AdminUserDocument> = db.collection("admin_users");

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

    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");
    await profileSettingsCollection.updateOne(
      {},
      { $set: { isAppUnderConstruction: false, constructionModeActiveUntil: null } },
      { upsert: true } 
    );
    console.log("updateAdminCredentialsAction: Mode 'isAppUnderConstruction' dinonaktifkan dan 'constructionModeActiveUntil' dihapus setelah perubahan kredensial.");


    revalidatePath("/admin/profile");
    revalidatePath("/login");
    revalidatePath("/"); 
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

  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");
    await profileSettingsCollection.updateOne(
      {}, 
      { $set: { isAppUnderConstruction: false, constructionModeActiveUntil: null } }, // DRP: Clear on logout
      { upsert: true } 
    );
    console.log("logoutAction: Mode 'isAppUnderConstruction' dinonaktifkan dan 'constructionModeActiveUntil' dihapus.");
  } catch (dbError) {
    console.error("logoutAction: Gagal menonaktifkan mode 'isAppUnderConstruction' atau menghapus 'constructionModeActiveUntil' di DB:", dbError);
  }

  revalidatePath("/login");
  revalidatePath("/admin/profile");
  revalidatePath("/"); 
  console.log("logoutAction: Cookie sesi admin dihapus dan path direvalidasi. Logout berhasil.");
  return { success: true };
}

export interface AdminProfileInitialData {
  skills: SkillData[];
  currentHeroImageUrl: string;
  currentCvUrl: string; 
}

export async function getAdminProfileInitialData(): Promise<{ success: boolean; data?: AdminProfileInitialData; error?: string }> {
  console.log("getAdminProfileInitialData: Mulai mengambil data awal profil admin.");
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db(); 

    const skillsCollection = db.collection<SkillData>("skills");
    const skills = await skillsCollection.find({}).sort({ name: 1 }).toArray();
    const mappedSkills = skills.map(s => ({ ...s, _id: s._id.toString() }));
    console.log(`getAdminProfileInitialData: ${mappedSkills.length} skill ditemukan.`);

    const settingsResult = await getProfileSettingsDataInternal(db); 

    let currentHeroImageUrl = "https://placehold.co/240x240.png";
    if (settingsResult.profileImageUri && settingsResult.profileImageUri.startsWith('data:image/')) {
      currentHeroImageUrl = settingsResult.profileImageUri;
      console.log("getAdminProfileInitialData: URI gambar profil dari DB digunakan.");
    } else {
      console.log("getAdminProfileInitialData: URI gambar profil default digunakan.");
    }


    let currentCvDataUri = ""; 
    if (settingsResult.cvDataUri && settingsResult.cvDataUri.startsWith('data:application/pdf;base64,')) {
      currentCvDataUri = settingsResult.cvDataUri;
      console.log("getAdminProfileInitialData: Data URI CV dari DB digunakan.");
    } else {
      console.log("getAdminProfileInitialData: Tidak ada Data URI CV dari DB atau format salah.");
    }
    
    console.log("getAdminProfileInitialData: Pengambilan data awal profil admin berhasil.");
    return {
      success: true,
      data: {
        skills: mappedSkills,
        currentHeroImageUrl,
        currentCvUrl: currentCvDataUri
      }
    };

  } catch (error: any) {
    console.error("getAdminProfileInitialData: Gagal mengambil data awal profil admin:", error);
    return { success: false, error: `Gagal mengambil data awal profil admin: ${error.message || 'Kesalahan tidak diketahui'}` };
  }
}


async function getProfileSettingsDataInternal(db: ReturnType<MongoClient['db']>): Promise<{
  profileImageUri?: string;
  cvDataUri?: string;
  isAppUnderConstruction: boolean;
}> {
  const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");
  let settings = await profileSettingsCollection.findOne({});
  
  console.log("getProfileSettingsDataInternal: Pengaturan profil diambil:", settings ? "Ada data" : "Tidak ada data/Kosong");

  let effectiveIsUnderConstruction = settings?.isAppUnderConstruction ?? false;
  const activeUntil = settings?.constructionModeActiveUntil;

  if (effectiveIsUnderConstruction && activeUntil && new Date(activeUntil) < new Date()) {
    console.log("getProfileSettingsDataInternal: Mode 'under construction' kedaluwarsa. Menonaktifkan di DB.");
    effectiveIsUnderConstruction = false;
    await profileSettingsCollection.updateOne(
      {},
      { $set: { isAppUnderConstruction: false, constructionModeActiveUntil: null } }, // DRP: Auto-reset
      { upsert: true } // upsert true untuk kasus dimana dokumen belum ada sama sekali
    );
    // settings akan tetap berisi data lama setelah update ini, kecuali di-refetch.
    // Untuk return value, kita gunakan effectiveIsUnderConstruction yang sudah dikoreksi.
  } else if (effectiveIsUnderConstruction && activeUntil) {
    console.log(`getProfileSettingsDataInternal: Mode 'under construction' aktif hingga ${new Date(activeUntil).toISOString()}.`);
  } else if (effectiveIsUnderConstruction && !activeUntil) {
    console.warn("getProfileSettingsDataInternal: Mode 'under construction' aktif tapi tidak ada 'constructionModeActiveUntil'. Ini seharusnya tidak terjadi. Mempertimbangkan sebagai aktif.");
  }


  return {
    profileImageUri: settings?.profileImageUri,
    cvDataUri: settings?.cvDataUri,
    isAppUnderConstruction: effectiveIsUnderConstruction,
  };
}


export async function getPublicProfileSettings(): Promise<{
  profileImageUri?: string;
  cvDataUri?: string;
  isAppUnderConstruction: boolean;
}> {
  console.log("getPublicProfileSettings: Mulai mengambil data pengaturan profil untuk halaman publik.");
  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    return await getProfileSettingsDataInternal(db);
  } catch (error: any) {
    console.error("getPublicProfileSettings: Gagal mengambil data pengaturan profil:", error);
    return { isAppUnderConstruction: false }; // Default jika ada error
  }
}


export async function refreshAdminActivityAction(): Promise<{ success: boolean; error?: string }> {
  const tokenCookie = cookies().get(ADMIN_AUTH_COOKIE_NAME);
  if (!tokenCookie) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  try {
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const profileSettingsCollection: Collection<ProfileSettingsDocument> = db.collection("profile_settings");

    const newActiveUntil = new Date(Date.now() + 5 * 60 * 1000); // DRP: Perpanjang 5 menit dari sekarang

    await profileSettingsCollection.updateOne(
      {}, 
      { $set: { constructionModeActiveUntil: newActiveUntil } }, // Heartbeat untuk DRP
      { upsert: true } 
    );
    // console.log("refreshAdminActivityAction: Admin activity refreshed, constructionModeActiveUntil updated.");
    return { success: true };
  } catch (error: any) {
    console.error("refreshAdminActivityAction: Error refreshing admin activity:", error);
    return { success: false, error: "Gagal menyegarkan timestamp aktivitas admin." };
  }
}
