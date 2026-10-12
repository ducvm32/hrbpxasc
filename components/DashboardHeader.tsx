import LogoutButton from "@/components/LogoutButton";

export default function DashboardHeader({
  title,
  subtitle,
  roleBadge,
  actions,
}: {
  title: string;
  subtitle: string;
  roleBadge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="z-30 -mx-4 mb-6 border-b border-neutral-200/80 bg-white/90 px-4 py-4 backdrop-blur-md sm:sticky sm:top-0 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Mobile (<sm): hàng 1 chỉ có logo + đăng xuất; tên để riêng hàng 2 và
          được xuống dòng (không cắt "…") vì màn hẹp không đủ chỗ cho cả 3. */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <img src="/ghn-logo.png" alt="Giao Hàng Nhanh" className="h-8 w-auto shrink-0" />
          <LogoutButton />
        </div>
        <h1 className="text-xl font-bold leading-snug text-neutral-900">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {roleBadge}
          <p className="text-sm text-neutral-500">{subtitle}</p>
        </div>
        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>

      {/* Desktop (sm+): logo đứng riêng 1 bên; tên/badge/mô tả và hành
          động+đăng xuất chia đều 2 đầu của phần còn lại. */}
      <div className="hidden sm:flex sm:items-center sm:gap-6">
        <img src="/ghn-logo.png" alt="Giao Hàng Nhanh" className="h-9 w-auto shrink-0" />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold leading-tight text-neutral-900">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {roleBadge}
              <p className="text-sm text-neutral-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {actions}
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
