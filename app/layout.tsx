import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

// 數字與大標用 Bricolage，中文用 Noto Sans TC（CJK 以 unicode-range 分段載入，不預載）
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const noto = Noto_Sans_TC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "PY AI 家庭記帳本",
  description: "用文字輸入，AI 幫你記帳",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f7ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${display.variable} ${noto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
