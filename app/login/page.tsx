import { Suspense } from "react";
import { redirect } from "next/navigation";
import Landing from "@/components/Landing";
import { getCurrentUser } from "@/lib/auth";

// 已登入就直接回首頁
async function Guard() {
  if (await getCurrentUser()) redirect("/");
  return <Landing mode="login" />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Guard />
    </Suspense>
  );
}
