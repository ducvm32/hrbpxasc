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
    <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/ghn-logo.png" alt="Giao Hàng Nhanh" className="h-8 w-auto shrink-0" />
          <div>
            <h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {roleBadge}
          {actions}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
