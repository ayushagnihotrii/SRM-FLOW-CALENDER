import crypto from "crypto";
import { User, GoogleAccount } from "./server-db";

export interface SessionData {
  user: User;
  account?: GoogleAccount;
}

const SECRET =
  process.env.SESSION_SECRET ||
  process.env.WEBCAL_SECRET ||
  "campuspulse-production-session-secret-key-2026";
const KEY = crypto.createHash("sha256").update(SECRET).digest();

export function encryptSession(data: SessionData): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const jsonStr = JSON.stringify(data);
  let encrypted = cipher.update(jsonStr, "utf8", "base64url");
  encrypted += cipher.final("base64url");
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted}`;
}

export function decryptSession(token: string): SessionData | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [ivB64, tagB64, encB64] = parts;
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encB64, "base64url", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted) as SessionData;
  } catch {
    return null;
  }
}
