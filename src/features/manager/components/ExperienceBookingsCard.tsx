import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine, Sparkles, ArrowUpRight, PackageCheck } from 'lucide-react';
import { ManagerExperienceBookingItem } from '../types';

interface ExperienceBookingsCardProps {
  experiences: ManagerExperienceBookingItem[];
}

export const ExperienceBookingsCard: React.FC<ExperienceBookingsCardProps> = ({ experiences }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23262D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Wine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Active Experiences & Packages</h3>
              <p className="text-xs text-[#8E929C]">Hospitality setups, tasting menus & special packages</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/offers')}
            className="text-xs text-[#8E929C] hover:text-purple-400 flex items-center gap-1 transition-colors"
          >
            <span>Catalogue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Stat Pills */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Packages Booked</span>
            <span className="text-lg font-mono font-bold text-white">{experiences.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Add-On Bundles</span>
            <span className="text-lg font-mono font-bold text-purple-300">
              {experiences.reduce((acc, e) => acc + e.addons.length, 0)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Guests Included</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              {experiences.reduce((acc, e) => acc + e.partySize, 0)}
            </span>
          </div>
        </div>

        {/* Booked Experience Items */}
        <div className="space-y-2 mb-2">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#8E929C]">Service Execution Roster</div>

          {experiences.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#181A20] border border-[#23262D] text-center text-xs text-[#8E929C]">
              No custom experiences or packages scheduled for this shift.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {experiences.map((b) => (
                <div
                  key={b.reservationId}
                  onClick={() => navigate('/app/reservations')}
                  className="p-2.5 rounded-lg bg-[#181A20] hover:bg-[#20232B] border border-[#2A2E37] cursor-pointer transition-colors flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{b.experienceTitle}</span>
                      {b.tableLabel && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#262A34] text-[#C0C4CE]">
                          Table {b.tableLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8E929C]">
                      <span>Guest: {b.guestName} ({b.partySize}p)</span> · <span className="font-mono text-purple-400">{b.time}</span>
                    </div>
                    {b.addons.length > 0 && (
                      <p className="text-[11px] text-amber-300/90 italic flex items-center gap-1">
                        <PackageCheck className="w-3 h-3 text-amber-400" />
                        {b.addons.join(', ')}
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                      b.status === 'completed'
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                        : b.status === 'confirmed'
                        ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                        : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#23262D] flex items-center justify-between text-xs text-[#8E929C]">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          F&B Special Packages Engine
        </span>
        <span className="font-mono text-white">Live Service Sync</span>
      </div>
    </div>
  );
};
