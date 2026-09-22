import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, ArrowUpRight } from 'lucide-react';
import { ServiceAlert } from '../types';

interface ServiceAlertsBannerProps {
  alerts: ServiceAlert[];
}

export const ServiceAlertsBanner: React.FC<ServiceAlertsBannerProps> = ({ alerts }) => {
  const navigate = useNavigate();

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-[#121316] border border-[#23262D] rounded-xl p-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">All Stations Operating Smoothly</span>
            <span className="text-[#8E929C] ml-2">— No critical service bottlenecks or delayed orders detected.</span>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono font-medium border border-emerald-500/20">
          HEALTH: OPTIMAL
        </span>
      </div>
    );
  }

  const getAlertStyle = (severity: ServiceAlert['severity']) => {
    switch (severity) {
      case 'URGENT':
        return {
          cardBg: 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60',
          iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: <AlertTriangle className="w-4 h-4" />,
          label: 'CRITICAL',
        };
      case 'ATTENTION':
        return {
          cardBg: 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60',
          iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'ATTENTION',
        };
      default:
        return {
          cardBg: 'bg-sky-950/20 border-sky-800/40 hover:border-sky-700/60',
          iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          icon: <Info className="w-4 h-4" />,
          label: 'INFO',
        };
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#8E929C]">Active Service Alerts</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#1C1E24] text-white border border-[#2E323B]">
            {alerts.length}
          </span>
        </div>
        <span className="text-xs text-[#8E929C]">Prioritize high-impact bottlenecks first</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map((alert) => {
          const style = getAlertStyle(alert.severity);
          return (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${style.cardBg}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
                      {style.icon}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${style.badge}`}>
                      {style.label} · {alert.type.replace('_', ' ')}
                    </span>
                  </div>
                  {alert.createdAt && (
                    <span className="text-[11px] font-mono text-[#8E929C]">
                      {alert.createdAt}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-white mb-1 leading-snug">{alert.title}</h4>
                <p className="text-xs text-[#A0A4AE] leading-relaxed mb-3">{alert.description}</p>
              </div>

              {alert.targetRoute && (
                <button
                  type="button"
                  onClick={() => alert.targetRoute && navigate(alert.targetRoute)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[#181A20] hover:bg-[#22252D] border border-[#2B2F38] text-xs font-medium text-white transition-colors flex items-center justify-between group"
                >
                  <span>{alert.actionLabel || 'Investigate Station'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8E929C] group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
