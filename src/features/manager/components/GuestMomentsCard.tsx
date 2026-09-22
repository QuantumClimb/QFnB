import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Crown, Cake, Heart, AlertOctagon, ArrowUpRight } from 'lucide-react';
import { GuestMomentItem } from '../types';

interface GuestMomentsCardProps {
  moments: GuestMomentItem[];
}

export const GuestMomentsCard: React.FC<GuestMomentsCardProps> = ({ moments }) => {
  const navigate = useNavigate();

  const vipCount = moments.filter((m) => m.type === 'VIP').length;
  const birthdayCount = moments.filter((m) => m.type === 'BIRTHDAY').length;
  const anniversaryCount = moments.filter((m) => m.type === 'ANNIVERSARY').length;
  const allergyCount = moments.filter((m) => m.type === 'ALLERGY').length;

  return (
    <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23262D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">VIPs, Celebrations & Dietary Care</h3>
              <p className="text-xs text-[#8E929C]">Hospitality moments & safety alerts for service leads</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/guests')}
            className="text-xs text-[#8E929C] hover:text-purple-400 flex items-center gap-1 transition-colors"
          >
            <span>Guest CRM</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Stat Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-4">
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" /> VIP Diners
            </span>
            <span className="text-lg font-mono font-bold text-amber-300">{vipCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block flex items-center gap-1">
              <Cake className="w-3 h-3 text-pink-400" /> Birthdays
            </span>
            <span className="text-lg font-mono font-bold text-pink-300">{birthdayCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> Anniversaries
            </span>
            <span className="text-lg font-mono font-bold text-rose-300">{anniversaryCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block flex items-center gap-1">
              <AlertOctagon className="w-3 h-3 text-red-400" /> Allergies
            </span>
            <span className={`text-lg font-mono font-bold ${allergyCount > 0 ? 'text-red-400' : 'text-white'}`}>
              {allergyCount}
            </span>
          </div>
        </div>

        {/* Guest Highlight Items */}
        <div className="space-y-2 mb-2">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#8E929C]">Service Highlights</div>

          {moments.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#181A20] border border-[#23262D] text-center text-xs text-[#8E929C]">
              No flagged celebrations or allergies for current service.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {moments.map((m, idx) => (
                <div
                  key={`${m.guestName}-${m.type}-${idx}`}
                  onClick={() => navigate(m.targetRoute || '/app/guests')}
                  className="p-2.5 rounded-lg bg-[#181A20] hover:bg-[#20232B] border border-[#2A2E37] cursor-pointer transition-colors flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{m.guestName}</span>
                      {m.tableNumber && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#262A34] text-[#C0C4CE]">
                          Table {m.tableNumber}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border ${
                          m.type === 'ALLERGY'
                            ? 'bg-red-950/40 text-red-300 border-red-800/40'
                            : m.type === 'VIP'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                            : m.type === 'BIRTHDAY'
                            ? 'bg-pink-950/40 text-pink-300 border-pink-800/40'
                            : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                        }`}
                      >
                        {m.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A0A4AE] leading-relaxed">{m.details}</p>
                  </div>

                  {m.time && (
                    <span className="text-[10px] font-mono text-purple-400">
                      {m.time}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#23262D] flex items-center justify-between text-xs text-[#8E929C]">
        <span className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-pink-400" />
          Tabletouch Protocol Active
        </span>
        <span className="font-mono text-white">{moments.length} Priority Moments</span>
      </div>
    </div>
  );
};
