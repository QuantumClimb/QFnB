import { 
  RestaurantTable, 
  SmartAvailabilityQuery, 
  SmartAvailabilityWindow 
} from "../types";

export interface ISmartAvailabilityService {
  findWindows(query: SmartAvailabilityQuery, tables: RestaurantTable[]): Promise<SmartAvailabilityWindow[]>;
}

class FixtureSmartAvailabilityService implements ISmartAvailabilityService {
  async findWindows(query: SmartAvailabilityQuery, tables: RestaurantTable[]): Promise<SmartAvailabilityWindow[]> {
    await new Promise((res) => setTimeout(res, 40));

    const partySize = query.party_size || 2;
    const cleaningBuffer = query.cleaning_buffer_minutes ?? 15;
    const minDuration = query.minimum_duration_minutes ?? 75;
    const nowTimeStr = query.current_time || "19:30";

    const [currentHour, currentMin] = nowTimeStr.split(":").map(Number);
    const currentTotalMins = currentHour * 60 + currentMin;

    const windows: SmartAvailabilityWindow[] = [];

    // Filter tables matching area and capacity bounds
    const candidateTables = tables.filter((t) => {
      if (query.preferred_area_id && query.preferred_area_id !== "all") {
        if (t.seating_area_id !== query.preferred_area_id) return false;
      }
      if (t.status === "blocked" || !t.is_active) return false;
      return t.capacity >= partySize && t.minimum_party_size <= partySize;
    });

    for (const table of candidateTables) {
      // Case 1: Table is currently Available
      if (table.status === "available" || table.status === "cleaning") {
        if (!table.next_reservation) {
          // Open-ended window
          const endTotalMins = currentTotalMins + 180; // 3 hours window
          const endHour = Math.floor(endTotalMins / 60) % 24;
          const endMin = endTotalMins % 60;
          const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

          windows.push({
            table_id: table.id,
            table_number: table.table_number,
            seating_area_name: table.seating_area_name || "Main Dining Room",
            capacity: table.capacity,
            shape: table.shape,
            start_time: nowTimeStr,
            end_time: endTimeStr,
            window_duration_minutes: 180,
            suggested_dining_duration_minutes: minDuration,
            cleaning_buffer_minutes: cleaningBuffer,
            status: "immediate",
            reason: "Table is open with no subsequent bookings tonight.",
          });
        } else {
          // Table has a next reservation (e.g. 20:30)
          const [nextHour, nextMin] = table.next_reservation.reservationTime.split(":").map(Number);
          const nextTotalMins = nextHour * 60 + nextMin;

          // Available window ends at: next_reservation - cleaning_buffer
          const availableEndTotalMins = nextTotalMins - cleaningBuffer;
          const windowDuration = availableEndTotalMins - currentTotalMins;

          if (windowDuration >= minDuration) {
            const endHour = Math.floor(availableEndTotalMins / 60) % 24;
            const endMin = availableEndTotalMins % 60;
            const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

            windows.push({
              table_id: table.id,
              table_number: table.table_number,
              seating_area_name: table.seating_area_name || "Main Dining Room",
              capacity: table.capacity,
              shape: table.shape,
              start_time: nowTimeStr,
              end_time: endTimeStr,
              window_duration_minutes: windowDuration,
              suggested_dining_duration_minutes: Math.min(windowDuration, minDuration),
              next_reservation_time: table.next_reservation.reservationTime,
              cleaning_buffer_minutes: cleaningBuffer,
              status: windowDuration > 90 ? "immediate" : "tight_window",
              reason: `Bookable until ${endTimeStr} (${windowDuration}m gap before ${table.next_reservation.guestName}'s reservation at ${table.next_reservation.reservationTime}).`,
            });
          }
        }
      }

      // Case 2: Table is currently in service (dining / bill_requested)
      if ((table.status === "dining" || table.status === "bill_requested" || table.status === "seated") && table.current_session) {
        const remainingDiningMins = Math.max(5, table.current_session.expectedDurationMinutes - table.current_session.elapsedMinutes);
        const nextPossibleStartMins = currentTotalMins + remainingDiningMins + cleaningBuffer;

        const startHour = Math.floor(nextPossibleStartMins / 60) % 24;
        const startMin = nextPossibleStartMins % 60;
        const startTimeStr = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;

        if (!table.next_reservation) {
          windows.push({
            table_id: table.id,
            table_number: table.table_number,
            seating_area_name: table.seating_area_name || "Main Dining Room",
            capacity: table.capacity,
            shape: table.shape,
            start_time: startTimeStr,
            end_time: "23:00",
            window_duration_minutes: 120,
            suggested_dining_duration_minutes: minDuration,
            cleaning_buffer_minutes: cleaningBuffer,
            status: "upcoming_turn",
            reason: `Upcoming turnaround estimated at ~${startTimeStr} following ${table.current_session.guestName}'s departure.`,
          });
        } else {
          const [nextHour, nextMin] = table.next_reservation.reservationTime.split(":").map(Number);
          const nextTotalMins = nextHour * 60 + nextMin;
          const availableEndTotalMins = nextTotalMins - cleaningBuffer;
          const windowDuration = availableEndTotalMins - nextPossibleStartMins;

          if (windowDuration >= minDuration) {
            const endHour = Math.floor(availableEndTotalMins / 60) % 24;
            const endMin = availableEndTotalMins % 60;
            const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

            windows.push({
              table_id: table.id,
              table_number: table.table_number,
              seating_area_name: table.seating_area_name || "Main Dining Room",
              capacity: table.capacity,
              shape: table.shape,
              start_time: startTimeStr,
              end_time: endTimeStr,
              window_duration_minutes: windowDuration,
              suggested_dining_duration_minutes: Math.min(windowDuration, minDuration),
              next_reservation_time: table.next_reservation.reservationTime,
              cleaning_buffer_minutes: cleaningBuffer,
              status: "upcoming_turn",
              reason: `Upcoming turnaround from ${startTimeStr} to ${endTimeStr} (${windowDuration}m bookable gap).`,
            });
          }
        }
      }
    }

    // Sort by immediate availability first, then shortest start time
    return windows.sort((a, b) => {
      if (a.status === "immediate" && b.status !== "immediate") return -1;
      if (a.status !== "immediate" && b.status === "immediate") return 1;
      return a.start_time.localeCompare(b.start_time);
    });
  }
}

export const smartAvailabilityService: ISmartAvailabilityService = new FixtureSmartAvailabilityService();
