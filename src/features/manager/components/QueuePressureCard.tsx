import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ManagerQueuePressure } from '../types';

interface QueuePressureCardProps {
  queue: ManagerQueuePressure;
}

export const QueuePressureCard: React.FC<QueuePressureCardProps> = ({ queue }) => {
  const navigate = useNavigate();

  const getPressureBadge = (status: ManagerQueuePressure['pressureLevel']) => {
    switch (status) {
      case 'HIGH_WAIT':
        return {
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          label: 'HIGH DELAY',
        };
      case 'BUSY':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          label: 'BUSY SERVICE',
        };
      default:
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          label: 'FLOW NORMAL',
        };
    }
  };

  const badge = getPressureBadge(queue.pressureLevel);

  return (
    <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23262D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Waitlist & Queue Pressure</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-[#8E929C]">Walk-in staging & host stand wait times</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/queue')}
            className="text-xs text-[#8E929C] hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>Waitlist</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Stat Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-4">
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Waiting Parties</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-mono font-bold text-white">{queue.waitingPartiesCount}</span>
              <span className="text-xs text-[#8E929C]">({Math.round(queue.guestsWaitingCount)} cvs)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Avg Wait</span>
            <span className="text-lg font-mono font-bold text-white">{queue.averageWaitMinutes}m</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Longest Wait</span>
            <span className={`text-lg font-mono font-bold ${queue.longestWaitMinutes > 30 ? 'text-rose-400' : 'text-amber-400'}`}>
              {queue.longestWaitMinutes}m
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Notified / Ready</span>
            <span className={`text-lg font-mono font-bold ${queue.readyForSeatingCount > 0 ? 'text-emerald-400' : 'text-[#8E929C]'}`}>
              {queue.readyForSeatingCount}
            </span>
          </div>
        </div>

        {/* Operational Context Summary */}
        <div className="space-y-3 mb-2 p-3.5 rounded-lg bg-[#181A20] border border-[#23262D]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-medium">Tables Currently Preparing for Waitlist</span>
            <span className="font-mono font-bold text-emerald-400">{queue.tablesPreparingCount} tables</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-medium">Guests Ready for Host Stand Calling</span>
            <span className="font-mono font-bold text-sky-400">{queue.readyForSeatingCount} parties</span>
          </div>
          <p className="text-[11px] text-[#8E929C] leading-relaxed">
            Host stand queue status is currently {queue.pressureLevel.toLowerCase().replace('_', ' ')}. Estimated walk-in turnaround is {queue.averageWaitMinutes} minutes.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#23262D] flex items-center justify-between text-xs text-[#8E929C]">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Waitlist Capacity Monitored
        </span>
        <span className="font-mono text-white">Walk-in Flow</span>
      </div>
    </div>
  );
};
