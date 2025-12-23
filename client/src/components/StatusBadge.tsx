import { cn } from "@/lib/utils";

type StatusType = "compliant" | "non_compliant" | "n/a" | "pending" | "in_progress" | "completed" | "overdue" | "low" | "medium" | "high";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  
  let styles = "bg-slate-100 text-slate-600";
  let label = status.replace(/_/g, " ");

  switch (normalizedStatus) {
    // Audit Items & Audits
    case "compliant":
    case "completed":
      styles = "bg-emerald-100 text-emerald-700 border-emerald-200";
      break;
    case "non_compliant":
    case "overdue":
    case "high":
      styles = "bg-red-100 text-red-700 border-red-200";
      break;
    case "pending":
    case "in_progress":
    case "medium":
      styles = "bg-amber-100 text-amber-700 border-amber-200";
      break;
    case "n/a":
    case "low":
      styles = "bg-slate-100 text-slate-600 border-slate-200";
      break;
    default:
      styles = "bg-slate-100 text-slate-600 border-slate-200";
  }

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize whitespace-nowrap",
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
