// 每個人一個固定顏色，用名字雜湊決定，同一個人在任何地方都是同一個顏色
const PALETTE = ["#2f4bff", "#ff4f8b", "#10b3a0", "#ff7a3d", "#8b5cf6", "#00a6e0"];

export function personColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export const initialOf = (name: string) => [...name.trim()][0] ?? "?";
