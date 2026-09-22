import { WaitlistEntry, NotificationChannel, NotificationDispatchResult } from "../types";

export interface IGuestNotificationService {
  notifyTableReady(
    entry: WaitlistEntry,
    tableNumber: string,
    channel?: NotificationChannel
  ): Promise<NotificationDispatchResult>;

  notifyWaitUpdate(
    entry: WaitlistEntry,
    newEstimatedMinutes: number,
    channel?: NotificationChannel
  ): Promise<NotificationDispatchResult>;
}

export class FixtureGuestNotificationService implements IGuestNotificationService {
  async notifyTableReady(
    entry: WaitlistEntry,
    tableNumber: string,
    channel: NotificationChannel = "whatsapp"
  ): Promise<NotificationDispatchResult> {
    await new Promise((res) => setTimeout(res, 60)); // Simulate rapid async dispatch

    const statusUrl = `https://q-fnb.app/guest/queue/${entry.guest_status_token}`;
    const channelLabel = channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "Push";
    
    const messagePreview = channel === "whatsapp"
      ? `🌟 [Q F&B OS] Great news, ${entry.guest_name}! Your table (${tableNumber}) at Quantum Climb is READY. Please proceed to the host stand within 10 minutes. Track status: ${statusUrl}`
      : `[Q F&B OS] Hi ${entry.guest_name}, table ${tableNumber} is ready for your party of ${entry.party_size}. Please see the host. ${statusUrl}`;

    console.info(`[Notification Simulation - ${channelLabel}] Dispatched to ${entry.phone}:`, messagePreview);

    return {
      success: true,
      channel,
      recipientPhone: entry.phone,
      messagePreview,
      dispatchedAt: new Date().toISOString(),
      guestStatusUrl: statusUrl,
    };
  }

  async notifyWaitUpdate(
    entry: WaitlistEntry,
    newEstimatedMinutes: number,
    channel: NotificationChannel = "whatsapp"
  ): Promise<NotificationDispatchResult> {
    await new Promise((res) => setTimeout(res, 60));

    const statusUrl = `https://q-fnb.app/guest/queue/${entry.guest_status_token}`;
    const messagePreview = `[Q F&B OS] Hi ${entry.guest_name}, your estimated wait time is now approximately ${newEstimatedMinutes} minutes. We are preparing your dining experience! View status: ${statusUrl}`;

    console.info(`[Notification Simulation - Wait Update] Dispatched to ${entry.phone}:`, messagePreview);

    return {
      success: true,
      channel,
      recipientPhone: entry.phone,
      messagePreview,
      dispatchedAt: new Date().toISOString(),
      guestStatusUrl: statusUrl,
    };
  }
}

export const guestNotificationService = new FixtureGuestNotificationService();
