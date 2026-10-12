import { IconInbox } from "@/components/ui/icons";

export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <IconInbox className="h-9 w-9 text-neutral-300" />
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      {description && <p className="max-w-xs text-xs text-neutral-500">{description}</p>}
    </div>
  );
}
