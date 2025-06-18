
"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import type { MongoClient, Collection, Document, ObjectId } from 'mongodb';
import { hashPassword, comparePassword, createSessionToken } from "@/lib/authUtils";

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

const loginInputSchema = z.object({
  username: z.string().min(1, { message: "Username tidak boleh kosong." }),
  password: z.string().min(1, { message: "Password tidak boleh kosong." }),
});

interface AdminUserDocument extends Document {
  _id: ObjectId;
  username: string;
  hashedPassword?: string;
  password?: string; 
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
      if (username === initialAdminUsername && password === initialAdminPassword) {
        const count = await adminUsersCollection.countDocuments();
        if (count === 0) { 
            const hashedPassword = await hashPassword(initialAdminPassword);
            const result = await adminUsersCollection.insertOne({
              username: initialAdminUsername,
              hashedPassword: hashedPassword,
            } as AdminUserDocument); 
            
             const insertedId = result.insertedId;
             if (!insertedId) {
                 return { success: false, error: "Gagal membuat pengguna admin awal setelah insert." };
             }
             adminUser = await adminUsersCollection.findOne({ _id: insertedId });

            if (!adminUser) {
                 return { success: false, error: "Gagal membuat pengguna admin awal." };
            }
        } else {
             return { success: false, error: "Username atau password salah." };
        }
      } else {
        return { success: false, error: "Username atau password salah." };
      }
    }

    if (adminUser && adminUser.password && !adminUser.hashedPassword) {
      const isLegacyPasswordMatch = (password === adminUser.password); 
      if(isLegacyPasswordMatch) {
        const newHashedPassword = await hashPassword(adminUser.password);
        await adminUsersCollection.updateOne(
          { _id: adminUser._id },
          { 
            $set: { 
              hashedPassword: newHashedPassword,
            }, 
            $unset: { password: "" } 
          }
        );
        adminUser.hashedPassword = newHashedPassword;
      } else {
        return { success: false, error: "Username atau password salah." };
      }
    }
    
    if (!adminUser || !adminUser.hashedPassword) {
        return { success: false, error: "Konfigurasi akun admin tidak lengkap atau username salah." };
    }

    const isPasswordValid = await comparePassword(password, adminUser.hashedPassword);

    if (!isPasswordValid) {
      return { success: false, error: "Username atau password salah." };
    }

    const token = await createSessionToken({ username: adminUser.username, sub: adminUser._id.toString() });

    cookies().set(ADMIN_AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2, 
      path: '/',
      sameSite: 'lax',
    });

    return { success: true };

  } catch (error) {
    console.error("Error in loginAction:", error);
    return { success: false, error: "Terjadi kesalahan pada server saat login." };
  }
}

    