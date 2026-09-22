import React from "react";
import { ReservationStatus } from "../types";
import { 
  Sparkles, 
  PhoneCall, 
  CheckCircle2, 
  UserCheck, 
  Armchair, 
  CheckCheck, 
  XCircle, 
  UserX 
} from "lucide-react";

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  size?: "sm" | "md";
}

export function ReservationStatusBadge({ status, size = "sm" }: ReservationStatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case "new":
        return {
          label: "NEW",
          icon: Sparkles,
          styles: "bg-purple-500/15 border-purple-500/40 text-purple-300",
        };
      case "contacted":
        return {
          label: "CONTACTED",
          icon: PhoneCall,
          styles: "bg-blue-500/15 border-blue-500/40 text-blue-300",
        };
      case "confirmed":
        return {
          label: "CONFIRMED",
          icon: CheckCircle2,
          styles: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold",
        };
      case "arrived":
        return {
          label: "ARRIVED",
          icon: UserCheck,
          styles: "bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold animate-pulse",
        };
      case "seated":
        return {
          label: "SEATED",
          icon: Armchair,
          styles: "bg-emerald-500/25 border-emerald-400 text-emerald-400 font-black",
        };
      case "completed":
        return {
          label: "COMPLETED",
          icon: CheckCheck,
          styles: "bg-zinc-800 border-white/10 text-zinc-400",
        };
      case "cancelled":
        return {
          label: "CANCELLED",
          icon: XCircle,
          styles: "bg-rose-500/15 border-rose-500/30 text-rose-300",
        };
      case "no_show":
        return {
          label: "NO SHOW",
          icon: UserX,
          styles: "bg-zinc-900 border-rose-500/40 text-rose-400 font-bold",
        };
      default:
        return {
          label: status,
          icon: CheckCircle2,
          styles: "bg-zinc-800 text-zinc-400 border-white/10",
        };
    }
  };

  const { label, icon: IconComponent, styles } = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded border ${styles} ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <IconComponent className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{label}</span>
    </span>
  );
}
