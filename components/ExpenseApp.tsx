"use client";

import { useRouter } from "next/navigation";
import { FormEvent, TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import StatsSection from "@/components/StatsSection";
import { categoryMeta } from "@/lib/categories";
import { daysInMonth, formatMoney, shiftMonth, weekdayOf } from "@/lib/date";

type Item = { id: string; date: string; description: string; amount: number; currency: string; category: string; userName: string };

export default function ExpenseApp({ today: todayStr, userName }: { today: string; userName: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(todayStr.slice(0, 7));
  const [selected, setSelected] = useState(todayStr);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const days = useMemo(() => daysInMonth(month), [month]);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/expenses?month=${m}`);
      if (res.status === 401) return router.replace("/login");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "讀取失敗");
      setItems(data.items);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "讀取失敗");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 月份切換時重新抓資料
    load(month);
  }, [month, load]);

  // 每日小計、月統計
  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of items) map.set(i.date, (map.get(i.date) ?? 0) + i.amount);
    return map;
  }, [items]);
  const monthTotal = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);
  const maxDay = useMemo(() => Math.max(1, ...byDay.values()), [byDay]);
  const dayItems = useMemo(() => items.filter((i) => i.date === selected), [items, selected]);
  const dayTotal = byDay.get(selected) ?? 0;

  // 選中的日期自動捲到日期列中間
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    stripRef.current
      ?.querySelector<HTMLElement>(`[data-date="${selected}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected, month]);

  function pickMonth(next: string) {
    setMonth(next);
    setSelected(next === todayStr.slice(0, 7) ? todayStr : `${next}-01`);
  }
  const changeMonth = (delta: number) => pickMonth(shiftMonth(month, delta));

  // 內容區左右滑動切換日期
  const touch = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: TouchEvent) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const idx = days.indexOf(selected) + (dx < 0 ? 1 : -1);
    if (idx >= 0 && idx < days.length) setSelected(days[idx]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/expenses/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.status === 401) return router.replace("/login");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "發生錯誤");
      setText("");
      if (data.items.length === 0) {
        setSubmitError("沒有偵測到任何支出，換個說法試試");
        return;
      }
      // 跳到新增紀錄的日期並重新載入
      const date: string = data.items[0].date;
      setSelected(date);
      if (date.slice(0, 7) === month) await load(month);
      else setMonth(date.slice(0, 7));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const [y, m] = month.split("-");

  const monthLabel = month === todayStr.slice(0, 7) ? "本月" : `${Number(m)} 月`;
  const navBtn =
    "grid size-10 place-items-center rounded-full bg-white/80 text-lg text-ink transition active:scale-90";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex-1 pb-40" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* 頂部：月份、本月總支出、每日脈動 */}
        <header className="rounded-b-[40px] bg-accent-soft px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar name={userName} size={32} />
              <p className="text-sm font-medium">{userName}</p>
            </div>
            <button onClick={logout} className="rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-medium text-muted transition active:scale-95">
              登出
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button onClick={() => changeMonth(-1)} aria-label="上個月" className={navBtn}>
              ‹
            </button>
            <h1 className="font-display text-base font-semibold">
              {y} 年 {Number(m)} 月
            </h1>
            <button onClick={() => changeMonth(1)} aria-label="下個月" className={navBtn}>
              ›
            </button>
          </div>

          <p className="mt-6 text-sm text-muted">{monthLabel}支出</p>
          <p className="font-display text-[64px] leading-none font-semibold tracking-tight tabular-nums">
            <span className="mr-1 align-top text-2xl font-medium text-muted">$</span>
            {formatMoney(monthTotal)}
          </p>
          <div className="mt-3 flex gap-2 text-xs font-medium">
            <span className="rounded-full bg-white/80 px-3 py-1">{items.length} 筆</span>
            <span className="rounded-full bg-white/80 px-3 py-1">{byDay.size} 天有記帳</span>
          </div>

          {/* 每日脈動：一天一條，點了就切到那天 */}
          <div key={month} className="mt-6 flex h-16 items-end gap-[3px]">
            {days.map((d, i) => {
              const sum = byDay.get(d) ?? 0;
              const active = d === selected;
              const bg = active ? "var(--accent)" : sum > 0 ? "var(--accent-mid)" : d === todayStr ? "var(--sun)" : "rgb(255 255 255 / 0.85)";
              return (
                <button
                  key={d}
                  onClick={() => setSelected(d)}
                  aria-label={`${Number(d.slice(8))} 日 ${formatMoney(sum)} 元`}
                  className="flex h-full flex-1 items-end"
                >
                  <span
                    className="grow block w-full rounded-full"
                    style={{ height: `${sum > 0 ? 18 + (sum / maxDay) * 82 : 6}%`, background: bg, animationDelay: `${i * 14}ms` }}
                  />
                </button>
              );
            })}
          </div>
        </header>

        {/* 統計：月 / 年 */}
        <StatsSection month={month} today={todayStr} items={items} loading={loading} onPickMonth={pickMonth} />

        {/* 可滑動日期列 */}
        <section className="mt-8">
          <h2 className="mb-3 px-5 text-base font-bold">每日記帳</h2>
          <div ref={stripRef} className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-5 pb-3">
            {days.map((d) => {
              const active = d === selected;
              const has = byDay.has(d);
              return (
                <button
                  key={d}
                  data-date={d}
                  onClick={() => setSelected(d)}
                  className={`flex w-[52px] shrink-0 snap-center flex-col items-center gap-1 rounded-[18px] py-2.5 transition active:scale-95 ${
                    active
                      ? "bg-accent text-white shadow-[0_12px_22px_-10px_rgb(47_75_255/0.7)]"
                      : "border border-line bg-card"
                  }`}
                >
                  <span className={`text-[11px] ${active ? "text-white/80" : "text-muted"}`}>{weekdayOf(d)}</span>
                  <span
                    className={`font-display text-lg leading-none font-semibold tabular-nums ${
                      d === todayStr ? "underline decoration-sun decoration-[3px] underline-offset-4" : ""
                    }`}
                  >
                    {Number(d.slice(8))}
                  </span>
                  <span className={`size-1.5 rounded-full ${has ? (active ? "bg-white" : "bg-accent") : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
        </section>

        {/* 選中日期的明細 */}
        <section className="mt-2 px-5">
          <div className="sheet overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                {Number(selected.slice(5, 7))} 月 {Number(selected.slice(8))} 日 週{weekdayOf(selected)}
                {selected === todayStr && <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-bold">今天</span>}
              </p>
              <p className="font-display text-lg font-semibold tabular-nums">${formatMoney(dayTotal)}</p>
            </div>

            {loadError && <p className="mx-5 mb-4 rounded-2xl bg-danger-soft p-3 text-sm text-danger">{loadError}</p>}

            {!loadError && dayItems.length === 0 && (
              <div className="border-t border-line px-5 py-10 text-center">
                {loading ? (
                  <p className="text-sm text-muted">載入中…</p>
                ) : (
                  <>
                    <p className="font-medium">這天還沒有紀錄</p>
                    <p className="mt-1 text-sm text-muted">在下方輸入花了什麼，AI 會幫你整理。</p>
                  </>
                )}
              </div>
            )}

            <ul key={selected} className="divide-y divide-line border-t border-line">
              {dayItems.map((item, i) => {
                const meta = categoryMeta(item.category);
                return (
                  <li key={`${item.id}-${i}`} className="flex items-center gap-3.5 px-5 py-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-xl" style={{ background: `${meta.color}1f` }}>
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.description}</p>
                      <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <span>{item.category}</span>
                        <span className="flex items-center gap-1">
                          <Avatar name={item.userName} size={16} />
                          {item.userName}
                        </span>
                      </p>
                    </div>
                    <p className="font-display text-[17px] font-semibold tabular-nums">
                      ${formatMoney(item.amount)}
                      {item.currency !== "TWD" && <span className="ml-1 text-xs font-normal text-muted">{item.currency}</span>}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      {/* 底部輸入列 */}
      <form
        onSubmit={onSubmit}
        className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md bg-gradient-to-t from-bg via-bg/90 to-transparent px-4 pt-8 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {submitError && <p className="mb-2 rounded-2xl bg-danger-soft px-4 py-2.5 text-sm text-danger">{submitError}</p>}
        <div className="flex items-end gap-2 rounded-[28px] border border-line bg-card p-2 pl-5 shadow-[0_18px_40px_-16px_rgb(47_75_255/0.45)]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="說說你花了什麼，例如：午餐拉麵 250"
            className="max-h-28 min-h-11 flex-1 resize-none bg-transparent py-3 text-[16px] outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            aria-label="送出"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white transition active:scale-90 disabled:bg-accent-mid"
          >
            {submitting ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
