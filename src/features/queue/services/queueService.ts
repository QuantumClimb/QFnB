import { 
  WaitlistEntry, 
  WaitlistStatus, 
  WaitlistStatusHistoryItem, 
  AddWaitlistEntryInput, 
  UpdateWaitlistEntryInput, 
  SeatFromQueueInput, 
  QueueSummary, 
  WaitEstimationResult,
  QueuePressure
} from "../types";
import { initialWaitlistFixtures } from "../fixtures/queueFixtures";
import { floorService, IFloorService } from "../../floor/services/floorService";
import { RestaurantTable } from "../../floor/types";
import { DeterministicWaitEstimationService, IWaitEstimationService } from "./waitEstimationService";

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

export class FixtureQueueService implements IQueueService {
  private entries: WaitlistEntry[];
  private history: WaitlistStatusHistoryItem[] = [];
  private estimationService: IWaitEstimationService;
  private floorSvc: IFloorService;

  constructor(
    customFloorService?: IFloorService,
    customEstimationService?: IWaitEstimationService
  ) {
    this.entries = JSON.parse(JSON.stringify(initialWaitlistFixtures));
    this.floorSvc = customFloorService || floorService;
    this.estimationService = customEstimationService || new DeterministicWaitEstimationService();
  }

  async listEntries(_outletId?: string, statusFilter?: string): Promise<WaitlistEntry[]> {
    await new Promise((res) => setTimeout(res, 40));
    let result = [...this.entries];

    if (statusFilter && statusFilter !== "ALL") {
      const lower = statusFilter.toLowerCase();
      if (lower === "waiting") {
        result = result.filter((e) => e.status === "waiting");
      } else if (lower === "notified") {
        result = result.filter((e) => e.status === "notified");
      } else if (lower === "preparing") {
        result = result.filter((e) => e.status === "table_preparing");
      } else if (lower === "ready") {
        result = result.filter((e) => e.status === "ready");
      } else {
        result = result.filter((e) => e.status === lower);
      }
    }

    // Sort strictly by joined_at ASC (timestamp fairness)
    // Priority tags (VIP, Hotel Guest) are informational and do NOT alter order
    result.sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());

    return result;
  }

  async getEntry(entryId: string): Promise<WaitlistEntry | null> {
    await new Promise((res) => setTimeout(res, 30));
    const entry = this.entries.find((e) => e.id === entryId);
    return entry ? JSON.parse(JSON.stringify(entry)) : null;
  }

  async addEntry(input: AddWaitlistEntryInput, _outletId?: string): Promise<WaitlistEntry> {
    await new Promise((res) => setTimeout(res, 60));

    // Get active table context for deterministic estimation
    const tables = await this.floorSvc.listTables();
    const estimation = this.estimationService.estimateWait(
      input.party_size,
      input.preferred_seating_area_id,
      this.entries,
      tables
    );

    const nextIndex = this.entries.length + 1;
    const queueNum = `#${nextIndex.toString().padStart(2, "0")}`;
    const nowIso = new Date().toISOString();
    const token = `tok_wl_${Math.random().toString(36).substring(2, 10)}`;

    const newEntry: WaitlistEntry = {
      id: `wl-${Date.now().toString().slice(-4)}`,
      organization_id: "org-001",
      outlet_id: "out-001",
      guest_name: input.guest_name,
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
      email: input.email || null,
      party_size: input.party_size,
      preferred_seating_area_id: input.preferred_seating_area_id || null,
      preferred_seating_area_name: input.preferred_seating_area_id ? "Requested Zone" : null,
      quoted_wait_minutes: input.quoted_wait_minutes || estimation.estimatedWaitMinutes || 15,
      estimated_wait_minutes: estimation.estimatedWaitMinutes || 15,
      status: "waiting",
      queue_number: queueNum,
      notes: input.notes || null,
      special_occasion: input.special_occasion || null,
      dietary_requirements: input.dietary_requirements || null,
      allergies: input.allergies || null,
      priority_tags: input.priority_tags || null,
      source: input.source || "walk_in",
      joined_at: nowIso,
      guest_status_token: token,
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.entries.push(newEntry);
    this.recordHistory(newEntry.id, null, "waiting", "Guest added to waitlist at host stand");

    return JSON.parse(JSON.stringify(newEntry));
  }

  async updateEntry(entryId: string, input: UpdateWaitlistEntryInput): Promise<WaitlistEntry> {
    await new Promise((res) => setTimeout(res, 50));
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) throw new Error(`Waitlist entry ${entryId} not found`);

    if (input.guest_name !== undefined) entry.guest_name = input.guest_name;
    if (input.phone !== undefined) entry.phone = input.phone;
    if (input.party_size !== undefined) entry.party_size = input.party_size;
    if (input.preferred_seating_area_id !== undefined) entry.preferred_seating_area_id = input.preferred_seating_area_id;
    if (input.quoted_wait_minutes !== undefined) entry.quoted_wait_minutes = input.quoted_wait_minutes;
    if (input.notes !== undefined) entry.notes = input.notes;
    if (input.special_occasion !== undefined) entry.special_occasion = input.special_occasion;
    if (input.dietary_requirements !== undefined) entry.dietary_requirements = input.dietary_requirements;
    if (input.allergies !== undefined) entry.allergies = input.allergies;
    if (input.priority_tags !== undefined) entry.priority_tags = input.priority_tags;

    entry.updated_at = new Date().toISOString();
    return JSON.parse(JSON.stringify(entry));
  }

  private readonly validTransitions: Record<WaitlistStatus, WaitlistStatus[]> = {
    waiting: ["notified", "arrived", "table_preparing", "ready", "seated", "cancelled", "no_response"],
    notified: ["arrived", "table_preparing", "ready", "seated", "cancelled", "no_response"],
    arrived: ["table_preparing", "ready", "seated", "cancelled", "no_response"],
    table_preparing: ["ready", "seated", "notified", "cancelled", "no_response"],
    ready: ["seated", "notified", "cancelled", "no_response"],
    seated: [], // Terminal state
    cancelled: ["waiting"],
    no_response: ["waiting"],
  };

  async changeStatus(
    entryId: string, 
    status: WaitlistStatus, 
    note?: string, 
    changedBy?: string
  ): Promise<WaitlistEntry> {
    await new Promise((res) => setTimeout(res, 40));
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) throw new Error(`Waitlist entry ${entryId} not found`);

    const oldStatus = entry.status;
    const allowed = this.validTransitions[oldStatus] || [];
    if (!allowed.includes(status) && oldStatus !== status) {
      throw new Error(`Invalid status transition: Cannot transition waitlist entry from ${oldStatus.toUpperCase()} to ${status.toUpperCase()}`);
    }

    entry.status = status;
    entry.updated_at = new Date().toISOString();

    if (status === "notified") entry.notified_at = new Date().toISOString();
    if (status === "arrived") entry.arrived_at = new Date().toISOString();
    if (status === "seated") entry.seated_at = new Date().toISOString();
    if (status === "cancelled" || status === "no_response") entry.cancelled_at = new Date().toISOString();

    this.recordHistory(entryId, oldStatus, status, note, changedBy);
    return JSON.parse(JSON.stringify(entry));
  }

  async updateQuotedWait(entryId: string, newQuotedMinutes: number): Promise<WaitlistEntry> {
    await new Promise((res) => setTimeout(res, 40));
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) throw new Error(`Waitlist entry ${entryId} not found`);

    entry.quoted_wait_minutes = newQuotedMinutes;
    entry.updated_at = new Date().toISOString();
    this.recordHistory(entryId, entry.status, entry.status, `Quoted wait updated to ${newQuotedMinutes} min`);
    return JSON.parse(JSON.stringify(entry));
  }

  async prepareTable(entryId: string, tableId: string): Promise<WaitlistEntry> {
    await new Promise((res) => setTimeout(res, 60));
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) throw new Error(`Waitlist entry ${entryId} not found`);

    const targetTable = await this.floorSvc.getTable(tableId);
    if (!targetTable) throw new Error(`Table ${tableId} not found`);

    if (targetTable.outlet_id !== entry.outlet_id || targetTable.organization_id !== entry.organization_id) {
      throw new Error(`Cross-outlet table preparation rejected: Table ${targetTable.table_number} does not belong to the same outlet`);
    }

    if (!targetTable.is_active || targetTable.status === "blocked") {
      throw new Error(`Table ${targetTable.table_number} is currently inactive or blocked`);
    }

    entry.assigned_table_id = targetTable.id;
    entry.assigned_table_number = targetTable.table_number;
    const oldStatus = entry.status;
    entry.status = "table_preparing";
    entry.updated_at = new Date().toISOString();

    // Mark table cleaning/preparing if it was available
    if (targetTable.status === "available") {
      await this.floorSvc.markCleaning(tableId);
    }

    this.recordHistory(entryId, oldStatus, "table_preparing", `Assigned ${targetTable.table_number} for preparation`);
    return JSON.parse(JSON.stringify(entry));
  }

  async markTableReady(entryId: string, tableId?: string): Promise<WaitlistEntry> {
    await new Promise((res) => setTimeout(res, 50));
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) throw new Error(`Waitlist entry ${entryId} not found`);

    if (tableId) {
      const table = await this.floorSvc.getTable(tableId);
      if (table) {
        if (table.outlet_id !== entry.outlet_id || table.organization_id !== entry.organization_id) {
          throw new Error(`Cross-outlet table assignment rejected`);
        }
        entry.assigned_table_id = table.id;
        entry.assigned_table_number = table.table_number;
      }
    }

    const oldStatus = entry.status;
    entry.status = "ready";
    entry.updated_at = new Date().toISOString();

    this.recordHistory(entryId, oldStatus, "ready", `Table ${entry.assigned_table_number || ""} marked ready`);
    return JSON.parse(JSON.stringify(entry));
  }

  async seatGuest(input: SeatFromQueueInput): Promise<{ entry: WaitlistEntry; table: RestaurantTable }> {
    await new Promise((res) => setTimeout(res, 80));
    const entry = this.entries.find((e) => e.id === input.entryId);
    if (!entry) throw new Error(`Waitlist entry ${input.entryId} not found`);

    if (entry.status === "seated") {
      throw new Error(`Guest ${entry.guest_name} is already seated`);
    }

    const table = await this.floorSvc.getTable(input.tableId);
    if (!table) throw new Error(`Table ${input.tableId} not found`);

    // 1. Organization & Outlet Tenancy Check
    if (table.outlet_id !== entry.outlet_id || table.organization_id !== entry.organization_id) {
      throw new Error(`Cross-outlet seating rejected: Table ${table.table_number} does not belong to the same outlet`);
    }

    // 2. Active Table Check
    if (!table.is_active) {
      throw new Error(`Table ${table.table_number} is currently inactive in the floor layout`);
    }

    // 3. Blocked Check
    if (table.status === "blocked") {
      throw new Error(`Table ${table.table_number} is currently blocked and cannot be seated`);
    }

    // 4. Occupied Check
    if (table.status === "seated" || table.status === "dining" || table.status === "ordering" || table.status === "bill_requested") {
      throw new Error(`Table ${table.table_number} is currently occupied (${table.status.toUpperCase()})`);
    }

    // 5. Capacity Bounds Check
    if (table.capacity < entry.party_size) {
      throw new Error(`Table ${table.table_number} capacity (${table.capacity}) cannot accommodate party of ${entry.party_size}`);
    }

    // 6. Update queue entry
    const oldStatus = entry.status;
    entry.status = "seated";
    entry.assigned_table_id = table.id;
    entry.assigned_table_number = table.table_number;
    entry.seated_at = new Date().toISOString();
    entry.updated_at = new Date().toISOString();

    // 7. Delegate seating execution to Floor Service
    const updatedTable = await this.floorSvc.seatWalkIn(table.id, {
      guestName: entry.guest_name,
      partySize: entry.party_size,
      phone: entry.phone,
      specialOccasion: entry.special_occasion || undefined,
      notes: entry.notes || undefined,
      allergies: entry.allergies ? entry.allergies.join(", ") : undefined,
      dietaryNotes: entry.dietary_requirements ? entry.dietary_requirements.join(", ") : undefined,
      expectedDurationMinutes: entry.party_size > 4 ? 90 : 75,
    });

    this.recordHistory(entry.id, oldStatus, "seated", `Seated at Table ${table.table_number}`, input.staffId);

    return {
      entry: JSON.parse(JSON.stringify(entry)),
      table: updatedTable,
    };
  }

  async cancelEntry(entryId: string, reason?: string): Promise<WaitlistEntry> {
    await new Promise((res) => setTimeout(res, 40));
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) throw new Error(`Waitlist entry ${entryId} not found`);

    const oldStatus = entry.status;
    entry.status = "cancelled";
    entry.cancelled_at = new Date().toISOString();
    entry.updated_at = new Date().toISOString();

    this.recordHistory(entryId, oldStatus, "cancelled", reason || "Cancelled by host");
    return JSON.parse(JSON.stringify(entry));
  }

  async markNoResponse(entryId: string, note?: string): Promise<WaitlistEntry> {
    await new Promise((res) => setTimeout(res, 40));
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) throw new Error(`Waitlist entry ${entryId} not found`);

    const oldStatus = entry.status;
    entry.status = "no_response";
    entry.cancelled_at = new Date().toISOString();
    entry.updated_at = new Date().toISOString();

    this.recordHistory(entryId, oldStatus, "no_response", note || "No response to notification paging");
    return JSON.parse(JSON.stringify(entry));
  }

  async getQueueSummary(_outletId?: string): Promise<QueueSummary> {
    await new Promise((res) => setTimeout(res, 30));
    // Position-bearing actively waiting guests: waiting, notified, arrived
    const activeWaiting = this.entries.filter(
      (e) => e.status === "waiting" || e.status === "notified" || e.status === "arrived"
    );
    const readyEntries = this.entries.filter((e) => e.status === "ready");
    const preparingEntries = this.entries.filter((e) => e.status === "table_preparing");
    const notifiedEntries = this.entries.filter((e) => e.status === "notified");

    const totalGuestsWaiting = activeWaiting.reduce((acc, e) => acc + e.party_size, 0);

    const nowTime = Date.now();
    const waitTimes = activeWaiting.map((e) =>
      Math.max(0, Math.round((nowTime - new Date(e.joined_at).getTime()) / 60000))
    );

    const averageWaitMinutes =
      waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;

    const longestWaitMinutes = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    // Queue Pressure logic based on true waiting pool
    let queuePressure: QueuePressure = "NORMAL";
    if (averageWaitMinutes > 30 || activeWaiting.length >= 8) {
      queuePressure = "HIGH_WAIT";
    } else if (averageWaitMinutes >= 15 || activeWaiting.length >= 4) {
      queuePressure = "BUSY";
    }

    return {
      waitingParties: activeWaiting.length,
      totalGuestsWaiting,
      averageWaitMinutes,
      longestWaitMinutes,
      tablesPreparingCount: preparingEntries.length,
      guestsNotifiedCount: notifiedEntries.length,
      readyCount: readyEntries.length,
      queuePressure,
    };
  }

  async getRecommendedTables(partySize: number, preferredAreaId?: string): Promise<RestaurantTable[]> {
    const allTables = await this.floorSvc.listTables(undefined, preferredAreaId);
    return allTables
      .filter((t) => t.is_active && t.status !== "blocked" && t.maximum_party_size >= partySize && t.minimum_party_size <= partySize)
      .sort((a, b) => {
        // Prioritize available, then cleaning, then others
        const score = (t: RestaurantTable) => {
          if (t.status === "available") return 1;
          if (t.status === "cleaning") return 2;
          if (t.status === "bill_requested") return 3;
          return 4;
        };
        return score(a) - score(b);
      });
  }

  async estimateWait(partySize: number, preferredAreaId?: string): Promise<WaitEstimationResult> {
    const tables = await this.floorSvc.listTables();
    return this.estimationService.estimateWait(partySize, preferredAreaId, this.entries, tables);
  }

  private recordHistory(
    entryId: string, 
    oldStatus: WaitlistStatus | null, 
    newStatus: WaitlistStatus, 
    note?: string, 
    changedBy?: string
  ) {
    this.history.push({
      id: `wlh-${Date.now().toString().slice(-4)}`,
      organization_id: "org-001",
      outlet_id: "out-001",
      waitlist_entry_id: entryId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy || null,
      changed_at: new Date().toISOString(),
      note: note || null,
    });
  }
}

export const queueService: IQueueService = new FixtureQueueService();
