import React from 'react';
import { 
  CalendarDays, 
  Users, 
  Clock, 
  UtensilsCrossed, 
  Wine, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { ManagerTodaySummary } from '../types';

interface ManagerTodayTabProps {
  today: ManagerTodaySummary;
}

export const ManagerTodayTab: React.FC<ManagerTodayTabProps> = ({ today }) => {
  return (
    <div className="space-y-6">
      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#8E929C] mb-2">
            <span>Total Day Covers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{today.guestsSeatedToday}</span>
            <span className="text-xs text-[#8E929C]">/ {today.totalCoversToday} expected</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{Math.round((today.guestsSeatedToday / Math.max(today.totalCoversToday, 1)) * 100)}% shift progress</span>
          </div>
        </div>

        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#8E929C] mb-2">
            <span>Reservations Executed</span>
            <CalendarDays className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{today.completedReservationsCount}</span>
            <span className="text-xs text-[#8E929C]">/ {today.reservationsTodayCount} total</span>
          </div>
          <div className="mt-2 text-[11px] text-[#8E929C] flex items-center gap-2">
            <span className="text-rose-400">{today.noShowCount} no-shows</span>
            <span>·</span>
            <span>{today.cancellationCount} cancelled</span>
          </div>
        </div>

        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#8E929C] mb-2">
            <span>Walk-In Volume</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{today.walkInCoversCount}</span>
            <span className="text-xs text-[#8E929C]">covers seated</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400 font-mono">
            <span>Waitlist throughput: {today.waitlistTotalPartiesToday} parties logged</span>
          </div>
        </div>

        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#8E929C] mb-2">
            <span>Kitchen Orders Done</span>
            <UtensilsCrossed className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{today.completedOrdersCount}</span>
            <span className="text-xs text-[#8E929C]">orders fulfilled</span>
          </div>
          <div className="mt-2 text-[11px] text-[#8E929C]">
            <span>Avg ticket pace: 16 min</span>
          </div>
        </div>
      </div>

      {/* Grid: 2 detailed operational breakdown panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Front of House & Host Stand Breakdown */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#23262D]">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Front of House Shift Operational Audit</h3>
              <p className="text-xs text-[#8E929C]">Booking fulfilment and walk-in host stand pacing</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#181A20] border border-[#23262D] text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium">Fulfilled Reservations</span>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {today.completedReservationsCount} / {today.reservationsTodayCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#181A20] border border-[#23262D] text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-white font-medium">Walk-In Diners Accommodated</span>
              </div>
              <span className="font-mono font-bold text-white text-sm">
                {today.walkInCoversCount} covers
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#181A20] border border-[#23262D] text-xs">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-white font-medium">Unfulfilled / Missed Bookings</span>
              </div>
              <span className="font-mono font-bold text-rose-400 text-sm">
                {today.noShowCount} no-show · {today.cancellationCount} cancelled
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#181A20] border border-[#23262D] text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-white font-medium">Total Waitlist Turnover</span>
              </div>
              <span className="font-mono font-bold text-[#8E929C] text-sm">
                {today.waitlistTotalPartiesToday} parties processed
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: Hospitality & Experience Fulfilment */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#23262D]">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Hospitality & Package Execution</h3>
              <p className="text-xs text-[#8E929C]">Special dining experiences & celebratory table touches</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#181A20] border border-[#23262D] text-xs">
              <div className="flex items-center gap-2">
                <Wine className="w-4 h-4 text-purple-400" />
                <span className="text-white font-medium">Hospitality Experiences Delivered</span>
              </div>
              <span className="font-mono font-bold text-purple-300 text-sm">
                {today.experienceBookingsCount} packages
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#181A20] border border-[#23262D] text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium">Kitchen Orders Dispatched</span>
              </div>
              <span className="font-mono font-bold text-white text-sm">
                {today.completedOrdersCount} tickets
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#181A20] border border-[#23262D] text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span className="text-white font-medium">Total Patrons Seated</span>
              </div>
              <span className="font-mono font-bold text-sky-300 text-sm">
                {today.guestsSeatedToday} patrons
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#181A20] border border-[#23262D] text-xs">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                <span className="text-white font-medium">Expected Shift Covers</span>
              </div>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {today.totalCoversToday} covers target
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
