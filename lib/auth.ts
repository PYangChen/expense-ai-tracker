import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { connectDB } from "@/lib/mongodb";
import { Role, User } from "@/models/User";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 天

export type Session = { userId: string; role: Role };

// 僅供本機開發：沒設 AUTH_SECRET 時用這個固定值，讓流程可以先跑起來。production 一律要求設定。
const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-set-AUTH_SECRET-in-env-local";
let warned = false;

function secret() {
  let s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is not set (need at least 16 chars)");
    }
    if (!warned) {
      warned = true;
      console.warn("[auth] AUTH_SECRET 未設定，開發模式使用不安全的預設密鑰；請在 .env.local 設定 AUTH_SECRET");
    }
    s = DEV_FALLBACK_SECRET;
  }
  return new TextEncoder().encode(s);
}

/** 在建立使用者之前先確認簽章設定可用，避免「帳號建好了卻簽不出 cookie」 */
export function assertAuthConfigured() {
  secret();
}

/** 簽發 JWT 並寫入 httpOnly cookie（只能在 Route Handler / Server Action 呼叫） */
export async function createSession(session: Session) {
  const token = await new SignJWT({ role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** 只驗證 cookie 裡的 token，不查資料庫 */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return { userId: payload.sub, role: payload.role === "admin" ? "admin" : "user" };
  } catch {
    return null; // 過期、被竄改等
  }
}

/** 驗證 token 並確認使用者還存在 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.userId).select("email name role").lean();
  if (!user) return null;
  return { id: String(user._id), email: user.email, name: user.name, role: user.role };
}
