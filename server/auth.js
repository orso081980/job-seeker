import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { findAdminByUsername } from "./db/admins.js";

const COOKIE_NAME = "jp_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function parseCookies(header) {
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function serializeCookie(name, value, { maxAge, secure }) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token) {
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function isAuthed(req) {
  const cookies = parseCookies(req.headers.cookie ?? "");
  return verify(cookies[COOKIE_NAME]) !== null;
}

export function requireAuth(req, res, next) {
  if (!isAuthed(req)) return res.status(401).json({ error: "Login required" });
  next();
}

// Admin accounts live in the `admins` table (see server/db/admins.js).
// Manage them with server/scripts/create-admin.js.
async function verifyCredentials(username, password) {
  const admin = await findAdminByUsername(username);
  if (!admin) return false;
  return bcrypt.compare(password, admin.password_hash);
}

export function registerAuthRoutes(app) {
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body ?? {};
    if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) {
      return res.status(500).json({ error: "Admin sign-in is not configured on the server." });
    }
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    let authenticated = false;
    try {
      authenticated = await verifyCredentials(username, password);
    } catch (e) {
      console.warn(`[auth] admin lookup failed: ${e.message}`);
    }
    if (!authenticated) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    const token = sign({ u: username, exp: Date.now() + MAX_AGE_MS });
    res.setHeader(
      "Set-Cookie",
      serializeCookie(COOKIE_NAME, token, {
        secure: process.env.NODE_ENV === "production",
        maxAge: MAX_AGE_MS / 1000,
      })
    );
    res.json({ authenticated: true });
  });

  app.post("/api/logout", (_req, res) => {
    res.setHeader(
      "Set-Cookie",
      serializeCookie(COOKIE_NAME, "", {
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
      })
    );
    res.json({ authenticated: false });
  });

  app.get("/api/session", (req, res) => {
    res.json({ authenticated: isAuthed(req) });
  });
}
