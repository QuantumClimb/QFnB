import React from "react";
import { BookingSource } from "../types";
import { 
  UserPlus, 
  Phone, 
  MessageSquare, 
  Footprints, 
  Globe, 
  Sparkles, 
  Building, 
  Search, 
  HelpCircle 
} from "lucide-react";

interface ReservationSourceBadgeProps {
  source: BookingSource;
  showIconOnly?: boolean;
}

export function ReservationSourceBadge({ source, showIconOnly = false }: ReservationSourceBadgeProps) {
  const getSourceConfig = () => {
    switch (source) {
      case "staff":
        return {
          label: "Staff Entry",
          icon: UserPlus,
          styles: "text-purple-300 bg-purple-500/10 border-purple-500/30",
        };
      case "phone":
        return {
          label: "Phone Call",
          icon: Phone,
          styles: "text-amber-300 bg-amber-500/10 border-amber-500/30",
        };
      case "whatsapp":
        return {
          label: "WhatsApp",
          icon: MessageSquare,
          styles: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
        };
      case "walk_in":
        return {
          label: "Walk-In",
          icon: Footprints,
          styles: "text-blue-300 bg-blue-500/10 border-blue-500/30",
        };
      case "website":
        return {
          label: "Direct Web",
          icon: Globe,
          styles: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
        };
      case "q_restobar":
        return {
          label: "Q RESTOBAR",
          icon: Sparkles,
          styles: "text-purple-200 bg-purple-600/20 border-purple-400 font-bold",
        };
      case "hotel_concierge":
        return {
          label: "Hotel Concierge",
          icon: Building,
          styles: "text-amber-200 bg-amber-600/20 border-amber-500/40 font-semibold",
        };
      case "google":
        return {
          label: "Google Reserve",
          icon: Search,
          styles: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30",
        };
      default:
        return {
          label: "Direct Other",
          icon: HelpCircle,
          styles: "text-zinc-400 bg-zinc-800 border-white/10",
        };
    }
  };

  const { label, icon: IconComponent, styles } = getSourceConfig();

  if (showIconOnly) {
    return (
      <span title={label} className={`p-1 rounded border inline-flex items-center justify-center ${styles}`}>
        <IconComponent className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] ${styles}`}>
      <IconComponent className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}
