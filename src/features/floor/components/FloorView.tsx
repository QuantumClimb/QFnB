import React, { useState } from "react";
import { FloorHeader } from "./FloorHeader";
import { FloorZoneTabs } from "./FloorZoneTabs";
import { FloorMapCanvas } from "./FloorMapCanvas";
import { TableCard } from "./TableCard";
import { TableDetailDrawer } from "./TableDetailDrawer";
import { SeatReservationModal } from "./SeatReservationModal";
import { SeatWalkInModal } from "./SeatWalkInModal";
import { MoveGuestModal } from "./MoveGuestModal";
import { SmartAvailabilityPanel } from "./SmartAvailabilityPanel";
import { useFloor } from "../context/FloorContext";
import { AlertCircle, RotateCw } from "lucide-react";
import { RestaurantTable } from "../types";

export function FloorView() {
  const { 
    tables, 
    selectedTable, 
    setSelectedTable, 
    isLoading, 
    error, 
    refreshFloor,
    activeModal,
    setActiveModal,
    modalTargetTable,
    setModalTargetTable 
  } = useFloor();

  const [viewMode, setViewMode] = useState<"canvas" | "grid">("canvas");

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table);
  };

  if (error) {
    return (
      <div className="p-8 bg-zinc-900 border border-rose-500/30 rounded-2xl text-center space-y-4 font-mono">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white uppercase">UNABLE TO LOAD FLOOR MATRIX</h3>
        <p className="text-zinc-400 text-xs max-w-md mx-auto font-sans">{error}</p>
        <button
          onClick={() => refreshFloor()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retry Service Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      
      {/* 1. Header with operational counters and view mode switcher */}
      <FloorHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 2. Zone Filter Tabs */}
      <FloorZoneTabs />

      {/* 3. Main Floor View: Canvas Matrix or Cards Feed */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-36 bg-zinc-900 border border-white/5 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Canvas Map View (Desktop & Tablet) */}
          <div className={`${viewMode === "canvas" ? "block" : "hidden lg:block"}`}>
            <FloorMapCanvas onSelectTable={handleSelectTable} />
          </div>

          {/* Cards Grid View (Mobile default & Tablet/Desktop alternate) */}
          <div className={`${viewMode === "grid" ? "block" : "block lg:hidden"} space-y-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onSelect={handleSelectTable}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* 4. Table Detail Slide-Over Drawer */}
      <TableDetailDrawer
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
      />

      {/* 5. Modal Workflows */}
      <SeatReservationModal
        isOpen={activeModal === "seat_reservation"}
        targetTable={modalTargetTable || selectedTable}
        onClose={() => {
          setActiveModal(null);
          setModalTargetTable(null);
        }}
      />

      <SeatWalkInModal
        isOpen={activeModal === "seat_walkin"}
        targetTable={modalTargetTable || selectedTable}
        onClose={() => {
          setActiveModal(null);
          setModalTargetTable(null);
        }}
      />

      <MoveGuestModal
        isOpen={activeModal === "move_guest"}
        sourceTable={modalTargetTable || selectedTable}
        onClose={() => {
          setActiveModal(null);
          setModalTargetTable(null);
        }}
      />

      <SmartAvailabilityPanel
        isOpen={activeModal === "smart_availability"}
        onClose={() => setActiveModal(null)}
      />

    </div>
  );
}
