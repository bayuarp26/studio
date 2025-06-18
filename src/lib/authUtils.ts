
import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

const saltRounds = 10;

// KRITIKAL UNTUK DEPLOYMENT (MISALNYA VERCEL):
// Pastikan variabel lingkungan JWT_SECRET_KEY telah diatur dengan BENAR
// di pengaturan Environment Variables platform hosting Anda (misalnya Vercel).
// Ini harus berupa string acak yang panjang dan kuat untuk keamanan.
// Kegagalan mengatur ini akan menyebabkan error saat pembuatan atau verifikasi token.
const JWT_SECRET_KEY_STRING = process.env.JWT_SECRET_KEY;

let secret: Uint8Array | undefined;

if (!JWT_SECRET_KEY_STRING) {
  if (process.env.NODE_ENV === 'production') {
    // Di lingkungan produksi (seperti Vercel), ini adalah error kritis.
    console.error('KRITIS: Variabel lingkungan "JWT_SECRET_KEY" tidak ditemukan atau kosong untuk produksi.');
    // Melemparkan error akan menghentikan aplikasi, yang merupakan perilaku yang diinginkan
    // jika konfigurasi keamanan penting ini hilang di produksi.
    throw new Error('Missing or empty critical environment variable for production: "JWT_SECRET_KEY"');
  } else {
    // Untuk pengembangan lokal jika tidak diset, bisa menggunakan nilai default,
    // tapi ini TIDAK BOLEH digunakan di produksi.
    console.warn('PERINGATAN: Variabel lingkungan "JWT_SECRET_KEY" tidak ditemukan atau kosong. Menggunakan nilai default HANYA UNTUK PENGEMBANGAN. JANGAN GUNAKAN INI DI PRODUKSI.');
    secret = new TextEncoder().encode('default-dev-secret-key-minimum-32-characters-long'); // Minimal 32 karakter untuk HS256
  }
} else {
  if (JWT_SECRET_KEY_STRING.length < 32 && process.env.NODE_ENV === 'production') {
    console.error('KRITIS: JWT_SECRET_KEY di produksi harus memiliki minimal 32 karakter.');
    throw new Error('JWT_SECRET_KEY for production must be at least 32 characters long.');
  } else if (JWT_SECRET_KEY_STRING.length < 32) {
    console.warn('PERINGATAN PENGEMBANGAN: JWT_SECRET_KEY sebaiknya memiliki minimal 32 karakter untuk keamanan yang lebih baik, bahkan dalam pengembangan.');
  }
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
    // Kondisi ini seharusnya sudah ditangani oleh pengecekan di atas,
    // tapi sebagai fallback jika logika di atas berubah.
    console.error('Error Kritis: Kunci rahasia JWT tidak terdefinisi saat mencoba membuat token.');
    throw new Error('JWT secret key is not configured. Cannot create session token.');
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
    console.error('Error Kritis: Kunci rahasia JWT tidak terdefinisi saat mencoba memverifikasi token.');
    // Di produksi, ini bisa menjadi null agar middleware mengarahkan ke login.
    // Di pengembangan, ini mungkin mengindikasikan masalah setup.
    return null; 
  }
  try {
    const { payload } = await jwtVerify<AdminJWTPayload>(token, secret, {
      issuer,
      audience,
    });
    return payload;
  } catch (error) {
    // Jangan log detail error token ke konsol produksi kecuali untuk debugging.
    // Pesan error bisa berisi informasi sensitif.
    // console.warn('JWT Verification Error:', error.name, error.message); // Lebih aman untuk produksi
    return null;
  }
}
