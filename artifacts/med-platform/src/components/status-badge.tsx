import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline", colorClass?: string }> = {
    draft: { label: "Qoralama", variant: "secondary" },
    pending: { label: "Kutilyapti", variant: "outline", colorClass: "bg-orange-100 text-orange-800 border-orange-200" },
    approved: { label: "Tasdiqlangan", variant: "outline", colorClass: "bg-green-100 text-green-800 border-green-200" },
    rejected: { label: "Rad etilgan", variant: "destructive" },
  };
  const config = map[status] || { label: status, variant: "default" };
  
  return <Badge variant={config.variant} className={config.colorClass}>{config.label}</Badge>;
}
