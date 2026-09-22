import React from "react";
import { 
  Users, 
  Clock, 
  MapPin, 
  Sparkles, 
  Bell, 
  CheckCircle2, 
  Utensils, 
  MoreVertical, 
  Phone,
  AlertTriangle,
  Flame,
  Award,
  Baby,
  Cake,
  Layers,
  ArrowRight
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { WaitlistEntry, WaitlistStatus, WaitlistPriorityTag } from "../types";

export function LiveQueueBoard() {
  const { 
    entries, 
    statusFilter,
    isLoading, 
    openDrawer, 
    openSeatModal, 
    openNotifyModal, 
    prepareTable, 
    markTableReady 
  } = useQueue();

  const calculateElapsedMinutes = (joinedAt: string): number => {
    const diffMs = Date.now() - new Date(joinedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getStatusBadge = (status: WaitlistStatus) => {
    switch (status) {
      case "ready":
        return {
          label: "TABLE READY",
          bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
          dot: "bg-emerald-400 animate-pulse",
        };
      case "table_preparing":
        return {
          label: "TABLE PREPARING",
          bg: "bg-purple-500/15 border-purple-500/40 text-purple-300",
          dot: "bg-purple-400 animate-spin",
        };
      case "notified":
        return {
          label: "NOTIFIED",
          bg: "bg-cyan-500/15 border-cyan-500/40 text-cyan-400",
          dot: "bg-cyan-400",
        };
      case "seated":
        return {
          label: "SEATED",
          bg: "bg-blue-500/15 border-blue-500/40 text-blue-400",
          dot: "bg-blue-400",
        };
      case "no_response":
        return {
          label: "NO RESPONSE",
          bg: "bg-zinc-700/40 border-zinc-600 text-zinc-400",
          dot: "bg-zinc-400",
        };
      case "cancelled":
        return {
          label: "CANCELLED",
          bg: "bg-rose-900/30 border-rose-800 text-rose-400",
          dot: "bg-rose-400",
        };
      case "waiting":
      default:
        return {
          label: "WAITING",
          bg: "bg-amber-500/15 border-amber-500/40 text-amber-400",
          dot: "bg-amber-400",
        };
    }
  };

  const renderTagIcon = (tag: WaitlistPriorityTag) => {
    switch (tag) {
      case "VIP":
        return <Award className="w-3 h-3 text-amber-400" />;
      case "BIRTHDAY":
        return <Cake className="w-3 h-3 text-pink-400" />;
      case "HIGH_CHAIR":
        return <Baby className="w-3 h-3 text-cyan-400" />;
      case "HOTEL_GUEST":
        return <Sparkles className="w-3 h-3 text-indigo-400" />;
      case "SPECIAL_OCCASION":
        return <Flame className="w-3 h-3 text-amber-400" />;
      default:
        return null;
    }
  };

  const renderQueueCard = (entry: WaitlistEntry, derivedPosition?: string) => {
    const elapsed = calculateElapsedMinutes(entry.joined_at);
    const isOverdue = elapsed > entry.quoted_wait_minutes && (entry.status === "waiting" || entry.status === "notified");
    const overdueMinutes = elapsed - entry.quoted_wait_minutes;
    const statusBadge = getStatusBadge(entry.status);

    return (
      <div
        key={entry.id}
        onClick={() => openDrawer(entry)}
        className={`group relative bg-zinc-900/95 hover:bg-zinc-850 border rounded-xl p-4 transition-all duration-150 cursor-pointer shadow-md hover:shadow-xl ${
          isOverdue
            ? "border-amber-500/40 hover:border-amber-400/70"
            : entry.status === "ready"
            ? "border-emerald-500/40 hover:border-emerald-400/70 bg-emerald-950/10"
            : entry.status === "table_preparing"
            ? "border-purple-500/40 hover:border-purple-400/70 bg-purple-950/10"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        {/* Top Bar: Sequence / Action Tag + Status + Overdue */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {derivedPosition ? (
              <span className="font-mono text-lg font-black text-amber-400 tracking-wider">
                {derivedPosition}
              </span>
            ) : entry.assigned_table_number ? (
              <span className="font-mono text-xs font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40">
                {entry.assigned_table_number}
              </span>
            ) : null}

            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${statusBadge.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
              {statusBadge.label}
            </span>

            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-mono font-bold">
                <AlertTriangle className="w-2.5 h-2.5" />
                +{overdueMinutes}m
              </span>
            )}
          </div>

          {/* Action trigger icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDrawer(entry);
            }}
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Guest Name & Party Size */}
        <div className="mt-2.5 flex items-baseline justify-between">
          <div>
            <h3 className="font-sans text-base font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
              {entry.guest_name}
            </h3>
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] mt-0.5">
              <span className="flex items-center gap-1 text-zinc-300">
                <Users className="w-3 h-3 text-amber-400" />
                {entry.party_size} {entry.party_size === 1 ? "Guest" : "Guests"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-zinc-500" />
                {entry.phone}
              </span>
            </div>
          </div>

          {/* Ticket / Ref badge */}
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Ref: {entry.queue_number}
            </span>
          </div>
        </div>

        {/* Wait Pacing Bar */}
        <div className="mt-3.5 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-[11px] font-mono">
          {/* Dynamic Elapsed Wait */}
          <div className="bg-zinc-800/60 p-2 rounded-lg">
            <div className="text-zinc-500 text-[10px] uppercase">Waited</div>
            <div className={`font-bold mt-0.5 flex items-center gap-1 ${isOverdue ? "text-rose-400" : "text-white"}`}>
              <Clock className="w-3 h-3 text-amber-400" />
              {elapsed} min
            </div>
          </div>

          {/* Quoted Wait */}
          <div className="bg-zinc-800/60 p-2 rounded-lg">
            <div className="text-zinc-500 text-[10px] uppercase">Quoted</div>
            <div className="font-bold text-zinc-300 mt-0.5">
              {entry.quoted_wait_minutes} min
            </div>
          </div>

          {/* Zone Preference */}
          <div className="bg-zinc-800/60 p-2 rounded-lg">
            <div className="text-zinc-500 text-[10px] uppercase">Zone</div>
            <div className="font-bold text-zinc-300 mt-0.5 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
              {entry.preferred_seating_area_name || "Any Zone"}
            </div>
          </div>
        </div>

        {/* Informational Priority Tags (Informational context only - does not affect ordering) */}
        {entry.priority_tags && entry.priority_tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {entry.priority_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-zinc-300 text-[10px] font-mono"
              >
                {renderTagIcon(tag)}
                {tag.replace("_", " ")}
              </span>
            ))}
          </div>
        )}

        {/* Contextual Action Bar */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="text-[10px] font-mono text-zinc-500">
            via {entry.source.replace("_", " ").toUpperCase()}
          </div>

          <div className="flex items-center gap-1.5">
            {/* NOTIFY Trigger */}
            {(entry.status === "ready" || entry.status === "table_preparing" || entry.status === "waiting") && (
              <button
                onClick={() => openNotifyModal(entry)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-mono font-bold tracking-wider transition-colors"
              >
                <Bell className="w-3 h-3" />
                NOTIFY
              </button>
            )}

            {/* TABLE PREPARING Trigger */}
            {entry.status === "waiting" && (
              <button
                onClick={() => openDrawer(entry)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-bold tracking-wider transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                PREPARE
              </button>
            )}

            {/* MARK READY Trigger */}
            {entry.status === "table_preparing" && (
              <button
                onClick={() => markTableReady(entry.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold tracking-wider transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                READY
              </button>
            )}

            {/* SEAT GUEST Trigger */}
            {(entry.status === "ready" || entry.status === "table_preparing" || entry.status === "notified" || entry.status === "waiting") && (
              <button
                onClick={() => openSeatModal(entry)}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[11px] font-mono font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
              >
                <Utensils className="w-3 h-3" />
                SEAT
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
          Loading live queue feed...
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center space-y-3">
        <Users className="w-10 h-10 text-zinc-600 mx-auto" />
        <div className="font-mono text-sm font-bold text-white uppercase tracking-wider">
          No Guests in Current Queue Filter
        </div>
        <p className="text-zinc-400 font-sans text-xs max-w-sm mx-auto">
          Add new walk-in arrivals using the <span className="text-amber-400 font-mono font-bold">+ ADD TO WAITLIST</span> button above.
        </p>
      </div>
    );
  }

  // When viewing ALL: separate Action Stages (Ready / Preparing) from Active Waiting Queue
  if (statusFilter === "ALL") {
    const readyEntries = entries.filter((e) => e.status === "ready");
    const preparingEntries = entries.filter((e) => e.status === "table_preparing");
    // Position-bearing waiting queue: strictly sorted by joined_at ASC
    const waitingQueue = entries
      .filter((e) => e.status === "waiting" || e.status === "notified" || e.status === "arrived")
      .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());

    return (
      <div className="space-y-6">
        {/* Action Stage 1: READY FOR SEATING */}
        {readyEntries.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Ready For Seating ({readyEntries.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Action Stage • Table Assigned
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3.5">
              {readyEntries.map((entry) => renderQueueCard(entry))}
            </div>
          </div>
        )}

        {/* Action Stage 2: TABLES PREPARING */}
        {preparingEntries.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h2 className="font-mono text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Tables Preparing ({preparingEntries.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Action Stage • Table Cleaning / Setup
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3.5">
              {preparingEntries.map((entry) => renderQueueCard(entry))}
            </div>
          </div>
        )}

        {/* Primary Stage: ACTIVE WAITING QUEUE */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Waiting Queue ({waitingQueue.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">
              Ordered By Arrival Time (Fairness Ordering)
            </span>
          </div>

          {waitingQueue.length === 0 ? (
            <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs">
              No parties currently waiting in line.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3.5">
              {waitingQueue.map((entry, idx) => {
                const posStr = `#${(idx + 1).toString().padStart(2, "0")}`;
                return renderQueueCard(entry, posStr);
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // When filtering by specific status
  const isPositionBearing = statusFilter === "WAITING" || statusFilter === "NOTIFIED";
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3.5">
      {sortedEntries.map((entry, idx) => {
        const posStr = isPositionBearing ? `#${(idx + 1).toString().padStart(2, "0")}` : undefined;
        return renderQueueCard(entry, posStr);
      })}
    </div>
  );
}
