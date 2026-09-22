import React from "react";
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Check, 
  ExternalLink,
  Sparkles
} from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { ServiceAlert } from "../types";

export function NeedsAttentionPanel() {
  const { data, dismissAlert } = useDashboard();
  const alerts = data?.serviceAlerts || [];

  if (alerts.length === 0) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white uppercase tracking-wider">NEEDS ATTENTION</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">ALL CLEAR</span>
        </div>
        <div className="py-6 text-center text-zinc-400 font-sans text-xs">
          No operational bottlenecks or urgent alerts. All floor stations running smoothly.
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity: ServiceAlert["severity"]) => {
    switch (severity) {
      case "urgent":
        return {
          icon: AlertOctagon,
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
          iconColor: "text-rose-400",
          label: "URGENT",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          iconColor: "text-amber-400",
          label: "WARNING",
        };
      default:
        return {
          icon: Info,
          bg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
          iconColor: "text-purple-400",
          label: "ACTION REQ",
        };
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 font-mono text-xs shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            NEEDS ATTENTION ({alerts.length})
          </span>
        </div>
        <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
          LIVE SERVICE WATCH
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = getSeverityBadge(alert.severity);
          const IconComponent = config.icon;

          return (
            <div
              key={alert.id}
              className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                alert.severity === "urgent" 
                  ? "bg-rose-950/20 border-rose-500/30" 
                  : alert.severity === "warning" 
                  ? "bg-amber-950/20 border-amber-500/30" 
                  : "bg-zinc-950 border-white/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg border ${config.bg} flex-shrink-0 mt-0.5`}>
                  <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-xs">{alert.title}</span>
                    <span className="text-[10px] text-zinc-500 font-sans">• {alert.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    {alert.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                {alert.actionLabel && (
                  <button 
                    onClick={() => dismissAlert(alert.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded text-[11px] font-mono transition-colors"
                  >
                    <span>{alert.actionLabel}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </button>
                )}
                
                <button
                  onClick={() => dismissAlert(alert.id)}
                  title="Acknowledge and dismiss"
                  className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
