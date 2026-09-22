/**
 * Settings Feature — Development Fixture Data
 * Phase 3J
 *
 * Default realistic settings for Quantum Climb — dev fixture outlet.
 */

import type { OutletSettings } from "../types";

export const DEV_FIXTURE_OUTLET_SETTINGS: OutletSettings = {
  restaurant: {
    displayName: "Quantum Climb",
    phone: "+60 11 6424 2145",
    whatsapp: "+60 11 6424 2145",
    email: "reservations@quantumclimb.com",
    addressLine1: "Level 2, Pavilion KL, Jalan Bukit Bintang",
    city: "Kuala Lumpur",
    country: "Malaysia",
    timezone: "Asia/Kuala_Lumpur",
    currency: "MYR",
    locale: "en-MY",
  },

  service: {
    periods: [
      {
        id: "BREAKFAST",
        name: "Breakfast",
        startTime: "07:00",
        endTime: "11:00",
        isActive: false,
      },
      {
        id: "LUNCH",
        name: "Lunch",
        startTime: "11:30",
        endTime: "14:30",
        isActive: true,
      },
      {
        id: "DINNER",
        name: "Dinner",
        startTime: "18:00",
        endTime: "22:30",
        isActive: true,
      },
      {
        id: "LATE_NIGHT",
        name: "Late Night",
        startTime: "22:30",
        endTime: "01:00",
        isActive: false,
      },
    ],
  },

  reservations: {
    defaultDiningDurationMin: 90,
    reservationIntervalMin: 15,
    lateArrivalThresholdMin: 15,
    noShowThresholdMin: 30,
    maxOnlinePartySize: 10,
  },

  floor: {
    defaultCleaningBufferMin: 15,
    defaultTableTurnDurationMin: 90,
    smartAvailabilityMinWindowMin: 60,
  },

  queue: {
    normalWaitThresholdMin: 20,
    busyWaitThresholdMin: 35,
    highWaitThresholdMin: 50,
    defaultQuoteIncrementMin: 10,
    preferredNotificationChannel: "whatsapp",
  },

  orders: {
    prepAttentionThresholdMin: 15,
    prepDelayedThresholdMin: 25,
    defaultCourseSequence: ["drinks", "starter", "main", "side", "dessert"],
    stationEnabled: {
      kitchen: true,
      bar: true,
      dessert: true,
      service: true,
    },
  },

  guests: {
    returningGuestVisitCount: 2,
    regularGuestVisitCount: 5,
  },

  hotel: {
    hotelModeEnabled: false,
    hotelName: "",
    propertyCode: "",
    showRoomNumber: true,
    enableConciergeBookings: true,
    enableHotelGuestTags: true,
    enableFutureChargeToRoom: false,
  },
};

/** Hotel Mode ON fixture — for testing hotel UI rendering */
export const DEV_FIXTURE_HOTEL_ENABLED_SETTINGS: OutletSettings = {
  ...DEV_FIXTURE_OUTLET_SETTINGS,
  hotel: {
    hotelModeEnabled: true,
    hotelName: "Grand Quantum Hotel",
    propertyCode: "GQH-KL-001",
    showRoomNumber: true,
    enableConciergeBookings: true,
    enableHotelGuestTags: true,
    enableFutureChargeToRoom: false,
  },
};
