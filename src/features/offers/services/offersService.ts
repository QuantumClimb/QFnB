import {
  Experience,
  ExperienceCategory,
  ExperienceStatus,
  ExperienceAddon,
  Offer,
  OfferStatus,
  ReservationExperience,
  ReservationExperienceStatus,
  ReservationAddon,
  CreateExperienceInput,
  UpdateExperienceInput,
  CreateAddonInput,
  UpdateAddonInput,
  CreateOfferInput,
  UpdateOfferInput,
  AttachExperienceInput,
  AttachAddonInput,
  ExperienceCompatibilityResult,
  OffersFilterOptions,
  OffersSummaryMetrics,
  ExperienceAvailabilityRule
} from "../types";
import {
  initialExperiences,
  initialAddons,
  initialOffers,
  initialReservationExperiences,
  initialReservationAddons,
  initialExperienceAvailabilityRules
} from "../fixtures/offersFixtures";
import { reservationService, IReservationService } from "../../reservations/services/reservationService";

export interface IOffersService {
  // Experiences
  listExperiences(orgId?: string, outletId?: string, options?: OffersFilterOptions): Promise<Experience[]>;
  getExperience(id: string): Promise<Experience | null>;
  createExperience(input: CreateExperienceInput): Promise<Experience>;
  updateExperience(id: string, input: UpdateExperienceInput): Promise<Experience>;
  changeExperienceStatus(id: string, status: ExperienceStatus): Promise<Experience>;

  // Offers
  listOffers(orgId?: string, outletId?: string, options?: OffersFilterOptions): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer | null>;
  createOffer(input: CreateOfferInput): Promise<Offer>;
  updateOffer(id: string, input: UpdateOfferInput): Promise<Offer>;
  changeOfferStatus(id: string, status: OfferStatus): Promise<Offer>;

  // Add-ons
  listAddons(orgId?: string, outletId?: string, experienceId?: string): Promise<ExperienceAddon[]>;
  getAddon(id: string): Promise<ExperienceAddon | null>;
  createAddon(input: CreateAddonInput): Promise<ExperienceAddon>;
  updateAddon(id: string, input: UpdateAddonInput): Promise<ExperienceAddon>;

  // Availability & Compatibility
  checkExperienceCompatibility(
    experienceId: string,
    reservation: { party_size: number; reservation_date: string; reservation_time: string; outlet_id: string }
  ): Promise<ExperienceCompatibilityResult>;

  // Reservation Attachments (Operational)
  getReservationExperiences(reservationId: string): Promise<ReservationExperience[]>;
  attachExperienceToReservation(input: AttachExperienceInput): Promise<ReservationExperience>;
  removeExperienceFromReservation(linkId: string): Promise<void>;
  updateReservationExperienceStatus(linkId: string, status: ReservationExperienceStatus): Promise<ReservationExperience>;

  // Reservation Add-ons (Operational)
  getReservationAddons(reservationId: string): Promise<ReservationAddon[]>;
  attachAddonToReservation(input: AttachAddonInput): Promise<ReservationAddon>;
  removeAddonFromReservation(linkId: string): Promise<void>;

  // Operational Lists & Metrics
  getAllReservationExperiences(orgId?: string, outletId?: string): Promise<ReservationExperience[]>;
  getAllReservationAddons(orgId?: string, outletId?: string): Promise<ReservationAddon[]>;
  getSummaryMetrics(orgId?: string, outletId?: string): Promise<OffersSummaryMetrics>;
}

export class FixtureOffersService implements IOffersService {
  private experiences: Experience[];
  private addons: ExperienceAddon[];
  private offers: Offer[];
  private rules: ExperienceAvailabilityRule[];
  private resExperiences: ReservationExperience[];
  private resAddons: ReservationAddon[];
  private resService: IReservationService;

  constructor(customResService?: IReservationService) {
    this.experiences = JSON.parse(JSON.stringify(initialExperiences));
    this.addons = JSON.parse(JSON.stringify(initialAddons));
    this.offers = JSON.parse(JSON.stringify(initialOffers));
    this.rules = JSON.parse(JSON.stringify(initialExperienceAvailabilityRules));
    this.resExperiences = JSON.parse(JSON.stringify(initialReservationExperiences));
    this.resAddons = JSON.parse(JSON.stringify(initialReservationAddons));
    this.resService = customResService || reservationService;
  }

  // --------------------------------------------------------------------------
  // Experiences
  // --------------------------------------------------------------------------
  async listExperiences(_orgId?: string, outletId?: string, options?: OffersFilterOptions): Promise<Experience[]> {
    await new Promise((r) => setTimeout(r, 40));
    let result = [...this.experiences];

    // Filter by outlet scope: org-wide (outlet_id === null) or matching outlet
    if (outletId) {
      if (options?.scope === "CURRENT_OUTLET") {
        result = result.filter((e) => e.outlet_id === outletId);
      } else if (options?.scope === "ORG_WIDE") {
        result = result.filter((e) => e.outlet_id === null);
      } else {
        result = result.filter((e) => e.outlet_id === null || e.outlet_id === outletId);
      }
    }

    if (options?.category && options.category !== "ALL") {
      result = result.filter((e) => e.category === options.category);
    }

    if (options?.status && options.status !== "ALL") {
      result = result.filter((e) => e.status === options.status);
    }

    if (options?.visibility === "PUBLIC") {
      result = result.filter((e) => e.is_public);
    } else if (options?.visibility === "STAFF_ONLY") {
      result = result.filter((e) => !e.is_public);
    }

    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.short_description && e.short_description.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q)
      );
    }

    // Attach current live upcoming bookings count dynamically
    result = result.map((exp) => {
      const bookingCount = this.resExperiences.filter(
        (re) => re.experience_id === exp.id && re.status !== "cancelled"
      ).length;
      return {
        ...exp,
        upcoming_bookings_count: bookingCount,
      };
    });

    return JSON.parse(JSON.stringify(result));
  }

  async getExperience(id: string): Promise<Experience | null> {
    await new Promise((r) => setTimeout(r, 20));
    const exp = this.experiences.find((e) => e.id === id);
    if (!exp) return null;

    const expRules = this.rules.filter((r) => r.experience_id === id && r.is_active);
    const bookingCount = this.resExperiences.filter(
      (re) => re.experience_id === id && re.status !== "cancelled"
    ).length;

    return JSON.parse(
      JSON.stringify({
        ...exp,
        availability_rules: expRules,
        upcoming_bookings_count: bookingCount,
      })
    );
  }

  async createExperience(input: CreateExperienceInput): Promise<Experience> {
    await new Promise((r) => setTimeout(r, 60));

    if (input.minimum_party_size <= 0) {
      throw new Error("Minimum party size must be greater than 0");
    }
    if (input.maximum_party_size < input.minimum_party_size) {
      throw new Error("Maximum party size cannot be less than minimum party size");
    }
    if (input.base_price !== undefined && input.base_price !== null && input.base_price < 0) {
      throw new Error("Base price cannot be negative");
    }

    const newId = `exp-${Date.now().toString(36)}`;
    const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const newExp: Experience = {
      id: newId,
      organization_id: input.organization_id,
      outlet_id: input.outlet_id || null,
      outlet_name: input.outlet_id ? "Assigned Outlet" : "All Outlets (Group-wide)",
      title: input.title,
      slug,
      short_description: input.short_description || null,
      description: input.description || null,
      category: input.category,
      status: "active",
      is_public: input.is_public,
      is_featured: input.is_featured ?? false,
      minimum_party_size: input.minimum_party_size,
      maximum_party_size: input.maximum_party_size,
      duration_minutes: input.duration_minutes ?? 120,
      base_price: input.base_price ?? null,
      currency_code: input.currency_code || "MYR",
      preferred_seating_area_id: input.preferred_seating_area_id || null,
      valid_from: input.valid_from || null,
      valid_until: input.valid_until || null,
      booking_lead_minutes: input.booking_lead_minutes ?? 120,
      guest_terms: input.guest_terms || null,
      internal_notes: input.internal_notes || null,
      image_url: input.image_url || null,
      availability_rules: [],
      upcoming_bookings_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // If availability days were selected, generate availability rules
    if (input.availability_days && input.availability_days.length > 0) {
      const startTime = input.start_time || "18:00";
      const endTime = input.end_time || "22:30";
      const createdRules: ExperienceAvailabilityRule[] = input.availability_days.map((day) => ({
        id: `rule-${newId}-${day}`,
        organization_id: input.organization_id,
        outlet_id: input.outlet_id || null,
        experience_id: newId,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      this.rules.push(...createdRules);
      newExp.availability_rules = createdRules;
    }

    this.experiences.unshift(newExp);
    return JSON.parse(JSON.stringify(newExp));
  }

  async updateExperience(id: string, input: UpdateExperienceInput): Promise<Experience> {
    await new Promise((r) => setTimeout(r, 40));
    const idx = this.experiences.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Experience ${id} not found`);

    const current = this.experiences[idx];
    const minParty = input.minimum_party_size ?? current.minimum_party_size;
    const maxParty = input.maximum_party_size ?? current.maximum_party_size;

    if (minParty <= 0) throw new Error("Minimum party size must be greater than 0");
    if (maxParty < minParty) throw new Error("Maximum party size cannot be less than minimum party size");

    const updated: Experience = {
      ...current,
      ...input,
      minimum_party_size: minParty,
      maximum_party_size: maxParty,
      updated_at: new Date().toISOString(),
    };

    this.experiences[idx] = updated;
    return JSON.parse(JSON.stringify(updated));
  }

  async changeExperienceStatus(id: string, status: ExperienceStatus): Promise<Experience> {
    return this.updateExperience(id, { status });
  }

  // --------------------------------------------------------------------------
  // Offers
  // --------------------------------------------------------------------------
  async listOffers(_orgId?: string, outletId?: string, options?: OffersFilterOptions): Promise<Offer[]> {
    await new Promise((r) => setTimeout(r, 40));
    let result = [...this.offers];

    if (outletId) {
      if (options?.scope === "CURRENT_OUTLET") {
        result = result.filter((o) => o.outlet_id === outletId);
      } else if (options?.scope === "ORG_WIDE") {
        result = result.filter((o) => o.outlet_id === null);
      } else {
        result = result.filter((o) => o.outlet_id === null || o.outlet_id === outletId);
      }
    }

    if (options?.status && options.status !== "ALL") {
      result = result.filter((o) => o.status === options.status);
    }

    if (options?.visibility === "PUBLIC") {
      result = result.filter((o) => o.is_public);
    } else if (options?.visibility === "STAFF_ONLY") {
      result = result.filter((o) => !o.is_public);
    }

    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          (o.short_description && o.short_description.toLowerCase().includes(q))
      );
    }

    return JSON.parse(JSON.stringify(result));
  }

  async getOffer(id: string): Promise<Offer | null> {
    await new Promise((r) => setTimeout(r, 20));
    const off = this.offers.find((o) => o.id === id);
    return off ? JSON.parse(JSON.stringify(off)) : null;
  }

  async createOffer(input: CreateOfferInput): Promise<Offer> {
    await new Promise((r) => setTimeout(r, 50));
    const newId = `offer-${Date.now().toString(36)}`;

    let linkedTitle: string | null = null;
    if (input.experience_id) {
      const exp = this.experiences.find((e) => e.id === input.experience_id);
      if (exp) linkedTitle = exp.title;
    }

    const newOffer: Offer = {
      id: newId,
      organization_id: input.organization_id,
      outlet_id: input.outlet_id || null,
      outlet_name: input.outlet_id ? "Assigned Outlet" : "All Outlets",
      title: input.title,
      short_description: input.short_description || null,
      description: input.description || null,
      status: input.status || "active",
      is_public: input.is_public,
      is_featured: input.is_featured ?? false,
      valid_from: input.valid_from || null,
      valid_until: input.valid_until || null,
      experience_id: input.experience_id || null,
      experience_title: linkedTitle,
      eligibility_notes: input.eligibility_notes || null,
      redemption_notes: input.redemption_notes || null,
      internal_notes: input.internal_notes || null,
      image_url: input.image_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.offers.unshift(newOffer);
    return JSON.parse(JSON.stringify(newOffer));
  }

  async updateOffer(id: string, input: UpdateOfferInput): Promise<Offer> {
    await new Promise((r) => setTimeout(r, 40));
    const idx = this.offers.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error(`Offer ${id} not found`);

    let linkedTitle = this.offers[idx].experience_title;
    if (input.experience_id !== undefined) {
      if (input.experience_id) {
        const exp = this.experiences.find((e) => e.id === input.experience_id);
        linkedTitle = exp ? exp.title : null;
      } else {
        linkedTitle = null;
      }
    }

    const updated: Offer = {
      ...this.offers[idx],
      ...input,
      experience_title: linkedTitle,
      updated_at: new Date().toISOString(),
    };

    this.offers[idx] = updated;
    return JSON.parse(JSON.stringify(updated));
  }

  async changeOfferStatus(id: string, status: OfferStatus): Promise<Offer> {
    return this.updateOffer(id, { status });
  }

  // --------------------------------------------------------------------------
  // Add-ons
  // --------------------------------------------------------------------------
  async listAddons(_orgId?: string, outletId?: string, experienceId?: string): Promise<ExperienceAddon[]> {
    await new Promise((r) => setTimeout(r, 30));
    let result = [...this.addons];

    if (outletId) {
      result = result.filter((a) => a.outlet_id === null || a.outlet_id === outletId);
    }

    if (experienceId) {
      result = result.filter((a) => a.experience_id === null || a.experience_id === experienceId);
    }

    return JSON.parse(JSON.stringify(result));
  }

  async getAddon(id: string): Promise<ExperienceAddon | null> {
    const addon = this.addons.find((a) => a.id === id);
    return addon ? JSON.parse(JSON.stringify(addon)) : null;
  }

  async createAddon(input: CreateAddonInput): Promise<ExperienceAddon> {
    await new Promise((r) => setTimeout(r, 50));
    if (input.price !== undefined && input.price !== null && input.price < 0) {
      throw new Error("Addon price cannot be negative");
    }

    const newId = `addon-${Date.now().toString(36)}`;
    let expTitle: string | null = null;
    if (input.experience_id) {
      const exp = this.experiences.find((e) => e.id === input.experience_id);
      if (exp) expTitle = exp.title;
    }

    const newAddon: ExperienceAddon = {
      id: newId,
      organization_id: input.organization_id,
      outlet_id: input.outlet_id || null,
      outlet_name: input.outlet_id ? "Assigned Outlet" : "All Outlets",
      experience_id: input.experience_id || null,
      experience_title: expTitle,
      name: input.name,
      description: input.description || null,
      category: input.category,
      price: input.price ?? null,
      currency_code: input.currency_code || "MYR",
      is_public: input.is_public,
      is_active: input.is_active,
      maximum_quantity: input.maximum_quantity ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.addons.unshift(newAddon);
    return JSON.parse(JSON.stringify(newAddon));
  }

  async updateAddon(id: string, input: UpdateAddonInput): Promise<ExperienceAddon> {
    await new Promise((r) => setTimeout(r, 40));
    const idx = this.addons.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Addon ${id} not found`);

    const updated: ExperienceAddon = {
      ...this.addons[idx],
      ...input,
      updated_at: new Date().toISOString(),
    };

    this.addons[idx] = updated;
    return JSON.parse(JSON.stringify(updated));
  }

  // --------------------------------------------------------------------------
  // Availability & Compatibility
  // --------------------------------------------------------------------------
  async checkExperienceCompatibility(
    experienceId: string,
    reservation: { party_size: number; reservation_date: string; reservation_time: string; outlet_id: string }
  ): Promise<ExperienceCompatibilityResult> {
    const exp = this.experiences.find((e) => e.id === experienceId);
    if (!exp) {
      return { isCompatible: false, reasons: ["Experience does not exist"] };
    }

    const reasons: string[] = [];

    // 1. Active status check
    if (exp.status !== "active") {
      reasons.push(`Experience is currently ${exp.status.toUpperCase()} (must be ACTIVE to attach)`);
    }

    // 2. Outlet scope check
    if (exp.outlet_id && exp.outlet_id !== reservation.outlet_id) {
      reasons.push(`Experience is exclusively restricted to ${exp.outlet_name || "another outlet"}`);
    }

    // 3. Party size constraints
    if (reservation.party_size < exp.minimum_party_size) {
      reasons.push(
        `Reservation party (${reservation.party_size} guests) is below minimum party size of ${exp.minimum_party_size}`
      );
    }
    if (reservation.party_size > exp.maximum_party_size) {
      reasons.push(
        `Reservation party (${reservation.party_size} guests) exceeds maximum party size of ${exp.maximum_party_size}`
      );
    }

    // 4. Date validity
    if (exp.valid_from && reservation.reservation_date < exp.valid_from.split("T")[0]) {
      reasons.push(`Experience not valid before ${exp.valid_from.split("T")[0]}`);
    }
    if (exp.valid_until && reservation.reservation_date > exp.valid_until.split("T")[0]) {
      reasons.push(`Experience expired on ${exp.valid_until.split("T")[0]}`);
    }

    // 5. Booking Lead Time Check (if configured)
    if (exp.booking_lead_minutes && exp.booking_lead_minutes > 0) {
      const bookingDateTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}:00`);
      const now = new Date();
      const diffMinutes = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60);
      if (diffMinutes < exp.booking_lead_minutes) {
        const requiredHours = Math.round(exp.booking_lead_minutes / 60);
        reasons.push(
          `Requires minimum advance notice of ${requiredHours > 0 ? `${requiredHours} hours` : `${exp.booking_lead_minutes} mins`}`
        );
      }
    }

    // 6. Day/Time Availability & Capacity Rules
    const expRules = this.rules.filter((r) => r.experience_id === experienceId && r.is_active);
    if (expRules.length > 0) {
      // Determine reservation day of week (0=Sunday ... 6=Saturday)
      const resDate = new Date(`${reservation.reservation_date}T12:00:00Z`);
      const dayOfWeek = resDate.getUTCDay();

      const dayRule = expRules.find((r) => r.day_of_week === dayOfWeek);
      if (!dayRule) {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        reasons.push(`Experience is not offered on ${dayNames[dayOfWeek]}s`);
      } else {
        if (reservation.reservation_time) {
          if (reservation.reservation_time < dayRule.start_time || reservation.reservation_time > dayRule.end_time) {
            reasons.push(
              `Booking time (${reservation.reservation_time}) is outside service window (${dayRule.start_time} – ${dayRule.end_time})`
            );
          }
        }

        // Capacity Pacing / Maximum Bookings Check
        if (dayRule.maximum_bookings && dayRule.maximum_bookings > 0) {
          const bookedCount = this.resExperiences.filter(
            (re) =>
              re.experience_id === experienceId &&
              re.reservation_date === reservation.reservation_date &&
              re.status !== "cancelled"
          ).length;

          if (bookedCount >= dayRule.maximum_bookings) {
            reasons.push(
              `Maximum capacity reached for this service session (${bookedCount}/${dayRule.maximum_bookings} slots booked)`
            );
          }
        }
      }
    }

    return {
      isCompatible: reasons.length === 0,
      reasons,
    };
  }

  // --------------------------------------------------------------------------
  // Reservation Experience Attachment (Operational)
  // --------------------------------------------------------------------------
  async getReservationExperiences(reservationId: string): Promise<ReservationExperience[]> {
    await new Promise((r) => setTimeout(r, 20));
    return this.resExperiences.filter((re) => re.reservation_id === reservationId && re.status !== "cancelled");
  }

  async attachExperienceToReservation(input: AttachExperienceInput): Promise<ReservationExperience> {
    await new Promise((r) => setTimeout(r, 50));

    // Check if reservation exists
    const res = await this.resService.getReservation(input.reservation_id);
    if (!res) throw new Error(`Reservation ${input.reservation_id} not found`);

    // Check if experience exists
    const exp = this.experiences.find((e) => e.id === input.experience_id);
    if (!exp) throw new Error(`Experience ${input.experience_id} not found`);

    // Tenant / Organization match check
    if (res.organization_id !== input.organization_id || exp.organization_id !== input.organization_id) {
      throw new Error("Tenant isolation violation: organization mismatch between reservation and experience");
    }

    // Outlet scope check: if exp has outlet_id, must match reservation outlet_id
    if (exp.outlet_id && exp.outlet_id !== res.outlet_id) {
      throw new Error(`Experience is restricted to outlet ${exp.outlet_name || exp.outlet_id}, not valid for ${res.outlet_id}`);
    }

    // Compatibility check
    const compatibility = await this.checkExperienceCompatibility(exp.id, {
      party_size: res.party_size,
      reservation_date: res.reservation_date,
      reservation_time: res.reservation_time,
      outlet_id: res.outlet_id,
    });

    if (!compatibility.isCompatible) {
      throw new Error(`Cannot attach experience: ${compatibility.reasons.join("; ")}`);
    }

    // Cancel any previous active experience on this reservation
    const existing = this.resExperiences.find(
      (re) => re.reservation_id === input.reservation_id && re.status !== "cancelled"
    );
    if (existing) {
      existing.status = "cancelled";
      existing.updated_at = new Date().toISOString();
    }

    // Capture Historical Price Snapshot (Immutable once confirmed)
    const unitPriceSnapshot = exp.base_price ?? null;

    const attachment: ReservationExperience = {
      id: `re-${Date.now().toString(36)}`,
      organization_id: input.organization_id,
      outlet_id: input.outlet_id,
      reservation_id: input.reservation_id,
      experience_id: input.experience_id,
      experience_title: exp.title,
      experience_category: exp.category,
      status: "confirmed",
      quantity: input.quantity ?? 1,
      unit_price_snapshot: unitPriceSnapshot,
      currency_code: exp.currency_code || "MYR",
      guest_notes: input.guest_notes || null,
      staff_notes: input.staff_notes || null,
      guest_name: res.guest_name,
      reservation_date: res.reservation_date,
      reservation_time: res.reservation_time,
      party_size: res.party_size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.resExperiences.unshift(attachment);
    return JSON.parse(JSON.stringify(attachment));
  }

  async removeExperienceFromReservation(linkId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 30));
    const item = this.resExperiences.find((re) => re.id === linkId);
    if (item) {
      if (item.status === "fulfilled") {
        throw new Error("Cannot detach a fulfilled experience booking");
      }
      item.status = "cancelled";
      item.updated_at = new Date().toISOString();
    }
  }

  async updateReservationExperienceStatus(
    linkId: string,
    status: ReservationExperienceStatus
  ): Promise<ReservationExperience> {
    await new Promise((r) => setTimeout(r, 30));
    const item = this.resExperiences.find((re) => re.id === linkId);
    if (!item) throw new Error(`Reservation experience ${linkId} not found`);

    const current = item.status;
    if (current === status) {
      return JSON.parse(JSON.stringify(item));
    }

    // Enforce status machine transitions
    if (current === "fulfilled" || current === "cancelled") {
      throw new Error(`Cannot transition status from terminal state "${current}"`);
    }

    if (current === "pending" && status !== "confirmed" && status !== "cancelled") {
      throw new Error(`Invalid status transition from "pending" to "${status}"`);
    }

    if (current === "confirmed" && status !== "fulfilled" && status !== "cancelled") {
      throw new Error(`Invalid status transition from "confirmed" to "${status}"`);
    }

    item.status = status;
    item.updated_at = new Date().toISOString();
    return JSON.parse(JSON.stringify(item));
  }

  // --------------------------------------------------------------------------
  // Reservation Add-ons Attachment (Operational)
  // --------------------------------------------------------------------------
  async getReservationAddons(reservationId: string): Promise<ReservationAddon[]> {
    await new Promise((r) => setTimeout(r, 20));
    return this.resAddons.filter((ra) => ra.reservation_id === reservationId);
  }

  async attachAddonToReservation(input: AttachAddonInput): Promise<ReservationAddon> {
    await new Promise((r) => setTimeout(r, 40));

    const res = await this.resService.getReservation(input.reservation_id);
    if (!res) throw new Error(`Reservation ${input.reservation_id} not found`);

    const addon = this.addons.find((a) => a.id === input.addon_id);
    if (!addon) throw new Error(`Addon ${input.addon_id} not found`);

    if (!addon.is_active) {
      throw new Error(`Addon "${addon.name}" is currently inactive`);
    }

    // Tenant / Organization match check
    if (res.organization_id !== input.organization_id || addon.organization_id !== input.organization_id) {
      throw new Error("Tenant isolation violation: organization mismatch on add-on attachment");
    }

    // Outlet scope check: if addon has outlet_id, must match reservation outlet_id
    if (addon.outlet_id && addon.outlet_id !== res.outlet_id) {
      throw new Error(`Addon is restricted to outlet ${addon.outlet_name || addon.outlet_id}, not valid for ${res.outlet_id}`);
    }

    // Enforce Explicit Rule A:
    // If the add-on is tied to a specific experience, that experience must be attached to the reservation
    const targetExpId = addon.experience_id || input.experience_id;
    if (targetExpId) {
      const isExpAttached = this.resExperiences.some(
        (re) =>
          re.reservation_id === input.reservation_id &&
          re.experience_id === targetExpId &&
          re.status !== "cancelled"
      );
      if (!isExpAttached) {
        const linkedExp = this.experiences.find((e) => e.id === targetExpId);
        throw new Error(
          `Add-on "${addon.name}" requires package "${linkedExp?.title || targetExpId}" to be attached to this reservation first (Rule A)`
        );
      }
    }

    if (addon.maximum_quantity && (input.quantity ?? 1) > addon.maximum_quantity) {
      throw new Error(`Maximum allowed quantity for "${addon.name}" is ${addon.maximum_quantity}`);
    }

    // Historical Price Snapshot
    const unitPriceSnapshot = addon.price ?? null;

    const attachment: ReservationAddon = {
      id: `ra-${Date.now().toString(36)}`,
      organization_id: input.organization_id,
      outlet_id: input.outlet_id,
      reservation_id: input.reservation_id,
      experience_id: targetExpId || null,
      addon_id: input.addon_id,
      addon_name: addon.name,
      addon_category: addon.category,
      quantity: input.quantity ?? 1,
      unit_price_snapshot: unitPriceSnapshot,
      currency_code: addon.currency_code || "MYR",
      notes: input.notes || null,
      guest_name: res.guest_name,
      reservation_date: res.reservation_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.resAddons.unshift(attachment);
    return JSON.parse(JSON.stringify(attachment));
  }

  async removeAddonFromReservation(linkId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 30));
    this.resAddons = this.resAddons.filter((ra) => ra.id !== linkId);
  }

  // --------------------------------------------------------------------------
  // Operational Aggregates & Metrics
  // --------------------------------------------------------------------------
  async getAllReservationExperiences(_orgId?: string, outletId?: string): Promise<ReservationExperience[]> {
    await new Promise((r) => setTimeout(r, 30));
    let list = [...this.resExperiences];
    if (outletId) {
      list = list.filter((re) => re.outlet_id === outletId);
    }
    return JSON.parse(JSON.stringify(list));
  }

  async getAllReservationAddons(_orgId?: string, outletId?: string): Promise<ReservationAddon[]> {
    await new Promise((r) => setTimeout(r, 30));
    let list = [...this.resAddons];
    if (outletId) {
      list = list.filter((ra) => ra.outlet_id === outletId);
    }
    return JSON.parse(JSON.stringify(list));
  }

  async getSummaryMetrics(_orgId?: string, outletId?: string): Promise<OffersSummaryMetrics> {
    await new Promise((r) => setTimeout(r, 20));

    let exps = this.experiences;
    let offs = this.offers;
    let resExps = this.resExperiences;
    let resAds = this.resAddons;

    if (outletId) {
      exps = exps.filter((e) => e.outlet_id === null || e.outlet_id === outletId);
      offs = offs.filter((o) => o.outlet_id === null || o.outlet_id === outletId);
      resExps = resExps.filter((re) => re.outlet_id === outletId);
      resAds = resAds.filter((ra) => ra.outlet_id === outletId);
    }

    const activeExperiencesCount = exps.filter((e) => e.status === "active").length;
    const activeOffersCount = offs.filter((o) => o.status === "active").length;
    const upcomingExperienceBookingsCount = resExps.filter((re) => re.status !== "cancelled").length;

    // Add-ons attached today (simulate counting items matching today 2026-09-19)
    const todayStr = "2026-09-19";
    const addonsAttachedTodayCount = resAds.filter((ra) => ra.reservation_date === todayStr).length;

    return {
      activeExperiencesCount,
      activeOffersCount,
      upcomingExperienceBookingsCount,
      addonsAttachedTodayCount,
    };
  }
}

// Prepare future Supabase implementation
export class SupabaseOffersService implements IOffersService {
  async listExperiences(_orgId?: string, _outletId?: string, _options?: OffersFilterOptions): Promise<Experience[]> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async getExperience(_id: string): Promise<Experience | null> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async createExperience(_input: CreateExperienceInput): Promise<Experience> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async updateExperience(_id: string, _input: UpdateExperienceInput): Promise<Experience> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async changeExperienceStatus(_id: string, _status: ExperienceStatus): Promise<Experience> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async listOffers(_orgId?: string, _outletId?: string, _options?: OffersFilterOptions): Promise<Offer[]> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async getOffer(_id: string): Promise<Offer | null> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async createOffer(_input: CreateOfferInput): Promise<Offer> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async updateOffer(_id: string, _input: UpdateOfferInput): Promise<Offer> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async changeOfferStatus(_id: string, _status: OfferStatus): Promise<Offer> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async listAddons(_orgId?: string, _outletId?: string, _experienceId?: string): Promise<ExperienceAddon[]> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async getAddon(_id: string): Promise<ExperienceAddon | null> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async createAddon(_input: CreateAddonInput): Promise<ExperienceAddon> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async updateAddon(_id: string, _input: UpdateAddonInput): Promise<ExperienceAddon> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async checkExperienceCompatibility(
    _experienceId: string,
    _reservation: { party_size: number; reservation_date: string; reservation_time: string; outlet_id: string }
  ): Promise<ExperienceCompatibilityResult> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async getReservationExperiences(_reservationId: string): Promise<ReservationExperience[]> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async attachExperienceToReservation(_input: AttachExperienceInput): Promise<ReservationExperience> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async removeExperienceFromReservation(_linkId: string): Promise<void> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async updateReservationExperienceStatus(
    _linkId: string,
    _status: ReservationExperienceStatus
  ): Promise<ReservationExperience> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async getReservationAddons(_reservationId: string): Promise<ReservationAddon[]> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async attachAddonToReservation(_input: AttachAddonInput): Promise<ReservationAddon> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async removeAddonFromReservation(_linkId: string): Promise<void> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async getAllReservationExperiences(_orgId?: string, _outletId?: string): Promise<ReservationExperience[]> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async getAllReservationAddons(_orgId?: string, _outletId?: string): Promise<ReservationAddon[]> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
  async getSummaryMetrics(_orgId?: string, _outletId?: string): Promise<OffersSummaryMetrics> {
    throw new Error("SupabaseOffersService: Production backend not active in preview mode");
  }
}

export const offersService: IOffersService = new FixtureOffersService();
