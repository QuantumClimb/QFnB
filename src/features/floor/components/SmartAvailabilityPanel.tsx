import React, { useState } from "react";
import { 
  X, 
  Compass, 
  Clock, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck 
} from "lucide-react";
import { useFloor } from "../context/FloorContext";
import { SmartAvailabilityWindow } from "../types";

interface SmartAvailabilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartAvailabilityPanel({ isOpen, onClose }: SmartAvailabilityPanelProps) {
  const { 
    smartWindows, 
    evaluateSmartWindows, 
    areas, 
    tables, 
    setModalTargetTable, 
    setActiveModal 
  } = useFloor();

  const [partySize, setPartySize] = useState<number>(2);
  const [preferredArea, setPreferredArea] = useState<string>("all");
  const [minDuration, setMinDuration] = useState<number>(75);
  const [cleaningBuffer, setCleaningBuffer] = useState<number>(15);

  if (!isOpen) return null;

  const handleRecalculate = (newPartySize: number, newArea: string, newDuration: number) => {
    evaluateSmartWindows({
      party_size: newPartySize,
      preferred_area_id: newArea,
      minimum_duration_minutes: newDuration,
      cleaning_buffer_minutes: cleaningBuffer,
    });
  };

  const handleFastSeat = (win: SmartAvailabilityWindow) => {
    const targetTable = tables.find((t) => t.id === win.table_id);
    if (targetTable) {
      setModalTargetTable(targetTable);
      setActiveModal("seat_walkin");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl font-mono text-xs">
        
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-white/10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white uppercase text-sm">
                SMART AVAILABILITY ENGINE
              </h3>
              <p className="text-[10px] text-zinc-400 font-sans">
                Discover optimal booking windows between dining reservations & turnarounds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter / Query Parameters */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-4 rounded-xl border border-white/10">
            
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                Party Size
              </label>
              <select
                value={partySize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPartySize(val);
                  handleRecalculate(val, preferredArea, minDuration);
                }}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/15 focus:border-emerald-500 rounded-lg text-white font-sans text-xs focus:outline-none"
              >
                <option value={2}>2 Guests (2-Top)</option>
                <option value={4}>4 Guests (4-Top)</option>
                <option value={6}>6 Guests (Large)</option>
                <option value={8}>8+ Guests (VIP/PDR)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                Zone Preference
              </label>
              <select
                value={preferredArea}
                onChange={(e) => {
                  const val = e.target.value;
                  setPreferredArea(val);
                  handleRecalculate(partySize, val, minDuration);
                }}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/15 focus:border-emerald-500 rounded-lg text-white font-sans text-xs focus:outline-none"
              >
                <option value="all">Any Zone</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                Min Duration
              </label>
              <select
                value={minDuration}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMinDuration(val);
                  handleRecalculate(partySize, preferredArea, val);
                }}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/15 focus:border-emerald-500 rounded-lg text-white font-sans text-xs focus:outline-none"
              >
                <option value={45}>45 mins (Quick)</option>
                <option value={60}>60 mins (Standard)</option>
                <option value={75}>75 mins (Dinner)</option>
                <option value={90}>90 mins (Tasting)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                Cleaning Buffer
              </label>
              <div className="px-3 py-2 bg-zinc-900/60 border border-white/10 rounded-lg text-zinc-300 font-mono text-xs flex items-center justify-between">
                <span>{cleaningBuffer} mins</span>
                <span className="text-[10px] text-zinc-500">Auto</span>
              </div>
            </div>

          </div>

          {/* Results List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
              <span>Discovered <strong className="text-white">{smartWindows.length}</strong> Bookable Windows</span>
              <span className="text-zinc-500">Includes {cleaningBuffer}m cleaning turn buffer</span>
            </div>

            {smartWindows.length === 0 ? (
              <div className="p-8 bg-zinc-950 border border-white/10 rounded-2xl text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
                <div className="font-bold text-white uppercase">NO OPEN WINDOWS MATCHING CRITERIA</div>
                <p className="text-zinc-400 text-xs font-sans max-w-sm mx-auto">
                  Try adjusting the party size or dining duration. Floor is operating near capacity.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {smartWindows.map((win, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      win.status === "immediate"
                        ? "bg-emerald-950/20 border-emerald-500/40"
                        : win.status === "upcoming_turn"
                        ? "bg-purple-950/20 border-purple-500/40"
                        : "bg-amber-950/20 border-amber-500/40"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap font-mono">
                        <span className="font-black text-white text-sm">Table {win.table_number}</span>
                        <span className="text-zinc-400 text-[11px]">({win.capacity}p • {win.seating_area_name})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          win.status === "immediate"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : win.status === "upcoming_turn"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}>
                          {win.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-white font-bold">{win.start_time} – {win.end_time}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-300">{win.window_duration_minutes}m total window</span>
                      </div>

                      <p className="text-[11px] text-zinc-400 font-sans pt-0.5">
                        {win.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => handleFastSeat(win)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs self-end sm:self-center flex-shrink-0 transition-all shadow active:scale-95"
                    >
                      <span>Seat at T-{win.table_number.replace("T-", "")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
