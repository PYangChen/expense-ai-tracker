import bcrypt from "bcryptjs";
import { z } from "zod";
import { assertAuthConfigured, createSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

// 註冊驗證碼（先寫死）
const REGISTER_CODE = "love";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Email 格式不正確")),
  password: z.string().min(8, "密碼至少 8 個字元").max(72, "密碼最多 72 個字元"),
  name: z.string().trim().min(1, "請輸入名稱").max(50, "名稱最多 50 字"),
  code: z.string().trim().min(1, "請輸入驗證碼"),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "資料格式錯誤" }, { status: 400 });
  }
  const { email, password, name, code } = parsed.data;

  // 先驗證碼、再查 email，沒有驗證碼的人無法藉此探測哪些 email 已註冊
  if (code !== REGISTER_CODE) {
    return Response.json({ error: "驗證碼錯誤" }, { status: 403 });
  }

  try {
    assertAuthConfigured();
    await connectDB();
    if (await User.exists({ email })) {
      return Response.json({ error: "這個 Email 已經註冊過了" }, { status: 409 });
    }
    // role 一律是 user；不接受前端傳入，避免自己註冊成 admin
    const user = await User.create({ email, name, passwordHash: await bcrypt.hash(password, 10), role: "user" });
    await createSession({ userId: user.id, role: user.role });
    return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
  } catch (err) {
    // 兩個請求同時註冊同一個 email 時，會撞到 unique index
    if (typeof err === "object" && err && "code" in err && err.code === 11000) {
      return Response.json({ error: "這個 Email 已經註冊過了" }, { status: 409 });
    }
    console.error("register failed:", err);
    return Response.json({ error: "註冊失敗" }, { status: 500 });
  }
}
