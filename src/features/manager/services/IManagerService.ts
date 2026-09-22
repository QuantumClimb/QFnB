import type {
  ManagerSnapshot,
  ManagerTodaySummary,
  ServiceAlert,
  GuestMomentItem,
  OperationalTimelineEvent,
  ManagerBasicInsights,
} from "../types";

export interface IManagerService {
  getLiveSnapshot(outletId?: string, orgId?: string): Promise<ManagerSnapshot>;
  getTodaySummary(outletId?: string, date?: string): Promise<ManagerTodaySummary>;
  getServiceAlerts(outletId?: string): Promise<ServiceAlert[]>;
  getGuestMoments(outletId?: string): Promise<GuestMomentItem[]>;
  getOperationalTimeline(outletId?: string): Promise<OperationalTimelineEvent[]>;
  getBasicInsights(outletId?: string): Promise<ManagerBasicInsights>;
}
