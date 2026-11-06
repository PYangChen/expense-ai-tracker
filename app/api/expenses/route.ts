import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Expense } from "@/models/Expense";

// GET /api/expenses?month=YYYY-MM → 該月份所有人的支出（攤平成一筆一列，含記帳者名稱）
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });

  const month = new URL(request.url).searchParams.get("month") ?? "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return Response.json({ error: "month 格式需為 YYYY-MM" }, { status: 400 });
  }

  try {
    await connectDB();
    const items = await Expense.aggregate([
      // 共同記帳本：所有人的紀錄都看得到，並附上記帳者名稱
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$items" },
      {
        // 舊資料 date 可能是 null，退回用建立時間（台北時區）
        $addFields: {
          date: {
            $ifNull: [
              "$items.date",
              { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Taipei" } },
            ],
          },
        },
      },
      { $match: { date: { $regex: `^${month}-` } } },
      { $sort: { date: 1, createdAt: 1 } },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          date: 1,
          description: "$items.description",
          amount: "$items.amount",
          currency: "$items.currency",
          category: "$items.category",
          userName: { $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, "未知"] },
        },
      },
    ]);
    return Response.json({ month, items });
  } catch (err) {
    console.error("list expenses failed:", err);
    return Response.json({ error: "讀取失敗" }, { status: 500 });
  }
}
