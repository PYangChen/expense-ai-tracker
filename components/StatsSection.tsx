"use client";

import { useEffect, useMemo, useState } from "react";
import { categoryMeta } from "@/lib/categories";
import { formatMoney } from "@/lib/date";

type Item = { category: string; amount: number };
type Row = { month: string; category: string; total: number; count: number };

function CategoryList({ entries, total, empty }: { entries: [string, number][]; total: number; empty: string }) {
  if (entries.length === 0) return <p className="py-4 text-center text-sm text-muted">{empty}</p>;
  return (
    <>
      <div className="mb-5 flex h-3 gap-0.5 overflow-hidden rounded-full">
        {entries.map(([name, sum]) => (
          <div key={name} className="first:rounded-l-full last:rounded-r-full" style={{ width: `${(sum / total) * 100}%`, background: categoryMeta(name).color }} />
        ))}
      </div>
      <ul className="space-y-3.5">
        {entries.map(([name, sum]) => {
          const meta = categoryMeta(name);
          return (
            <li key={name} className="flex items-center gap-3.5">
              <span className="grid size-10 place-items-center rounded-2xl text-lg" style={{ background: `${meta.color}1f` }}>
                {meta.emoji}
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{name}</span>
                  <span className="font-display font-semibold tabular-nums">${formatMoney(sum)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full" style={{ width: `${(sum / total) * 100}%`, background: meta.color }} />
                  </div>
                  <span className="w-9 text-right text-xs text-muted tabular-nums">{Math.round((sum / total) * 100)}%</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function StatsSection({
  month,
  today,
  items,
  loading,
  onPickMonth,
}: {
  month: string; // 目前選中的月份 YYYY-MM
  today: string; // YYYY-MM-DD
  items: Item[]; // 該月份的支出
  loading: boolean;
  onPickMonth: (month: string) => void;
}) {
  const [mode, setMode] = useState<"month" | "year">("month");
  const [year, setYear] = useState(month.slice(0, 4));
  const [rows, setRows] = useState<Row[]>([]);
  const [yearLoading, setYearLoading] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);

  // 年統計：切到年模式、換年份，或月資料更新（新增紀錄）時重抓
  useEffect(() => {
    if (mode !== "year") return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 載入狀態隨請求同步
    setYearLoading(true);
    setYearError(null);
    fetch(`/api/expenses/stats?year=${year}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "讀取失敗");
        if (!cancelled) setRows(data.rows);
      })
      .catch((e) => !cancelled && setYearError(e instanceof Error ? e.message : "讀取失敗"))
      .finally(() => !cancelled && setYearLoading(false));
    return () => {
      cancelled = true;
    };
  }, [mode, year, items]);

  // 月統計
  const monthTotal = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);
  const monthCats = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of items) map.set(i.category, (map.get(i.category) ?? 0) + i.amount);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  // 年統計
  const monthlyTotals = useMemo(() => {
    const t = Array(12).fill(0) as number[];
    for (const r of rows) t[Number(r.month) - 1] += r.total;
    return t;
  }, [rows]);
  const yearTotal = monthlyTotals.reduce((a, b) => a + b, 0);
  const yearCats = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.category, (map.get(r.category) ?? 0) + r.total);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const thisYear = today.slice(0, 4);
  const thisMonth = today.slice(0, 7);
  // 月均：今年只算到目前為止的月份，過去的年份算 12 個月
  const monthsElapsed = year === thisYear ? Number(today.slice(5, 7)) : 12;
  const maxMonth = Math.max(...monthlyTotals, 1);
  const monthLabel = month === thisMonth ? "本月" : `${Number(month.slice(5))} 月`;

  return (
    <section className="mt-6 px-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">{mode === "month" ? `${monthLabel}各項目` : "年度統計"}</h2>
        <div role="tablist" className="flex rounded-full bg-accent-soft p-1 text-sm">
          {(["month", "year"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                if (m === "year") setYear(month.slice(0, 4));
              }}
              className={`rounded-full px-4 py-1 font-medium transition ${mode === m ? "bg-accent text-white shadow-sm" : "text-muted"}`}
            >
              {m === "month" ? "月" : "年"}
            </button>
          ))}
        </div>
      </div>

      <div className="sheet p-5">
        {mode === "month" ? (
          <CategoryList entries={monthCats} total={monthTotal} empty={loading ? "載入中…" : "這個月還沒有紀錄"} />
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <button onClick={() => setYear(String(Number(year) - 1))} aria-label="上一年" className="grid size-9 place-items-center rounded-full bg-bg transition active:scale-90">
                ‹
              </button>
              <span className="font-display font-semibold">{year} 年</span>
              <button onClick={() => setYear(String(Number(year) + 1))} aria-label="下一年" className="grid size-9 place-items-center rounded-full bg-bg transition active:scale-90">
                ›
              </button>
            </div>

            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-sm text-muted">全年支出</p>
                <p className="font-display text-4xl leading-tight font-semibold tracking-tight tabular-nums">
                  <span className="mr-0.5 align-top text-base font-medium text-muted">$</span>
                  {formatMoney(yearTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">月均</p>
                <p className="font-display text-lg font-semibold tabular-nums">${formatMoney(yearTotal / monthsElapsed)}</p>
              </div>
            </div>

            {/* 12 個月長條圖，點擊跳到該月 */}
            <div className="mb-6 flex h-32 items-end gap-1.5">
              {monthlyTotals.map((total, i) => {
                const mo = `${year}-${String(i + 1).padStart(2, "0")}`;
                const active = mo === month;
                return (
                  <button
                    key={mo}
                    onClick={() => {
                      onPickMonth(mo);
                      setMode("month");
                    }}
                    aria-label={`${i + 1} 月 ${formatMoney(total)} 元`}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <div
                      className={`w-full rounded-full transition-all ${active ? "bg-accent" : total > 0 ? "bg-accent-mid" : "bg-line"}`}
                      style={{ height: `${Math.max((total / maxMonth) * 100, total > 0 ? 8 : 4)}%` }}
                    />
                    <span
                      className={`font-display text-[11px] tabular-nums ${
                        mo === thisMonth ? "font-bold text-ink underline decoration-sun decoration-2 underline-offset-2" : "text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {yearError ? (
              <p className="text-sm text-danger">{yearError}</p>
            ) : (
              <CategoryList entries={yearCats} total={yearTotal} empty={yearLoading ? "載入中…" : "這一年還沒有紀錄"} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
