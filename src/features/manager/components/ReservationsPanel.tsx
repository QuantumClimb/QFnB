import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, ArrowUpRight, Crown, Sparkles } from 'lucide-react';
import { ManagerReservationPressure, UpcomingArrivalItem } from '../types';

interface ReservationsPanelProps {
  reservations: ManagerReservationPressure;
}

export const ReservationsPanel: React.FC<ReservationsPanelProps> = ({ reservations }) => {
  const navigate = useNavigate();

  const nextCovers = reservations.nextArrivals.reduce((sum, item) => sum + item.partySize, 0);

  return (
    <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23262D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Reservations Flow</h3>
              <p className="text-xs text-[#8E929C]">Incoming bookings & front-desk pacing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/reservations')}
            className="text-xs text-[#8E929C] hover:text-sky-400 flex items-center gap-1 transition-colors"
          >
            <span>Bookings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Summary Stat Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-4">
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Upcoming</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-mono font-bold text-white">{reservations.nextArrivals.length}</span>
              <span className="text-xs text-[#8E929C]">({nextCovers} cvs)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Late Arrivals</span>
            <span className={`text-lg font-mono font-bold ${reservations.lateArrivals.length > 0 ? 'text-rose-400' : 'text-[#8E929C]'}`}>
              {reservations.lateArrivals.length}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Arrived · Waiting</span>
            <span className={`text-lg font-mono font-bold ${reservations.arrivedNotSeated.length > 0 ? 'text-amber-400' : 'text-[#8E929C]'}`}>
              {reservations.arrivedNotSeated.length}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">VIP Arrivals</span>
            <span className={`text-lg font-mono font-bold ${reservations.vipArrivals.length > 0 ? 'text-amber-300' : 'text-[#8E929C]'}`}>
              {reservations.vipArrivals.length}
            </span>
          </div>
        </div>

        {/* Upcoming List */}
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-between text-xs">
            <span className="uppercase tracking-wider font-semibold text-[#8E929C]">Immediate Incoming Guests</span>
            <span className="text-[11px] font-mono text-[#8E929C]">{reservations.nextArrivals.length} Scheduled</span>
          </div>

          {reservations.nextArrivals.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#181A20] border border-[#23262D] text-center text-xs text-[#8E929C]">
              No pending reservations for the remainder of this service.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {reservations.nextArrivals.map((item: UpcomingArrivalItem) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/app/reservations')}
                  className="p-2.5 rounded-lg bg-[#181A20] hover:bg-[#20232B] border border-[#2A2E37] cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-400 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/40">
                        {item.time}
                      </span>
                      <span className="font-semibold text-white">{item.guestName}</span>
                      <span className="text-[#8E929C] font-mono">({item.partySize}p)</span>
                      {item.tags && item.tags.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> {item.tags[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#8E929C]">
                      {item.experienceTitle && (
                        <span className="text-purple-400 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> {item.experienceTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                        item.status === 'arrived'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : item.status === 'seated'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#23262D] flex items-center justify-between text-xs text-[#8E929C]">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          Celebration Bookings: {reservations.celebrationCount} Special Occasions
        </span>
        <span className="font-mono text-white">Total: {reservations.totalReservationsToday} Bookings</span>
      </div>
    </div>
  );
};
