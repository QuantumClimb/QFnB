import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Clock, ArrowUpRight, Flame } from 'lucide-react';
import { ManagerOrderPressure } from '../types';

interface KitchenPressureCardProps {
  orders: ManagerOrderPressure;
}

export const KitchenPressureCard: React.FC<KitchenPressureCardProps> = ({ orders }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#121316] border border-[#23262D] rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#23262D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Kitchen & Bar Station Pressure</h3>
              <p className="text-xs text-[#8E929C]">Preparation load & delayed service items</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/orders')}
            className="text-xs text-[#8E929C] hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <span>Live Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Stat Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-4">
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Active Orders</span>
            <span className="text-lg font-mono font-bold text-white">{orders.ordersActiveCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Items Preparing</span>
            <span className="text-lg font-mono font-bold text-white">{orders.itemsPreparingCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Ready for Pass</span>
            <span className={`text-lg font-mono font-bold ${orders.itemsReadyCount > 0 ? 'text-amber-400' : 'text-white'}`}>
              {orders.itemsReadyCount}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D]">
            <span className="text-[11px] text-[#8E929C] block">Delayed Items</span>
            <span className={`text-lg font-mono font-bold ${orders.delayedItemsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {orders.delayedItemsCount}
            </span>
          </div>
        </div>

        {/* Station Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#8E929C]">Station Workloads</div>
          <div className="grid grid-cols-2 gap-2">
            {orders.stationLoad.map((st) => (
              <div key={st.station} className="p-2.5 rounded-lg bg-[#181A20] border border-[#23262D] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white capitalize">{st.station}</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    st.delayed > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {st.delayed > 0 ? 'DELAYED' : 'NORMAL'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8E929C]">
                  <span>{st.preparing} prep · {st.ready} ready</span>
                  {st.delayed > 0 && <span className="text-rose-400 font-medium font-mono">! {st.delayed} delayed</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expediter Status Note */}
        <div className="pt-2 border-t border-[#23262D] text-xs text-[#8E929C] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            {orders.delayedItemsCount > 0 ? 'Expediter Attention: Clear bottleneck items' : 'Expediter Monitor: All stations running smooth'}
          </span>
          <span className="font-mono text-white">Target Ticket: 15–20 min</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#23262D] flex items-center justify-between text-xs text-[#8E929C]">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-rose-400" />
          Average Prep Pace: 16 min
        </span>
        <span className="font-mono text-white">Station Sync Active</span>
      </div>
    </div>
  );
};
