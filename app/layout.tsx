import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GHN Onboarding — Gắn Nhân Viên & Đánh Giá 3 Tuần",
  description: "Quản lý gắn nhân viên mới, phân công kèm cặp và đánh giá onboarding 3 tuần",
  icons: {
    icon: "/ghn-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F26522",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
