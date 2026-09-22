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

export interface IOffersService {
  listExperiences(orgId?: string, outletId?: string, options?: OffersFilterOptions): Promise<Experience[]>;
  getExperience(id: string): Promise<Experience | null>;
  createExperience(input: CreateExperienceInput): Promise<Experience>;
  updateExperience(id: string, input: UpdateExperienceInput): Promise<Experience>;
  changeExperienceStatus(id: string, status: ExperienceStatus): Promise<Experience>;
  listOffers(orgId?: string, outletId?: string, options?: OffersFilterOptions): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer | null>;
  createOffer(input: CreateOfferInput): Promise<Offer>;
  updateOffer(id: string, input: UpdateOfferInput): Promise<Offer>;
  changeOfferStatus(id: string, status: OfferStatus): Promise<Offer>;
  listAddons(orgId?: string, outletId?: string, experienceId?: string): Promise<ExperienceAddon[]>;
  getAddon(id: string): Promise<ExperienceAddon | null>;
  createAddon(input: CreateAddonInput): Promise<ExperienceAddon>;
  updateAddon(id: string, input: UpdateAddonInput): Promise<ExperienceAddon>;
  checkExperienceCompatibility(
    experienceId: string,
    reservation: { party_size: number; reservation_date: string; reservation_time: string; outlet_id: string }
  ): Promise<ExperienceCompatibilityResult>;
}
