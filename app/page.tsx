import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import ExpenseApp from "@/components/ExpenseApp";
import { getCurrentUser } from "@/lib/auth";

// 「今天」和登入狀態都要在請求時才知道
async function Dynamic() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date());
  return <ExpenseApp today={today} userName={user.name} />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Dynamic />
    </Suspense>
  );
}
