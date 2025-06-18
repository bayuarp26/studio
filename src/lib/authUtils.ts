import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

const saltRounds = 10;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY) {
  throw new Error('Missing environment variable: "JWT_SECRET_KEY"');
}

const secret = new TextEncoder().encode(JWT_SECRET_KEY);
const issuer = 'urn:portfolio:issuer';
const audience = 'urn:portfolio:audience';
const expiresAt = '2h'; // Token expires in 2 hours

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AdminJWTPayload extends JWTPayload {
  username: string;
}

export async function createSessionToken(payload: AdminJWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(payload.username)
    .setExpirationTime(expiresAt)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify<AdminJWTPayload>(token, secret, {
      issuer,
      audience,
    });
    return payload;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
}
