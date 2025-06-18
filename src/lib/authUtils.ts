
import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

const saltRounds = 10;
// Pastikan JWT_SECRET_KEY diatur di environment variables Anda!
// Idealnya ini harus berupa string acak yang panjang dan kuat.
const JWT_SECRET_KEY_STRING = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY_STRING) {
  // Di lingkungan server-side (seperti middleware atau server actions), ini akan menyebabkan error saat start-up.
  // Di lingkungan client-side (jika file ini secara tidak sengaja diimpor), process.env mungkin tidak tersedia.
  // Untuk produksi, pastikan ini selalu ada.
  console.error('Kritis: Variabel lingkungan "JWT_SECRET_KEY" tidak ditemukan.');
  // Anda bisa memilih untuk throw error di sini jika ini adalah bagian kritis dari startup server
  // throw new Error('Missing environment variable: "JWT_SECRET_KEY"');
}

// Hanya encode jika JWT_SECRET_KEY_STRING ada
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
    throw new Error('JWT secret key is not configured. Cannot create session token.');
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
    console.error('JWT secret key is not configured. Cannot verify session token.');
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
