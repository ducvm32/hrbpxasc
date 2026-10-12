"use client";

import { useId } from "react";

/** Ô tìm kiếm nhanh theo tên / mã cho các bảng danh sách. */
export default function SearchBox({
  value,
  onChange,
  placeholder = "Tìm theo họ tên hoặc mã NV...",
  label = "Tìm kiếm",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const id = useId();
  return (
    <div className="w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

/** So khớp không phân biệt hoa/thường và dấu tiếng Việt ("nguyen" khớp "Nguyễn"). */
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return fields.some((f) => f && normalize(f).includes(q));
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
