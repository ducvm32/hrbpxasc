"use client";

/** Thanh tab dạng "pill" dùng chung cho các dashboard (có đủ role/aria cho trình đọc màn hình). */
export default function TabBar<T extends string>({
  label,
  value,
  onChange,
  tabs,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-4 flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 text-sm font-medium sm:inline-flex"
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`tab-pill min-h-10 ${value === t.value ? "tab-pill-active" : ""}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
