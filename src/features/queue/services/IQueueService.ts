import type {
  WaitlistEntry,
  WaitlistStatus,
  AddWaitlistEntryInput,
  UpdateWaitlistEntryInput,
  SeatFromQueueInput,
  QueueSummary,
  WaitEstimationResult,
} from "../types";
import type { RestaurantTable } from "../../floor/types";

export interface IQueueService {
  listEntries(outletId?: string, statusFilter?: string): Promise<WaitlistEntry[]>;
  getEntry(entryId: string): Promise<WaitlistEntry | null>;
  addEntry(input: AddWaitlistEntryInput, outletId?: string): Promise<WaitlistEntry>;
  updateEntry(entryId: string, input: UpdateWaitlistEntryInput): Promise<WaitlistEntry>;
  changeStatus(entryId: string, status: WaitlistStatus, note?: string, changedBy?: string): Promise<WaitlistEntry>;
  updateQuotedWait(entryId: string, newQuotedMinutes: number): Promise<WaitlistEntry>;
  prepareTable(entryId: string, tableId: string): Promise<WaitlistEntry>;
  markTableReady(entryId: string, tableId?: string): Promise<WaitlistEntry>;
  seatGuest(input: SeatFromQueueInput): Promise<{ entry: WaitlistEntry; table: RestaurantTable }>;
  cancelEntry(entryId: string, reason?: string): Promise<WaitlistEntry>;
  markNoResponse(entryId: string, note?: string): Promise<WaitlistEntry>;
  getQueueSummary(outletId?: string): Promise<QueueSummary>;
  getRecommendedTables(partySize: number, preferredAreaId?: string): Promise<RestaurantTable[]>;
  estimateWait(partySize: number, preferredAreaId?: string): Promise<WaitEstimationResult>;
}
