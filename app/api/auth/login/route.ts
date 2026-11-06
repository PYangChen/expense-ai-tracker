import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

// 找不到使用者時也跑一次 compare，讓回應時間不洩漏「這個 email 有沒有註冊」
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "請輸入 Email 和密碼" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  try {
    await connectDB();
    const user = await User.findOne({ email });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      return Response.json({ error: "Email 或密碼錯誤" }, { status: 401 });
    }
    await createSession({ userId: user.id, role: user.role });
    return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("login failed:", err);
    return Response.json({ error: "登入失敗" }, { status: 500 });
  }
}
