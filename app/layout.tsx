import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Font theo giaohangnang.com: Plus Jakarta Sans cho nội dung, Space Grotesk cho
// tiêu đề. next/font tải font lúc build và tự host cùng app — trình duyệt
// người dùng không gọi tới Google Fonts khi chạy.
const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const fontDisplay = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GHN Onboarding — Gắn Nhân Viên & Đánh Giá 3 Tuần",
  description: "Quản lý gắn nhân viên mới, phân công kèm cặp và đánh giá onboarding 3 tuần",
};

export const viewport: Viewport = {
  themeColor: "#00A19A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${fontBody.variable} ${fontDisplay.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
