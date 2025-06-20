
"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document, ObjectId } from 'mongodb';
import { hashPassword, comparePassword, createSessionToken } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

const loginInputSchema = z.object({
  username: z.string().min(1, { message: "Username tidak boleh kosong." }),
  password: z.string().min(1, { message: "Password tidak boleh kosong." }),
});

interface AdminUserDocument extends Document {
  _id: ObjectId;
  username: string;
  hashedPassword?: string;
  password?: string; // For legacy password migration
}

// Interface untuk dokumen pengaturan profil, hanya untuk field yang diupdate di sini
interface ProfileSettingsUpdate {
  isAppUnderConstruction: boolean;
  constructionModeActiveUntil: Date | null;
}


const initialAdminUsername = "085156453246";
const initialAdminPassword = "wahyu-58321";

export async function loginAction(
  data: z.infer<typeof loginInputSchema>
): Promise<{ success: boolean; error?: string }> {
  console.time("loginAction_total");
  try {
    console.time("loginAction_validation");
    const validationResult = loginInputSchema.safeParse(data);
    console.timeEnd("loginAction_validation");

    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      console.warn("loginAction: Validation failed", firstError);
      console.timeEnd("loginAction_total");
      return { success: false, error: firstError || "Data input tidak valid." };
    }

    const { username, password } = validationResult.data;
    console.log(`loginAction: Attempting login for user: ${username}`);

    console.time("loginAction_dbConnection");
    const client: MongoClient = await clientPromise;
    const db = client.db();
    const adminUsersCollection: Collection<AdminUserDocument> = db.collection("admin_users");
    const profileSettingsCollection: Collection<Document> = db.collection("profile_settings"); 
    console.timeEnd("loginAction_dbConnection");

    console.time("loginAction_findUser");
    let adminUser = await adminUsersCollection.findOne({ username });
    console.timeEnd("loginAction_findUser");

    if (!adminUser) {
      console.log(`loginAction: User ${username} not found. Checking for initial admin.`);
      if (username === initialAdminUsername && password === initialAdminPassword) {
        console.time("loginAction_initialUser_count");
        const count = await adminUsersCollection.countDocuments();
        console.timeEnd("loginAction_initialUser_count");
        console.log(`loginAction: Initial admin check - user count: ${count}`);

        if (count === 0) {
            console.log("loginAction: No admin users found. Creating initial admin.");
            console.time("loginAction_initialUser_hash");
            const hashedPassword = await hashPassword(initialAdminPassword);
            console.timeEnd("loginAction_initialUser_hash");

            console.time("loginAction_initialUser_insert");
            const result = await adminUsersCollection.insertOne({
              username: initialAdminUsername,
              hashedPassword: hashedPassword,
            } as AdminUserDocument); 
            console.timeEnd("loginAction_initialUser_insert");
             console.log(`loginAction: Initial admin user created with id: ${result.insertedId}`);

             const insertedId = result.insertedId;
             if (!insertedId) {
                 console.error("loginAction: Failed to create initial admin user after insert (no insertedId).");
                 console.timeEnd("loginAction_total");
                 return { success: false, error: "Gagal membuat pengguna admin awal setelah insert." };
             }

             console.time("loginAction_initialUser_findAfterInsert");
             adminUser = await adminUsersCollection.findOne({ _id: insertedId });
             console.timeEnd("loginAction_initialUser_findAfterInsert");

            if (!adminUser) {
                 console.error("loginAction: Failed to retrieve initial admin user after creation.");
                 console.timeEnd("loginAction_total");
                 return { success: false, error: "Gagal membuat pengguna admin awal." };
            }
            console.log("loginAction: Initial admin user successfully created and retrieved.");
        } else {
             console.warn(`loginAction: Initial admin credentials used, but ${count} admin users already exist. Denying login.`);
             console.timeEnd("loginAction_total");
             return { success: false, error: "Username atau password salah." };
        }
      } else {
        console.warn(`loginAction: User ${username} not found and not initial admin. Denying login.`);
        console.timeEnd("loginAction_total");
        return { success: false, error: "Username atau password salah." };
      }
    }

    if (adminUser && adminUser.password && !adminUser.hashedPassword) {
      console.log(`loginAction: User ${username} found with legacy password. Attempting migration.`);
      const isLegacyPasswordMatch = (password === adminUser.password);
      if(isLegacyPasswordMatch) {
        console.time("loginAction_legacyMigration_hash");
        const newHashedPassword = await hashPassword(adminUser.password);
        console.timeEnd("loginAction_legacyMigration_hash");

        console.time("loginAction_legacyMigration_update");
        await adminUsersCollection.updateOne(
          { _id: adminUser._id },
          {
            $set: {
              hashedPassword: newHashedPassword,
            },
            $unset: { password: "" } 
          }
        );
        console.timeEnd("loginAction_legacyMigration_update");
        adminUser.hashedPassword = newHashedPassword; 
        console.log(`loginAction: Legacy password for ${username} migrated successfully.`);
      } else {
        console.warn(`loginAction: Legacy password for ${username} did not match. Denying login.`);
        console.timeEnd("loginAction_total");
        return { success: false, error: "Username atau password salah." };
      }
    }

    if (!adminUser || !adminUser.hashedPassword) {
        console.error(`loginAction: Admin user ${username} has incomplete configuration (missing hashedPassword). Denying login.`);
        console.timeEnd("loginAction_total");
        return { success: false, error: "Konfigurasi akun admin tidak lengkap atau username salah." };
    }

    console.time("loginAction_passwordCompare");
    const isPasswordValid = await comparePassword(password, adminUser.hashedPassword);
    console.timeEnd("loginAction_passwordCompare");

    if (!isPasswordValid) {
      console.warn(`loginAction: Invalid password for user ${username}. Denying login.`);
      console.timeEnd("loginAction_total");
      return { success: false, error: "Username atau password salah." };
    }
    console.log(`loginAction: Password valid for user ${username}.`);

    console.time("loginAction_tokenCreation");
    const token = await createSessionToken({ username: adminUser.username, sub: adminUser._id.toString() });
    console.timeEnd("loginAction_tokenCreation");
    console.log(`loginAction: Session token created for ${username}.`);

    console.time("loginAction_setCookie");
    cookies().set(ADMIN_AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
      sameSite: 'lax',
    });
    console.timeEnd("loginAction_setCookie");

    console.time("loginAction_updateProfileSettings");
    try {
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000); 
        await profileSettingsCollection.updateOne(
          {}, 
          { $set: { isAppUnderConstruction: true, constructionModeActiveUntil: fiveMinutesFromNow } },
          { upsert: true }
        );
        console.log(`loginAction: Profile settings updated - isAppUnderConstruction: true, activeUntil: ${fiveMinutesFromNow.toISOString()}`);
    } catch (dbError: any) {
        console.error("loginAction: Failed to update profile_settings in DB:", dbError.message);
        // Potentially decide if this is a critical failure for login. For now, just log.
    }
    console.timeEnd("loginAction_updateProfileSettings");

    console.time("loginAction_revalidatePaths");
    revalidatePath('/'); 
    revalidatePath('/admin/profile'); 
    console.timeEnd("loginAction_revalidatePaths");
    console.log("loginAction: Paths / and /admin/profile revalidated.");

    console.log(`loginAction: Login successful for user ${username}.`);
    console.timeEnd("loginAction_total");
    return { success: true };

  } catch (error: any) {
    console.error("loginAction: Uncaught error during login process:", error.message, error.stack);
    console.timeEnd("loginAction_total");
    return { success: false, error: `Terjadi kesalahan pada server saat login: ${error.message || 'Kesalahan tidak diketahui'}` };
  }
}
