import React from 'react';
import { History, CheckCircle, Users, Utensils, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { OperationalTimelineEvent } from '../types';

interface OperationalTimelineCardProps {
  events: OperationalTimelineEvent[];
}

export const OperationalTimelineCard: React.FC<OperationalTimelineCardProps> = ({ events }) => {
  const getEventIcon = (category: OperationalTimelineEvent['category']) => {
    switch (category) {
      case 'floor':
        return <CheckCircle className="w-3.5 h-3.5 text-sky-400" />;
      case 'order':
        return <Utensils className="w-3.5 h-3.5 text-rose-400" />;
      case 'queue':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'reservation':
        return <Users className="w-3.5 h-3.5 text-emerald-400" />;
      case 'experience':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-[#8E929C]" />;
    }
  };

  return (
    <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23262D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#181A20] border border-[#23262D] flex items-center justify-center text-[#8E929C]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Shift Operational Stream</h3>
              <p className="text-xs text-[#8E929C]">Real-time audit log of floor & kitchen actions</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#181A20] border border-[#23262D] text-[#8E929C]">
            LIVE LOG
          </span>
        </div>

        {/* Stream List */}
        <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
          {events.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#8E929C]">No events logged yet for this shift.</div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#181A20] border border-[#262A34] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getEventIcon(evt.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-white truncate">{evt.title}</span>
                    <span className="text-[10px] font-mono text-[#8E929C] flex-shrink-0">
                      {evt.time}
                    </span>
                  </div>
                  {evt.description && (
                    <p className="text-[11px] text-[#8E929C] leading-snug mt-0.5">{evt.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#23262D] flex items-center justify-between text-xs text-[#8E929C]">
        <span>Service Audit Active</span>
        <span className="font-mono">{events.length} Events In Log</span>
      </div>
    </div>
  );
};
