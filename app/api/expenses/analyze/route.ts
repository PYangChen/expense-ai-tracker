import OpenAI from "openai";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Expense } from "@/models/Expense";

const bodySchema = z.object({ text: z.string().trim().min(1).max(1000) });

const analysisSchema = z.object({
  items: z.array(
    z.object({
      description: z.string(),
      amount: z.number(),
      currency: z.string(),
      category: z.string(),
      date: z.string().nullable(),
    }),
  ),
});

const jsonSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string" },
          category: { type: "string" },
          date: { type: ["string", "null"] },
        },
        required: ["description", "amount", "currency", "category", "date"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "請提供 text（1~1000 字）" }, { status: 400 });
  }
  const { text } = parsed.data;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date()); // YYYY-MM-DD

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `你是記帳助手。從使用者的文字中擷取每一筆支出。今天是 ${today}。` +
            "category 請從：餐飲、交通、購物、娛樂、居家、醫療、教育、其他 中擇一。" +
            "currency 使用 ISO 代碼，未提及則為 TWD。date 為 YYYY-MM-DD，" +
            "可依今天換算「昨天」等相對日期，未提及則為 null。若文字沒有任何支出，items 回傳空陣列。",
        },
        { role: "user", content: text },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "expense_analysis", strict: true, schema: jsonSchema },
      },
    });

    const content = completion.choices[0]?.message?.content;
    const parsedItems = analysisSchema.parse(JSON.parse(content ?? "{}")).items;
    // 文字沒提到日期就記在今天，這樣每筆支出都能歸到某一天
    const items = parsedItems.map((i) => ({ ...i, date: i.date ?? today }));
    const total = items.reduce((sum, i) => sum + i.amount, 0);

    await connectDB();
    const saved = await Expense.create({ userId: session.userId, rawText: text, items, total });

    return Response.json({ id: saved.id, rawText: text, items, total });
  } catch (err) {
    console.error("analyze failed:", err);
    return Response.json({ error: "分析或儲存失敗" }, { status: 500 });
  }
}
