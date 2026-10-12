"use client";

import { useState } from "react";

/** Câu hỏi chọn 1 đáp án — fieldset/legend để trình đọc màn hình đọc đúng câu hỏi cho cả nhóm. */
export function RadioQuestion({
  name,
  question,
  options,
}: {
  name: string;
  question: string;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="label">{question}</legend>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition duration-150 has-[:checked]:border-ghn has-[:checked]:bg-ghn-50 has-[:checked]:text-ghn-700 hover:bg-slate-50"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              required
              className="h-4 w-4 shrink-0 border-slate-300 accent-ghn-600"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Chấm 1–5 sao bằng radio thật (ẩn khỏi mắt, vẫn còn cho bàn phím & trình đọc
 * màn hình) — nhờ vậy `required` của trình duyệt chặn được ngay khi chưa chọn
 * sao, không phải đợi server báo lỗi như khi dùng input hidden.
 */
export function StarRating({ name, legend }: { name: string; legend: string }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            onMouseEnter={() => setHover(star)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-2xl leading-none transition-transform duration-100 hover:scale-110 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ghn"
          >
            <input
              type="radio"
              name={name}
              value={star}
              required
              checked={value === star}
              onChange={() => setValue(star)}
              className="sr-only"
            />
            <span aria-hidden="true" className={shown >= star ? "text-ghn-500" : "text-slate-300"}>
              ★
            </span>
            <span className="sr-only">{star} sao</span>
          </label>
        ))}
        <span className="ml-2 whitespace-nowrap text-sm text-slate-500" aria-live="polite">
          {value ? `${value}/5 sao` : "Chưa chọn"}
        </span>
      </div>
    </fieldset>
  );
}
