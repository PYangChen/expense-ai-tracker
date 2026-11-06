import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Expense } from "@/models/Expense";

// GET /api/expenses/stats?year=YYYY → 該年（所有人合計）每個月、每個分類的支出加總
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });

  const year = new URL(request.url).searchParams.get("year") ?? "";
  if (!/^\d{4}$/.test(year)) {
    return Response.json({ error: "year 格式需為 YYYY" }, { status: 400 });
  }

  try {
    await connectDB();
    const rows = await Expense.aggregate([
      { $unwind: "$items" },
      {
        $addFields: {
          date: {
            $ifNull: [
              "$items.date",
              { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Taipei" } },
            ],
          },
        },
      },
      { $match: { date: { $regex: `^${year}-` } } },
      {
        $group: {
          _id: { month: { $substrCP: ["$date", 5, 2] }, category: "$items.category" },
          total: { $sum: "$items.amount" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, month: "$_id.month", category: "$_id.category", total: 1, count: 1 } },
    ]);
    return Response.json({ year, rows });
  } catch (err) {
    console.error("stats failed:", err);
    return Response.json({ error: "讀取失敗" }, { status: 500 });
  }
}
