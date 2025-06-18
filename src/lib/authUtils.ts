
import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

const saltRounds = 10;

// KRITIKAL UNTUK DEPLOYMENT VERCEL:
// Pastikan variabel lingkungan JWT_SECRET_KEY telah diatur dengan BENAR
// di pengaturan Environment Variables proyek Vercel Anda.
// Ini harus berupa string acak yang panjang dan kuat untuk keamanan.
// Kegagalan mengatur ini akan menyebabkan error saat pembuatan atau verifikasi token.
const JWT_SECRET_KEY_STRING = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY_STRING && process.env.NODE_ENV === 'production') {
  // Di lingkungan produksi (seperti Vercel), ini adalah error kritis.
  console.error('KRITIS: Variabel lingkungan "JWT_SECRET_KEY" tidak ditemukan untuk produksi.');
  // Sebaiknya throw error agar build gagal jika ini terjadi di produksi.
  // throw new Error('Missing critical environment variable for production: "JWT_SECRET_KEY"');
} else if (!JWT_SECRET_KEY_STRING) {
  console.warn('PERINGATAN: Variabel lingkungan "JWT_SECRET_KEY" tidak ditemukan. Menggunakan nilai default untuk pengembangan. JANGAN GUNAKAN INI DI PRODUKSI.');
  // Untuk pengembangan lokal jika tidak diset, bisa menggunakan nilai default,
  // tapi ini TIDAK BOLEH digunakan di produksi.
  // process.env.JWT_SECRET_KEY = 'default-dev-secret-key-please-set-in-env';
}


// Hanya encode jika JWT_SECRET_KEY_STRING ada dan valid
const secret = JWT_SECRET_KEY_STRING ? new TextEncoder().encode(JWT_SECRET_KEY_STRING) : undefined;

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
  // Anda bisa menambahkan field lain ke payload jika perlu, misal userId dari DB
  sub?: string; // Standard field for subject (often userId)
}

export async function createSessionToken(payload: AdminJWTPayload): Promise<string> {
  if (!secret) {
    throw new Error('Kunci rahasia JWT tidak dikonfigurasi. Tidak dapat membuat token sesi.');
  }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(payload.username) // atau payload.sub jika ada
    .setExpirationTime(expiresAt)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<AdminJWTPayload | null> {
  if (!secret) {
    console.error('Kunci rahasia JWT tidak dikonfigurasi. Tidak dapat memverifikasi token sesi.');
    return null;
  }
  try {
    const { payload } = await jwtVerify<AdminJWTPayload>(token, secret, {
      issuer,
      audience,
    });
    return payload;
  } catch (error) {
    // Jangan log error token yang kadaluarsa atau tidak valid secara detail ke konsol produksi
    // kecuali untuk debugging internal.
    // console.error('JWT Verification Error:', error);
    return null;
  }
}
