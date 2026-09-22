import { RestaurantTable } from "../../floor/types";
import { WaitlistEntry, WaitEstimationResult } from "../types";

export interface IWaitEstimationService {
  estimateWait(
    partySize: number,
    preferredAreaId?: string,
    existingQueue?: WaitlistEntry[],
    activeTables?: RestaurantTable[]
  ): WaitEstimationResult;
}

export class DeterministicWaitEstimationService implements IWaitEstimationService {
  private readonly DEFAULT_CLEANING_BUFFER_MINUTES = 15;
  private readonly DEFAULT_DINING_DURATION_MINUTES = 75;

  estimateWait(
    partySize: number,
    preferredAreaId?: string,
    existingQueue: WaitlistEntry[] = [],
    activeTables: RestaurantTable[] = []
  ): WaitEstimationResult {
    // 1. Filter compatible physical tables that can accommodate partySize
    const compatibleTables = activeTables.filter((table) => {
      if (!table.is_active || table.status === "blocked") return false;
      if (preferredAreaId && preferredAreaId !== "all" && table.seating_area_id !== preferredAreaId) {
        return false;
      }
      return table.maximum_party_size >= partySize && table.minimum_party_size <= partySize;
    });

    // 2. Count active parties ahead in the queue requiring compatible capacity
    const activeQueueAhead = existingQueue.filter(
      (entry) =>
        (entry.status === "waiting" || entry.status === "notified" || entry.status === "table_preparing") &&
        entry.party_size <= partySize + 2 &&
        entry.party_size >= partySize - 2
    );
    const partiesAheadCount = activeQueueAhead.length;

    // 3. Check if any compatible table is currently AVAILABLE right now
    const availableTables = compatibleTables.filter((t) => t.status === "available");
    if (availableTables.length > partiesAheadCount) {
      return {
        estimatedWaitMinutes: 0,
        compatibleTablesCount: compatibleTables.length,
        partiesAheadCount,
        basis: `${availableTables.length} compatible tables available immediately in selected area.`,
        earliestTableReleaseTime: "Now",
      };
    }

    // 4. Calculate table turnover projections
    let earliestTurnoverMinutes = 999;
    const tableTurnoverEstimates: number[] = [];

    compatibleTables.forEach((table) => {
      if (table.status === "cleaning") {
        // Table in cleaning: ready in ~10 minutes
        tableTurnoverEstimates.push(10);
      } else if (table.status === "bill_requested") {
        // Bill requested: ready in ~15 minutes (5 min pay + 10 min clean)
        tableTurnoverEstimates.push(15);
      } else if (table.status === "dining" || table.status === "seated" || table.status === "ordering") {
        const session = table.current_session;
        const elapsed = session ? session.elapsedMinutes : 30;
        const totalDuration = session ? session.expectedDurationMinutes : this.DEFAULT_DINING_DURATION_MINUTES;
        const remainingDining = Math.max(5, totalDuration - elapsed);
        const turnoverTime = remainingDining + this.DEFAULT_CLEANING_BUFFER_MINUTES;
        tableTurnoverEstimates.push(turnoverTime);
      } else if (table.status === "reserved" || table.status === "arriving") {
        // Reserved tables generally not immediately assignable for walk-ins without a gap
        tableTurnoverEstimates.push(90);
      }
    });

    // Sort turnover times from earliest to latest
    tableTurnoverEstimates.sort((a, b) => a - b);

    if (tableTurnoverEstimates.length > 0) {
      // Pick the turnover slot matching queue position
      const targetSlotIndex = Math.min(partiesAheadCount, tableTurnoverEstimates.length - 1);
      earliestTurnoverMinutes = tableTurnoverEstimates[targetSlotIndex];
    } else {
      // Default fallback if no tables are matched
      earliestTurnoverMinutes = 20 + partiesAheadCount * 10;
    }

    // Round to nearest 5 minutes for hospitality clarity
    const roundedMinutes = Math.max(5, Math.ceil(earliestTurnoverMinutes / 5) * 5);

    const earliestReleaseDate = new Date(Date.now() + roundedMinutes * 60 * 1000);
    const timeFormatted = earliestReleaseDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
      estimatedWaitMinutes: roundedMinutes,
      compatibleTablesCount: compatibleTables.length,
      partiesAheadCount,
      basis: `Calculated from ${compatibleTables.length} compatible tables with ${partiesAheadCount} parties ahead and 15m turnover buffer.`,
      earliestTableReleaseTime: timeFormatted,
    };
  }
}
