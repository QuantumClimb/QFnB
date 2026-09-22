import React from "react";
import { useFloor } from "../context/FloorContext";
import { Grid, Sun, Wine, Crown } from "lucide-react";

export function FloorZoneTabs() {
  const { areas, selectedAreaId, setSelectedAreaId, tables } = useFloor();

  const getAreaIcon = (id: string) => {
    switch (id) {
      case "area-terrace":
        return Sun;
      case "area-bar":
        return Wine;
      case "area-pdr":
        return Crown;
      default:
        return Grid;
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
      {/* All Areas Tab */}
      <button
        onClick={() => setSelectedAreaId("all")}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${
          selectedAreaId === "all"
            ? "bg-purple-600/20 border-purple-500/50 text-white font-bold shadow-md shadow-purple-950/30"
            : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
        }`}
      >
        <Grid className="w-3.5 h-3.5 text-purple-400" />
        <span>ALL ZONES ({tables.length})</span>
      </button>

      {/* Specific Area Tabs */}
      {areas.map((area) => {
        const IconComponent = getAreaIcon(area.id);
        const isSelected = selectedAreaId === area.id;
        const areaTablesCount = tables.filter((t) => t.seating_area_id === area.id).length;

        return (
          <button
            key={area.id}
            onClick={() => setSelectedAreaId(area.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${
              isSelected
                ? "bg-purple-600/20 border-purple-500/50 text-white font-bold shadow-md shadow-purple-950/30"
                : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
            }`}
          >
            <IconComponent className={`w-3.5 h-3.5 ${isSelected ? "text-purple-400" : "text-zinc-400"}`} />
            <span>{area.name.toUpperCase()} ({areaTablesCount})</span>
          </button>
        );
      })}
    </div>
  );
}
