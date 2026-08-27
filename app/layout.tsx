import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GHN Onboarding — Gắn Nhân Viên & Đánh Giá 3 Tuần",
  description: "Quản lý gắn nhân viên mới, phân công kèm cặp và đánh giá onboarding 3 tuần",
  icons: {
    icon: "/ghn-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
