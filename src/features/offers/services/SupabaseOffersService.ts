import { supabase } from "../../../lib/supabase";
import type { IOffersService } from "./IOffersService";
import type {
  Experience,
  ExperienceStatus,
  Offer,
  OfferStatus,
  ExperienceAddon,
  OffersFilterOptions,
  CreateExperienceInput,
  UpdateExperienceInput,
  CreateOfferInput,
  UpdateOfferInput,
  CreateAddonInput,
  UpdateAddonInput,
  ExperienceCompatibilityResult,
} from "../types";

export class SupabaseOffersService implements IOffersService {
  async listExperiences(orgId = "dev-org-001", outletId?: string, options?: OffersFilterOptions): Promise<Experience[]> {
    let query = supabase.from("experiences").select("*").eq("organization_id", orgId);
    if (outletId) query = query.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
    if (options?.status && options.status !== "ALL") query = query.eq("status", options.status.toLowerCase());

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("[SupabaseOffersService] listExperiences error:", error);
      return [];
    }

    return (data || []).map(this.mapExpToDomain);
  }

  async getExperience(id: string): Promise<Experience | null> {
    const { data, error } = await supabase.from("experiences").select("*").eq("id", id).single();
    if (error || !data) return null;
    return this.mapExpToDomain(data);
  }

  async createExperience(input: CreateExperienceInput): Promise<Experience> {
    const row: Record<string, any> = {
      organization_id: input.organization_id || "dev-org-001",
      outlet_id: input.outlet_id || null,
      title: input.title,
      slug: input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      short_description: input.short_description || null,
      description: input.description || null,
      category: input.category,
      status: "active",
      is_public: input.is_public,
      is_featured: input.is_featured ?? false,
      minimum_party_size: input.minimum_party_size,
      maximum_party_size: input.maximum_party_size,
      duration_minutes: input.duration_minutes || null,
      base_price: input.base_price || null,
      currency_code: input.currency_code || "MYR",
      preferred_seating_area_id: input.preferred_seating_area_id || null,
      valid_from: input.valid_from || null,
      valid_until: input.valid_until || null,
      booking_lead_minutes: input.booking_lead_minutes || null,
      guest_terms: input.guest_terms || null,
      internal_notes: input.internal_notes || null,
      image_url: input.image_url || null,
    };

    const { data, error } = await supabase.from("experiences").insert(row).select().single();
    if (error) throw error;
    return this.mapExpToDomain(data);
  }

  async updateExperience(id: string, input: UpdateExperienceInput): Promise<Experience> {
    const updates: Record<string, any> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.short_description !== undefined) updates.short_description = input.short_description;
    if (input.description !== undefined) updates.description = input.description;
    if (input.category !== undefined) updates.category = input.category;
    if (input.status !== undefined) updates.status = input.status;
    if (input.is_public !== undefined) updates.is_public = input.is_public;
    if (input.is_featured !== undefined) updates.is_featured = input.is_featured;
    if (input.minimum_party_size !== undefined) updates.minimum_party_size = input.minimum_party_size;
    if (input.maximum_party_size !== undefined) updates.maximum_party_size = input.maximum_party_size;
    if (input.duration_minutes !== undefined) updates.duration_minutes = input.duration_minutes;
    if (input.base_price !== undefined) updates.base_price = input.base_price;
    if (input.preferred_seating_area_id !== undefined) updates.preferred_seating_area_id = input.preferred_seating_area_id;
    if (input.valid_from !== undefined) updates.valid_from = input.valid_from;
    if (input.valid_until !== undefined) updates.valid_until = input.valid_until;
    if (input.booking_lead_minutes !== undefined) updates.booking_lead_minutes = input.booking_lead_minutes;
    if (input.guest_terms !== undefined) updates.guest_terms = input.guest_terms;
    if (input.internal_notes !== undefined) updates.internal_notes = input.internal_notes;
    if (input.image_url !== undefined) updates.image_url = input.image_url;

    const { data, error } = await supabase.from("experiences").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return this.mapExpToDomain(data);
  }

  async changeExperienceStatus(id: string, status: ExperienceStatus): Promise<Experience> {
    return this.updateExperience(id, { status });
  }

  async listOffers(orgId = "dev-org-001", outletId?: string, options?: OffersFilterOptions): Promise<Offer[]> {
    let query = supabase.from("offers").select("*").eq("organization_id", orgId);
    if (outletId) query = query.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
    if (options?.status && options.status !== "ALL") query = query.eq("status", options.status.toLowerCase());

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("[SupabaseOffersService] listOffers error:", error);
      return [];
    }

    return (data || []).map(this.mapOfferToDomain);
  }

  async getOffer(id: string): Promise<Offer | null> {
    const { data, error } = await supabase.from("offers").select("*").eq("id", id).single();
    if (error || !data) return null;
    return this.mapOfferToDomain(data);
  }

  async createOffer(input: CreateOfferInput): Promise<Offer> {
    const row: Record<string, any> = {
      organization_id: input.organization_id || "dev-org-001",
      outlet_id: input.outlet_id || null,
      title: input.title,
      short_description: input.short_description || null,
      description: input.description || null,
      status: input.status || "active",
      is_public: input.is_public,
      is_featured: input.is_featured ?? false,
      valid_from: input.valid_from || null,
      valid_until: input.valid_until || null,
      experience_id: input.experience_id || null,
      eligibility_notes: input.eligibility_notes || null,
      redemption_notes: input.redemption_notes || null,
      internal_notes: input.internal_notes || null,
      image_url: input.image_url || null,
    };

    const { data, error } = await supabase.from("offers").insert(row).select().single();
    if (error) throw error;
    return this.mapOfferToDomain(data);
  }

  async updateOffer(id: string, input: UpdateOfferInput): Promise<Offer> {
    const updates: Record<string, any> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.short_description !== undefined) updates.short_description = input.short_description;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;
    if (input.is_public !== undefined) updates.is_public = input.is_public;
    if (input.is_featured !== undefined) updates.is_featured = input.is_featured;
    if (input.valid_from !== undefined) updates.valid_from = input.valid_from;
    if (input.valid_until !== undefined) updates.valid_until = input.valid_until;
    if (input.experience_id !== undefined) updates.experience_id = input.experience_id;
    if (input.eligibility_notes !== undefined) updates.eligibility_notes = input.eligibility_notes;
    if (input.redemption_notes !== undefined) updates.redemption_notes = input.redemption_notes;
    if (input.internal_notes !== undefined) updates.internal_notes = input.internal_notes;

    const { data, error } = await supabase.from("offers").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return this.mapOfferToDomain(data);
  }

  async changeOfferStatus(id: string, status: OfferStatus): Promise<Offer> {
    return this.updateOffer(id, { status });
  }

  async listAddons(orgId = "dev-org-001", _outletId?: string, experienceId?: string): Promise<ExperienceAddon[]> {
    let query = supabase.from("experience_addons").select("*").eq("organization_id", orgId);
    if (experienceId) query = query.eq("experience_id", experienceId);

    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(this.mapAddonToDomain);
  }

  async getAddon(id: string): Promise<ExperienceAddon | null> {
    const { data, error } = await supabase.from("experience_addons").select("*").eq("id", id).single();
    if (error || !data) return null;
    return this.mapAddonToDomain(data);
  }

  async createAddon(input: CreateAddonInput): Promise<ExperienceAddon> {
    const row: Record<string, any> = {
      organization_id: input.organization_id || "dev-org-001",
      outlet_id: input.outlet_id || null,
      experience_id: input.experience_id || null,
      name: input.name,
      description: input.description || null,
      category: input.category,
      price: input.price || null,
      currency_code: input.currency_code || "MYR",
      is_public: input.is_public,
      is_active: input.is_active,
      maximum_quantity: input.maximum_quantity || null,
    };

    const { data, error } = await supabase.from("experience_addons").insert(row).select().single();
    if (error) throw error;
    return this.mapAddonToDomain(data);
  }

  async updateAddon(id: string, input: UpdateAddonInput): Promise<ExperienceAddon> {
    const updates: Record<string, any> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.category !== undefined) updates.category = input.category;
    if (input.price !== undefined) updates.price = input.price;
    if (input.is_public !== undefined) updates.is_public = input.is_public;
    if (input.is_active !== undefined) updates.is_active = input.is_active;
    if (input.maximum_quantity !== undefined) updates.maximum_quantity = input.maximum_quantity;

    const { data, error } = await supabase.from("experience_addons").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return this.mapAddonToDomain(data);
  }

  async checkExperienceCompatibility(
    experienceId: string,
    reservation: { party_size: number; reservation_date: string; reservation_time: string; outlet_id: string }
  ): Promise<ExperienceCompatibilityResult> {
    const exp = await this.getExperience(experienceId);
    if (!exp) return { isCompatible: false, reasons: ["Experience not found"] };

    const reasons: string[] = [];
    if (reservation.party_size < exp.minimum_party_size) {
      reasons.push(`Party size below minimum of ${exp.minimum_party_size}`);
    }
    if (reservation.party_size > exp.maximum_party_size) {
      reasons.push(`Party size exceeds maximum of ${exp.maximum_party_size}`);
    }
    if (exp.outlet_id && exp.outlet_id !== reservation.outlet_id) {
      reasons.push("Experience not offered at this outlet");
    }

    return {
      isCompatible: reasons.length === 0,
      reasons,
    };
  }

  private mapExpToDomain(row: any): Experience {
    return {
      id: row.id,
      organization_id: row.organization_id,
      outlet_id: row.outlet_id || null,
      outlet_name: row.outlet_name || null,
      title: row.title,
      slug: row.slug || "",
      short_description: row.short_description || null,
      description: row.description || null,
      category: row.category || "other",
      status: row.status || "draft",
      is_public: row.is_public ?? true,
      is_featured: row.is_featured ?? false,
      minimum_party_size: row.minimum_party_size || row.min_party_size || 1,
      maximum_party_size: row.maximum_party_size || row.max_party_size || 20,
      duration_minutes: row.duration_minutes || null,
      base_price: row.base_price != null ? Number(row.base_price) : row.price != null ? Number(row.price) : null,
      currency_code: row.currency_code || row.currency || "MYR",
      preferred_seating_area_id: row.preferred_seating_area_id || null,
      preferred_seating_area_name: row.preferred_seating_area_name || null,
      valid_from: row.valid_from || null,
      valid_until: row.valid_until || null,
      booking_lead_minutes: row.booking_lead_minutes || null,
      guest_terms: row.guest_terms || null,
      internal_notes: row.internal_notes || null,
      image_url: row.image_url || null,
      availability_rules: row.availability_rules || undefined,
      upcoming_bookings_count: row.upcoming_bookings_count || undefined,
      created_by: row.created_by || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapOfferToDomain(row: any): Offer {
    return {
      id: row.id,
      organization_id: row.organization_id,
      outlet_id: row.outlet_id || null,
      outlet_name: row.outlet_name || null,
      title: row.title,
      short_description: row.short_description || null,
      description: row.description || null,
      status: row.status || "draft",
      is_public: row.is_public ?? true,
      is_featured: row.is_featured ?? false,
      valid_from: row.valid_from || null,
      valid_until: row.valid_until || null,
      experience_id: row.experience_id || null,
      experience_title: row.experience_title || null,
      eligibility_notes: row.eligibility_notes || null,
      redemption_notes: row.redemption_notes || null,
      internal_notes: row.internal_notes || null,
      image_url: row.image_url || null,
      created_by: row.created_by || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapAddonToDomain(row: any): ExperienceAddon {
    return {
      id: row.id,
      organization_id: row.organization_id,
      outlet_id: row.outlet_id || null,
      outlet_name: row.outlet_name || null,
      experience_id: row.experience_id || null,
      experience_title: row.experience_title || null,
      name: row.name,
      description: row.description || null,
      category: row.category || "other",
      price: row.price != null ? Number(row.price) : null,
      currency_code: row.currency_code || "MYR",
      is_public: row.is_public ?? true,
      is_active: row.is_active ?? true,
      maximum_quantity: row.maximum_quantity || null,
      created_by: row.created_by || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
