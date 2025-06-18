
import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

const saltRounds = 10;

// KRITIKAL UNTUK DEPLOYMENT (MISALNYA VERCEL):
// Pastikan variabel lingkungan JWT_SECRET_KEY telah diatur dengan BENAR
// di pengaturan Environment Variables platform hosting Anda (misalnya Vercel)
// DAN di file .env.local Anda untuk pengembangan lokal.
// Ini harus berupa string acak yang panjang (minimal 32 karakter) dan kuat untuk keamanan.
//
// CARA MEMBUAT JWT_SECRET_KEY YANG KUAT:
// Anda bisa menggunakan OpenSSL atau Node.js crypto.
// Contoh menggunakan Node.js (jalankan di terminal Node.js):
//   require('crypto').randomBytes(32).toString('hex')
//   (Ini akan menghasilkan string heksadesimal acak sepanjang 64 karakter)
// Salin hasilnya dan gunakan sebagai nilai JWT_SECRET_KEY.
//
// LOKASI PENYIMPANAN:
// 1. File .env.local (di root proyek, JANGAN di-commit ke Git):
//    JWT_SECRET_KEY=kunci_rahasia_panjang_anda_disini
// 2. Pengaturan Environment Variables di Vercel (atau platform hosting lainnya):
//    Name: JWT_SECRET_KEY
//    Value: kunci_rahasia_panjang_anda_disini
//
// Kegagalan mengatur ini dengan benar akan menyebabkan error saat pembuatan atau verifikasi token.
const JWT_SECRET_KEY_STRING = process.env.JWT_SECRET_KEY;

let secret: Uint8Array | undefined;

if (!JWT_SECRET_KEY_STRING) {
  if (process.env.NODE_ENV === 'production') {
    console.error('KRITIS: Variabel lingkungan "JWT_SECRET_KEY" tidak ditemukan atau kosong untuk produksi. Aplikasi akan gagal berjalan. Harap set di pengaturan environment Vercel Anda.');
    throw new Error('Missing or empty critical environment variable for production: "JWT_SECRET_KEY". This must be set in your hosting environment (e.g., Vercel).');
  } else {
    console.warn('PERINGATAN PENGEMBANGAN: Variabel lingkungan "JWT_SECRET_KEY" tidak ditemukan atau kosong. Menggunakan nilai default HANYA UNTUK PENGEMBANGAN. JANGAN GUNAKAN INI DI PRODUKSI. Buat file .env.local dan set JWT_SECRET_KEY dengan nilai yang kuat dan acak.');
    secret = new TextEncoder().encode('default-dev-secret-key-minimum-32-characters-long-so-app-can-run');
  }
} else if (JWT_SECRET_KEY_STRING.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('KRITIS: JWT_SECRET_KEY di produksi harus memiliki minimal 32 karakter untuk keamanan. Nilai saat ini terlalu pendek. Aplikasi akan gagal berjalan. Harap perbarui di pengaturan environment Vercel Anda.');
    throw new Error('JWT_SECRET_KEY for production must be at least 32 characters long. The current key is too short. This must be updated in your hosting environment (e.g., Vercel).');
  } else {
    console.warn('PERINGATAN PENGEMBANGAN: JWT_SECRET_KEY sebaiknya memiliki minimal 32 karakter untuk keamanan yang lebih baik, bahkan dalam pengembangan. Nilai saat ini terlalu pendek.');
    secret = new TextEncoder().encode(JWT_SECRET_KEY_STRING); // Tetap gunakan yang diberikan pengguna, meskipun pendek, untuk dev
  }
} else {
  secret = new TextEncoder().encode(JWT_SECRET_KEY_STRING);
}


const issuer = 'urn:portfolio:issuer';
const audience = 'urn:portfolio:audience';
const expiresAt = '2h'; // Token kadaluarsa dalam 2 jam

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export interface AdminJWTPayload extends JWTPayload {
  username: string;
  sub?: string; 
}

export async function createSessionToken(payload: AdminJWTPayload): Promise<string> {
  if (!secret) {
    console.error('Error Kritis: Kunci rahasia JWT tidak terdefinisi saat mencoba membuat token. Ini seharusnya sudah ditangani oleh pengecekan awal.');
    throw new Error('JWT secret key is not configured. Cannot create session token. Check JWT_SECRET_KEY environment variable.');
  }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(payload.sub || payload.username) 
    .setExpirationTime(expiresAt)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<AdminJWTPayload | null> {
  if (!secret) {
    console.error('Error Kritis: Kunci rahasia JWT tidak terdefinisi saat mencoba memverifikasi token. Ini seharusnya sudah ditangani oleh pengecekan awal.');
    return null; 
  }
  try {
    const { payload } = await jwtVerify<AdminJWTPayload>(token, secret, {
      issuer,
      audience,
    });
    return payload;
  } catch (error) {
    // console.warn('JWT Verification Error:', error.name, error.message); // Uncomment for detailed debugging if needed, but avoid in production logs.
    return null;
  }
}
