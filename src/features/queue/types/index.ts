export type WaitlistStatus =
  | "waiting"
  | "notified"
  | "arrived"
  | "table_preparing"
  | "ready"
  | "seated"
  | "cancelled"
  | "no_response";

export type WaitlistSource =
  | "staff"
  | "walk_in"
  | "q_restobar"
  | "website"
  | "whatsapp"
  | "hotel_concierge"
  | "other";

export type WaitlistPriorityTag =
  | "VIP"
  | "HOTEL_GUEST"
  | "ACCESSIBILITY"
  | "FAMILY"
  | "SPECIAL_OCCASION"
  | "BIRTHDAY"
  | "HIGH_CHAIR"
  | "RETURNING_GUEST";

export type QueuePressure = "NORMAL" | "BUSY" | "HIGH_WAIT";

export interface WaitlistEntry {
  id: string;
  organization_id: string;
  outlet_id: string;
  guest_id?: string | null;

  guest_name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;

  party_size: number;
  preferred_seating_area_id?: string | null;
  preferred_seating_area_name?: string | null;

  quoted_wait_minutes: number;
  estimated_wait_minutes: number;

  status: WaitlistStatus;
  queue_number: string; // e.g. "#01"

  notes?: string | null;
  special_occasion?: string | null;
  dietary_requirements?: string[] | null;
  allergies?: string[] | null;
  priority_tags?: WaitlistPriorityTag[] | null;

  source: WaitlistSource;

  joined_at: string; // ISO string
  notified_at?: string | null;
  arrived_at?: string | null;
  seated_at?: string | null;
  cancelled_at?: string | null;

  assigned_table_id?: string | null;
  assigned_table_number?: string | null;
  reservation_id?: string | null;

  guest_status_token: string;

  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaitlistStatusHistoryItem {
  id: string;
  organization_id: string;
  outlet_id: string;
  waitlist_entry_id: string;
  old_status?: WaitlistStatus | null;
  new_status: WaitlistStatus;
  changed_by?: string | null;
  changed_at: string;
  note?: string | null;
}

export interface AddWaitlistEntryInput {
  guest_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  party_size: number;
  preferred_seating_area_id?: string;
  quoted_wait_minutes: number;
  notes?: string;
  special_occasion?: string;
  dietary_requirements?: string[];
  allergies?: string[];
  priority_tags?: WaitlistPriorityTag[];
  source?: WaitlistSource;
}

export interface UpdateWaitlistEntryInput {
  guest_name?: string;
  phone?: string;
  party_size?: number;
  preferred_seating_area_id?: string;
  quoted_wait_minutes?: number;
  notes?: string;
  special_occasion?: string;
  dietary_requirements?: string[];
  allergies?: string[];
  priority_tags?: WaitlistPriorityTag[];
}

export interface SeatFromQueueInput {
  entryId: string;
  tableId: string;
  staffId?: string;
  notes?: string;
}

export interface QueueSummary {
  waitingParties: number;
  totalGuestsWaiting: number;
  averageWaitMinutes: number;
  longestWaitMinutes: number;
  tablesPreparingCount: number;
  guestsNotifiedCount: number;
  readyCount: number;
  queuePressure: QueuePressure;
}

export interface WaitEstimationResult {
  estimatedWaitMinutes: number;
  compatibleTablesCount: number;
  partiesAheadCount: number;
  basis: string;
  earliestTableReleaseTime?: string | null;
}

export type NotificationChannel = "whatsapp" | "sms" | "push" | "web_status";

export interface NotificationDispatchResult {
  success: boolean;
  channel: NotificationChannel;
  recipientPhone: string;
  messagePreview: string;
  dispatchedAt: string;
  guestStatusUrl: string;
}
