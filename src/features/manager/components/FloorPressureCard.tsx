import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, AlertCircle, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';
import { ManagerFloorPressure } from '../types';

interface FloorPressureCardProps {
  floor: ManagerFloorPressure;
}

export const FloorPressureCard: React.FC<FloorPressureCardProps> = ({ floor }) => {
  const navigate = useNavigate();
  const totalTables = floor.occupiedCount + floor.availableCount + floor.reservedCount + floor.arrivingCount + floor.cleaningCount + floor.blockedCount;
  const occupancyRate = totalTables > 0 ? Math.round((floor.occupiedCount / totalTables) * 100) : 0;

  return (
    <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23262D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Floor & Seating Pressure</h3>
              <p className="text-xs text-[#8E929C]">Physical occupancy across service areas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/floor')}
            className="text-xs text-[#8E929C] hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <span>Open Floor</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* High-level stats */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Occupancy</span>
            <span className="text-lg font-mono font-bold text-white">{occupancyRate}%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Occupied Tables</span>
            <span className="text-lg font-mono font-bold text-white">{floor.occupiedCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Needs Attention</span>
            <span className={`text-lg font-mono font-bold ${floor.tablesNeedingAttention.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {floor.tablesNeedingAttention.length}
            </span>
          </div>
        </div>

        {/* Zone Breakdown */}
        <div className="space-y-3 mb-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#8E929C]">Service Areas</div>
          {floor.zoneSummaries.map((zone) => {
            const pct = zone.occupancyPercentage;
            return (
              <div key={zone.areaId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium">{zone.areaName}</span>
                  <span className="text-[#8E929C] font-mono">
                    {zone.occupied} / {zone.total} tables ({pct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1F222A] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Attention Tables List */}
        {floor.tablesNeedingAttention.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#23262D] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Tables Requiring Floor Check
              </span>
              <span className="text-[11px] text-[#8E929C]">{floor.tablesNeedingAttention.length} tables</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {floor.tablesNeedingAttention.map((t) => (
                <div
                  key={t.tableId}
                  onClick={() => navigate(t.targetRoute || '/app/floor')}
                  className="p-2 rounded-lg bg-[#181A20] hover:bg-[#20232B] border border-[#2A2E37] cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white px-1.5 py-0.5 rounded bg-[#262A34]">
                      {t.tableNumber}
                    </span>
                    <span className="text-[#C0C4CE]">{t.reason}</span>
                  </div>
                  {t.minutesElapsed && (
                    <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.minutesElapsed}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#23262D] flex items-center justify-between text-xs text-[#8E929C]">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {floor.availableCount} Tables Ready for Seating
        </span>
        <span className="font-mono">{totalTables} Physical Units</span>
      </div>
    </div>
  );
};
