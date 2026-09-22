import { AvailabilityQuery, AvailabilityResult, TimeSlotAvailability } from "../types";

export interface IAvailabilityService {
  checkAvailability(query: AvailabilityQuery): Promise<AvailabilityResult>;
}

class FixtureAvailabilityService implements IAvailabilityService {
  async checkAvailability(query: AvailabilityQuery): Promise<AvailabilityResult> {
    await new Promise((res) => setTimeout(res, 80));

    // Standard dinner service slot times
    const baseTimes = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
    
    const slots: TimeSlotAvailability[] = baseTimes.map((time) => {
      // Simulate peak time constraints around 19:30 - 20:30 for large parties
      const isPeak = time === "19:30" || time === "20:00";
      const isLargeParty = query.party_size >= 6;

      let isAvailable = true;
      let confidence: "high" | "limited" | "waitlist_only" = "high";
      let remainingCapacity = 24 - query.party_size;
      let suggestedTable = "T-06 (Main Hall)";

      if (isPeak && isLargeParty) {
        isAvailable = false;
        confidence = "waitlist_only";
        remainingCapacity = 0;
        suggestedTable = "Requires Table Combination or PDR";
      } else if (isPeak) {
        confidence = "limited";
        remainingCapacity = 6;
        suggestedTable = "B-03 or T-09";
      }

      return {
        time,
        is_available: isAvailable,
        seating_area_id: query.preferred_area_id || "area-main",
        seating_area_name: "Main Dining Room",
        suggested_table: suggestedTable,
        remaining_capacity: remainingCapacity,
        confidence,
      };
    });

    return {
      date: query.date,
      party_size: query.party_size,
      slots,
      capacity_warnings: query.party_size >= 8 ? ["Large party (>7 guests) requires floor manager seating approval."] : [],
      smart_recommendations: [
        "18:30 seating offers optimal kitchen pacing before prime peak.",
        "Terrace high-tops available for immediate turnaround.",
      ],
    };
  }
}

export const availabilityService: IAvailabilityService = new FixtureAvailabilityService();
