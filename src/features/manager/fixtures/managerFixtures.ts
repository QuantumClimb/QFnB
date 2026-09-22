import { OperationalTimelineEvent } from "../types";

export const initialOperationalTimelineEvents: OperationalTimelineEvent[] = [
  {
    id: "evt-01",
    time: "19:42",
    title: "Table T08 seated with party of 4",
    description: "Marcus Tan tasting menu reservation seated by Floor Host.",
    category: "floor",
    severity: "INFO",
  },
  {
    id: "evt-02",
    time: "19:39",
    title: "Order ORD-104 marked ready by Chef de Partie",
    description: "Table T04 main course ready for food runner pickup at Kitchen Pass.",
    category: "order",
    severity: "INFO",
  },
  {
    id: "evt-03",
    time: "19:35",
    title: "Guest Sarah Lim arrived at host stand",
    description: "Birthday celebration package reservation checked in. Notified pastry chef.",
    category: "reservation",
    severity: "INFO",
  },
  {
    id: "evt-04",
    time: "19:31",
    title: "Waitlist guest W-02 sent SMS notification",
    description: "Alfresco table T-02 ready for party of 2. 5-minute claim timer running.",
    category: "queue",
    severity: "INFO",
  },
  {
    id: "evt-05",
    time: "19:28",
    title: "Table T04 requested bill",
    description: "Waiter Daniel Vance acknowledged bill request.",
    category: "floor",
    severity: "INFO",
  },
  {
    id: "evt-06",
    time: "19:20",
    title: "Kitchen Station delay alert: Item past 25 mins",
    description: "Table T02 Wagyu Striploin exceeded service threshold.",
    category: "order",
    severity: "URGENT",
  },
  {
    id: "evt-07",
    time: "19:12",
    title: "VIP patron Elena Rostova seated on Alfresco Terrace",
    description: "Romantic package welcome flutes poured tableside.",
    category: "experience",
    severity: "INFO",
  },
  {
    id: "evt-08",
    time: "19:05",
    title: "Table T01 turn duration exceeded by 18 minutes",
    description: "Approaching next reservation seating window.",
    category: "floor",
    severity: "ATTENTION",
  },
];

export const defaultManagerShiftMeta = {
  shiftLead: "Marcus Vance",
  shiftRole: "Floor Manager & Head Sommelier",
  servicePeriod: "DINNER" as const,
  serviceStatus: "ACTIVE_PEAK" as const,
};
