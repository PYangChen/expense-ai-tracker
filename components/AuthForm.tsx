"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const field =
  "w-full rounded-2xl border border-line bg-bg px-4 py-3.5 text-[16px] outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password, code } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "發生錯誤");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
      setLoading(false);
    }
  }

  const tab = (active: boolean) =>
    `flex-1 rounded-full py-2 text-center text-sm font-medium transition ${active ? "bg-accent text-white shadow-sm" : "text-muted"}`;

  return (
    <div className="sheet p-6">
      <div role="tablist" className="mb-6 flex rounded-full bg-accent-soft p-1">
        <Link href="/login" role="tab" aria-selected={!isRegister} replace className={tab(!isRegister)}>
          登入
        </Link>
        <Link href="/register" role="tab" aria-selected={isRegister} replace className={tab(isRegister)}>
          註冊
        </Link>
      </div>

      <h2 className="text-2xl font-bold tracking-tight">{isRegister ? "建立你的帳號" : "歡迎回來"}</h2>
      <p className="mt-1 mb-6 text-sm text-muted">{isRegister ? "註冊後就能和大家一起記帳。" : "登入後繼續記帳。"}</p>

      <form onSubmit={onSubmit} className="space-y-4">
        {isRegister && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">名稱</span>
            <input className={field} placeholder="大家看到的名字" autoComplete="name" required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input className={field} type="email" placeholder="you@example.com" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">密碼</span>
          <input
            className={field}
            type="password"
            placeholder={isRegister ? "至少 8 個字元" : "輸入密碼"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? 8 : undefined}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {isRegister && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">註冊驗證碼</span>
            <input className={field} placeholder="向邀請你的人索取" autoComplete="off" autoCapitalize="none" required value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-accent py-4 text-[16px] font-bold text-white shadow-[0_14px_26px_-12px_rgb(47_75_255/0.75)] transition active:scale-[0.98] disabled:bg-accent-mid disabled:shadow-none"
        >
          {loading ? "處理中…" : isRegister ? "建立帳號" : "登入"}
        </button>
      </form>
    </div>
  );
}
