import React from 'react';
import { 
  Flame, 
  MapPin, 
  RotateCw, 
  Clock, 
  Users, 
  HeartHandshake, 
  Sparkles, 
  HelpCircle,
  Split
} from 'lucide-react';
import { ManagerBasicInsights } from '../types';

interface ManagerInsightsTabProps {
  insights: ManagerBasicInsights;
}

export const ManagerInsightsTab: React.FC<ManagerInsightsTabProps> = ({ insights }) => {
  return (
    <div className="space-y-6">
      {/* Intro Note */}
      <div className="bg-[#121316] border border-[#23262D] rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Basic Operational Insights</h3>
          <p className="text-xs text-[#8E929C] mt-0.5">
            Transparent operational metrics derived from active table sessions, reservation logs, and kitchen tickets.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#181A20] text-amber-400 border border-[#23262D]">
          FORMULA: OPERATIONAL ONLY
        </span>
      </div>

      {/* 6 Key Operational Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1: Peak Service Period */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8E929C] uppercase tracking-wider">Peak Service Period</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-bold text-white mb-1">
              {insights.busiestServicePeriod}
            </div>
            <p className="text-xs text-[#8E929C] leading-relaxed">
              Period with the highest concentration of concurrent seated covers and kitchen ticket dispatches.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#23262D] text-[11px] text-[#8E929C] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span>Shift pacing peaked at 85% concurrent seat utilization</span>
          </div>
        </div>

        {/* Metric 2: Most Utilized Area */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8E929C] uppercase tracking-wider">Most Utilized Area</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-bold text-white mb-1">
              {insights.mostUsedSeatingArea}
            </div>
            <p className="text-xs text-[#8E929C] leading-relaxed">
              Zone with the highest cumulative table occupancy rate across the entire service duration.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#23262D] text-[11px] text-[#8E929C] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Calculated from active table seating sessions vs total tables</span>
          </div>
        </div>

        {/* Metric 3: Average Table Turn Time */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8E929C] uppercase tracking-wider">Average Table Turn</span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <RotateCw className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-bold text-white mb-1">
              {insights.averageTableTurnMinutes} min
            </div>
            <p className="text-xs text-[#8E929C] leading-relaxed">
              Mean duration between table seating and table clearance across all completed parties today.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#23262D] text-[11px] text-[#8E929C] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            <span>Target dinner turn window: 75–90 min</span>
          </div>
        </div>

        {/* Metric 4: Average Kitchen Prep Time */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8E929C] uppercase tracking-wider">Average Kitchen Prep</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-bold text-white mb-1">
              {insights.averageOrderPrepMinutes} min
            </div>
            <p className="text-xs text-[#8E929C] leading-relaxed">
              Average time from order ticket firing to expediter pass status across food and beverage stations.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#23262D] text-[11px] text-[#8E929C] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span>Target kitchen ticket fulfillment: 15–20 min</span>
          </div>
        </div>

        {/* Metric 5: Average Waitlist Wait */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8E929C] uppercase tracking-wider">Average Waitlist Delay</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-bold text-white mb-1">
              {insights.averageWaitMinutes} min
            </div>
            <p className="text-xs text-[#8E929C] leading-relaxed">
              Average elapsed time between walk-in check-in at host stand and table seating notification.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#23262D] text-[11px] text-[#8E929C] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Calculated from resolved waitlist entries</span>
          </div>
        </div>

        {/* Metric 6: Repeat Guest Rate */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8E929C] uppercase tracking-wider">Guest Return Rate</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-bold text-white mb-1">
              {insights.guestReturnRate.percentage}%
            </div>
            <p className="text-xs text-[#8E929C] leading-relaxed">
              Percentage of recognized guests with prior recorded visits in the guest CRM profile database.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#23262D] text-[11px] text-[#8E929C] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span>{insights.guestReturnRate.returningGuests} returning / {insights.guestReturnRate.totalGuestsAnalyzed} total profiles</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: 2 Visual Ratio Split Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ratio 1: Reservation Source Mix */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Split className="w-4 h-4 text-sky-400" />
              <h4 className="text-sm font-semibold text-white">Reservation Source Mix</h4>
            </div>
            <span className="text-xs font-mono text-[#8E929C]">Booking Channels</span>
          </div>

          <div className="space-y-3">
            {insights.reservationSourceMix.map((src) => (
              <div key={src.source} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white capitalize">{src.source.replace('_', ' ')}</span>
                  <span className="font-mono text-[#8E929C]">{src.count} bookings ({src.percentage}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1F222A] overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${src.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#8E929C]">
            Shows proportion of bookings originating across online channels, staff entries, and concierge.
          </p>
        </div>

        {/* Ratio 2: Most Booked Experience & Service Mix */}
        <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-white">Top Booked Hospitality Package</h4>
            </div>
            <span className="text-xs font-mono text-purple-400">Experiences</span>
          </div>

          <div className="p-3 rounded-lg bg-[#181A20] border border-[#23262D] space-y-1">
            <span className="text-xs text-[#8E929C] block">Highest Requested Package</span>
            <span className="text-base font-semibold text-white">{insights.mostBookedExperience}</span>
            <p className="text-[11px] text-[#8E929C] mt-1">
              Consistently attached to VIP and celebration dinner reservations.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#8E929C] uppercase tracking-wider">Service Period Distribution</div>
            {insights.servicePeriodMix.map((sp) => (
              <div key={sp.period} className="flex items-center justify-between text-xs">
                <span className="text-white capitalize">{sp.period.toLowerCase()}</span>
                <span className="font-mono text-purple-400">{sp.covers} covers ({sp.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
