import type {
  Reservation,
  ReservationFilterCriteria,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationStatus,
  SeatingArea,
} from "../types";

export interface IReservationService {
  listReservations(criteria?: Partial<ReservationFilterCriteria>, outletId?: string): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | null>;
  createReservation(input: CreateReservationInput, outletId?: string, orgId?: string): Promise<Reservation>;
  updateReservation(id: string, input: UpdateReservationInput): Promise<Reservation>;
  changeStatus(id: string, newStatus: ReservationStatus, note?: string, changedBy?: string): Promise<Reservation>;
  cancelReservation(id: string, reason?: string, changedBy?: string): Promise<Reservation>;
  getSeatingAreas(outletId?: string): Promise<SeatingArea[]>;
}
