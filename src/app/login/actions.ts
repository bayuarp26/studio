
"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document } from 'mongodb';
import { hashPassword, comparePassword, createSessionToken } from "@/lib/authUtils";

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

const loginInputSchema = z.object({
  username: z.string().min(1, { message: "Username tidak boleh kosong." }),
  password: z.string().min(1, { message: "Password tidak boleh kosong." }),
});

interface AdminUserDocument extends Document {
  username: string;
  hashedPassword?: string; // Make optional initially for transition
  password?: string; // For initial unhashed password, to be removed after hashing
}

const initialAdminUsername = "085156453246";
const initialAdminPassword = "wahyu-58321";

export async function loginAction(
  data: z.infer<typeof loginInputSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const validationResult = loginInputSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, error: firstError || "Data input tidak valid." };
    }

    const { username, password } = validationResult.data;

    const client: MongoClient = await clientPromise;
    const db = client.db(); 
    const adminUsersCollection: Collection<AdminUserDocument> = db.collection("admin_users");

    let adminUser = await adminUsersCollection.findOne({ username });

    if (!adminUser) {
      // Check if this is the first-time setup with hardcoded initial credentials
      if (username === initialAdminUsername && password === initialAdminPassword) {
        const hashedPassword = await hashPassword(initialAdminPassword);
        const result = await adminUsersCollection.insertOne({
          username: initialAdminUsername,
          hashedPassword: hashedPassword,
        });
        adminUser = await adminUsersCollection.findOne({ _id: result.insertedId });
        if (!adminUser) {
             return { success: false, error: "Gagal membuat pengguna admin awal." };
        }
      } else {
        return { success: false, error: "Username atau password salah." };
      }
    }

    // Ensure password field exists and is hashed
    if (adminUser.password && !adminUser.hashedPassword) {
      // This is for migrating an unhashed password (if it somehow existed)
      // In a real scenario, this unhashed 'password' field should not exist long-term.
      const isMatch = (password === adminUser.password); 
      if(isMatch) {
        const newHashedPassword = await hashPassword(adminUser.password);
        await adminUsersCollection.updateOne(
          { _id: adminUser._id },
          { $set: { hashedPassword: newHashedPassword }, $unset: { password: "" } }
        );
        adminUser.hashedPassword = newHashedPassword; // Update in-memory object
      } else {
        return { success: false, error: "Username atau password salah." };
      }
    }
    
    if (!adminUser.hashedPassword) {
        // This case should ideally not be reached if the above logic is sound
        return { success: false, error: "Konfigurasi akun admin tidak lengkap." };
    }


    const isPasswordValid = await comparePassword(password, adminUser.hashedPassword);

    if (!isPasswordValid) {
      return { success: false, error: "Username atau password salah." };
    }

    // Create session token
    const token = await createSessionToken({ username: adminUser.username, sub: adminUser._id.toString() });

    cookies().set(ADMIN_AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });

    return { success: true };

  } catch (error) {
    console.error("Error in loginAction:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat login." };
  }
  // No explicit redirect here, client-side will handle it based on success status.
}
