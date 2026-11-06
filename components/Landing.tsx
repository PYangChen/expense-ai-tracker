import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import Avatar from "@/components/Avatar";
import { categoryMeta } from "@/lib/categories";

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex" aria-hidden>
        {["#ff7a3d", "#ff4f8b", "#2f4bff"].map((c) => (
          <span key={c} className="-ml-2.5 size-6 rounded-full border-2 border-bg first:ml-0" style={{ background: c }} />
        ))}
      </span>
      <span className="text-lg font-bold tracking-tight">PY AI 家庭記帳本</span>
    </div>
  );
}

/** 示範：一句話被拆成兩筆帳 */
function Demo() {
  const rows = [
    { desc: "吃拉麵", cat: "餐飲", amount: 250 },
    { desc: "搭捷運", cat: "交通", amount: 30 },
  ];
  return (
    <div className="relative">
      <span aria-hidden className="absolute -top-5 -right-3 size-20 rounded-full bg-sun" />
      <span aria-hidden className="absolute -bottom-6 -left-4 size-24 rounded-full bg-accent-mid" />
      <div className="sheet relative p-5">
        <div className="ml-auto w-fit max-w-[88%] rounded-3xl rounded-br-md bg-accent px-4 py-3 text-[15px] leading-relaxed text-white">
          昨天中午吃拉麵 250 元，晚上搭捷運 30 元
        </div>
        <p className="mt-4 mb-2 text-xs text-muted">AI 整理成 2 筆，記在 11 月 4 日</p>
        <ul className="divide-y divide-line rounded-2xl bg-bg">
          {rows.map((r) => {
            const meta = categoryMeta(r.cat);
            return (
              <li key={r.desc} className="flex items-center gap-3 px-3.5 py-3">
                <span className="grid size-10 place-items-center rounded-xl text-lg" style={{ background: `${meta.color}26` }}>
                  {meta.emoji}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.desc}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    {r.cat}
                    <Avatar name="小明" size={14} />
                    小明
                  </p>
                </div>
                <p className="font-display font-semibold tabular-nums">${r.amount}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 flex justify-between px-1 text-sm">
          <span className="text-muted">合計</span>
          <span className="font-display font-semibold tabular-nums">$280</span>
        </p>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "打字就記好",
    text: "不用選分類、不用填表單。寫下花了什麼，AI 會拆成一筆一筆，自動歸類並算好金額。",
    visual: (
      <div className="flex w-full items-center gap-2">
        <div className="flex-1 rounded-2xl bg-white px-3.5 py-3 text-sm shadow-sm">午餐拉麵 250</div>
        <span className="text-accent" aria-hidden>
          →
        </span>
        <div className="rounded-2xl bg-white px-3 py-3 text-sm font-medium shadow-sm">🍜 餐飲</div>
      </div>
    ),
  },
  {
    title: "大家一起記同一本帳",
    text: "每個人用自己的帳號記，所有人都看得到同一本帳，每一筆也都標示是誰記的。",
    visual: (
      <div className="flex w-full flex-col gap-2">
        {[
          ["小明", "午餐", "$250"],
          ["小美", "晚餐", "$480"],
        ].map(([n, d, a]) => (
          <div key={n} className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
            <Avatar name={n} size={24} />
            <span className="flex-1">
              {n}記了 {d}
            </span>
            <span className="font-display font-semibold">{a}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "每月每年一目了然",
    text: "看每一天花了多少、各個項目占多少，也能切到全年，知道錢都去哪了。",
    visual: (
      <div className="w-full">
        <div className="flex h-16 items-end gap-1.5">
          {[30, 55, 40, 80, 50, 95, 65, 45].map((h, i) => (
            <span key={i} className={`flex-1 rounded-full ${i === 5 ? "bg-accent" : "bg-accent-mid"}`} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          {[
            ["#ff7a3d", 46],
            ["#ff4f8b", 24],
            ["#8b5cf6", 18],
            ["#00a6e0", 12],
          ].map(([c, w]) => (
            <span key={c} style={{ background: c as string, width: `${w}%` }} />
          ))}
        </div>
      </div>
    ),
  },
];

export default function Landing({ mode }: { mode: "login" | "register" }) {
  const other = mode === "login" ? { href: "/register", label: "註冊" } : { href: "/login", label: "登入" };

  return (
    <div className="min-h-dvh overflow-x-clip bg-bg">
      <div className="mx-auto w-full max-w-md px-5 pb-16 md:max-w-5xl md:px-8">
        <nav className="flex items-center justify-between py-5">
          <Wordmark />
          <Link href={other.href} replace className="rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent transition active:scale-95">
            {other.label}
          </Link>
        </nav>

        <div className="grid gap-10 pt-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:grid-rows-[auto_1fr] md:gap-x-16 md:pt-12">
          <header className="md:col-start-1 md:row-start-1">
            <h1 className="text-[40px] leading-[1.15] font-bold tracking-tight md:text-6xl md:leading-[1.1]">
              說一句話，
              <br />
              帳就記好了
            </h1>
            <p className="mt-4 max-w-[22em] text-[17px] leading-relaxed text-muted">
              和家人、伴侶共用一本帳。用日常說話的方式寫下花費，AI 幫你分類、算好金額。
            </p>
          </header>

          <div className="md:col-start-2 md:row-span-2 md:row-start-1 md:self-start">
            <AuthForm mode={mode} />
          </div>

          <div className="md:col-start-1 md:row-start-2 md:self-start">
            <Demo />
          </div>
        </div>

        <section className="mt-20 md:mt-28">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">一本帳，大家一起記</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
            {FEATURES.map((f) => (
              <article key={f.title}>
                <div className="flex h-40 items-center rounded-[28px] bg-accent-soft p-5">{f.visual}</div>
                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{f.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
