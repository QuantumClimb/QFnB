# Q RESTOBAR — Frontend Integration Guide with Q F&B OS Backend

**Document Version:** 1.0.0  
**Generated Date:** 2026-09-24  
**Target Repository:** `QRestobar` (`K:\H DRIVE\Quantum Climb\APPS\Quantum Projects\QRestobar`)  
**Backend:** Q F&B OS Supabase Project (`https://mtkqkzgjaxugtoazcjvv.supabase.co`)  
**Status:** READY FOR FRONTEND INTEGRATION

---

## 1. Executive Summary

This guide outlines the exact code modifications required in the **Q RESTOBAR** customer-facing website to connect its reservation form directly to the **Q F&B OS** live operational backend.

By completing these steps:
1. All table reservation requests made on Q RESTOBAR will write directly to Q F&B OS.
2. Guest CRM profiles (name, phone, email) will be automatically normalized and deduplicated.
3. Bookings will instantly appear on the Q F&B OS Host & Overview dashboards in real time.
4. Guests will receive instant confirmation references (e.g. `QRESTO-829140`) and secure status tokens.

---

## 2. Environment Variables Configuration (`QRestobar/.env`)

Ensure the `.env` file in the **Q RESTOBAR** project contains the active Q F&B OS Supabase credentials:

```env
# Q RESTOBAR .env Configuration
VITE_DEMO_MODE=false
VITE_SUPABASE_URL=https://mtkqkzgjaxugtoazcjvv.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_fc6T7jlSX8gmWCnPO49btQ_eMFlJhjm

# Tenant Configuration
VITE_ORG_SLUG=lumina-group
VITE_OUTLET_SLUG=lumina-klcc
```

---

## 3. Step-by-Step Code Implementation

### Step 3.1: Initialize Supabase Client (`src/services/supabaseClient.ts`)

Ensure `supabaseClient.ts` is configured to connect using the environment variables:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. App may run in offline mode.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### Step 3.2: Refactor Reservation Service (`src/services/reservationService.ts`)

Replace the local storage / mock implementation in `reservationService.ts` with calls to the live `create_public_reservation` RPC function:

```typescript
import { supabase } from './supabaseClient';

export interface CreateReservationPayload {
  full_name: string;
  phone: string;
  email?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guest_count: number;
  seating_preference?: string;
  occasion?: string;
  special_requests?: string;
}

export interface ReservationResponse {
  success: boolean;
  reservation_id: string;
  reference_number: string;
  reservation_token: string;
  status: string;
  guest_id: string;
  message: string;
}

export const reservationService = {
  /**
   * Submit a new guest reservation into Q F&B OS Master Database
   */
  async createReservation(data: CreateReservationPayload): Promise<ReservationResponse> {
    const orgSlug = import.meta.env.VITE_ORG_SLUG || 'lumina-group';
    const outletSlug = import.meta.env.VITE_OUTLET_SLUG || 'lumina-klcc';

    const { data: result, error } = await supabase.rpc('create_public_reservation', {
      p_org_slug: orgSlug,
      p_outlet_slug: outletSlug,
      p_guest_name: data.full_name,
      p_guest_phone: data.phone,
      p_guest_email: data.email || null,
      p_reservation_date: data.date,
      p_reservation_time: data.time,
      p_party_size: data.guest_count,
      p_seating_preference: data.seating_preference || null,
      p_special_occasion: data.occasion || null,
      p_special_requests: data.special_requests || null,
    });

    if (error) {
      console.error("[QRESTOBAR] Reservation submission error:", error);
      throw new Error(error.message || "Failed to submit reservation.");
    }

    return result as ReservationResponse;
  },

  /**
   * Check reservation status by reference number or token
   */
  async getReservationStatus(tokenOrReference: string) {
    const { data: result, error } = await supabase.rpc('get_public_reservation_status', {
      p_token: tokenOrReference,
    });

    if (error) {
      console.error("[QRESTOBAR] Status check error:", error);
      throw new Error(error.message || "Reservation not found.");
    }

    return result;
  }
};
```

---

### Step 3.3: Connect the Reservation Form Component (`src/components/ReservationForm.tsx`)

In `ReservationForm.tsx`, call `reservationService.createReservation()` upon form submission:

```typescript
import React, { useState } from 'react';
import { reservationService } from '../services/reservationService';

export function ReservationForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    date: '',
    time: '19:00',
    guest_count: 2,
    seating_preference: 'Main Dining Hall',
    occasion: 'casual',
    special_requests: ''
  });

  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await reservationService.createReservation(formData);
      if (response.success) {
        setConfirmation(response);
      } else {
        setErrorMsg(response.message || "Booking failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while booking.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmation) {
    return (
      <div className="p-6 bg-slate-900 text-white rounded-xl shadow-2xl text-center">
        <h3 className="text-2xl font-bold text-emerald-400 mb-2">Reservation Confirmed!</h3>
        <p className="text-slate-300 mb-4">Your booking has been received by Q F&B OS.</p>
        
        <div className="bg-slate-800 p-4 rounded-lg mb-4 text-left font-mono text-sm">
          <p><span className="text-slate-400">Reference:</span> <strong className="text-amber-400">{confirmation.reference_number}</strong></p>
          <p><span className="text-slate-400">Status:</span> <span className="uppercase text-emerald-400 font-semibold">{confirmation.status}</span></p>
          <p><span className="text-slate-400">Date/Time:</span> {formData.date} at {formData.time}</p>
          <p><span className="text-slate-400">Party Size:</span> {formData.guest_count} guests</p>
        </div>

        <button 
          onClick={() => setConfirmation(null)}
          className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition"
        >
          Book Another Table
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-rose-500/20 text-rose-300 rounded border border-rose-500/40 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Form Fields: Name, Phone, Email, Date, Time, Guest Count, Occasion, Notes */}
      {/* ... Standard form elements ... */}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
      >
        {loading ? 'Submitting to Q F&B OS...' : 'Confirm Reservation'}
      </button>
    </form>
  );
}
```

---

## 4. End-to-End Data Flow Diagram

```
┌─────────────────────────┐
│     GUEST BROWSER       │
│   (Q RESTOBAR Website)  │
└────────────┬────────────┘
             │
             │ 1. Submits Reservation Form (Name, Phone, Date, Time, Party Size)
             ▼
┌─────────────────────────┐
│  create_public_reservation RPC │  (SECURITY DEFINER Engine)
└────────────┬────────────┘
             │
             ├── 2. Resolves 'lumina-group' & 'lumina-klcc' UUIDs
             ├── 3. Normalizes Phone (+60123456789)
             ├── 4. Matches/Creates Guest Record in CRM (`guests` table)
             ├── 5. Generates Reference (`QRESTO-829140`) & Token
             └── 6. Inserts into `reservations` table (booking_source = 'q_restobar')
             │
             ▼
┌─────────────────────────┐
│     Q F&B OS APP        │  Realtime Host & Overview Dashboards update
│  (Staff Operational App)│  instantly with new reservation badge & alert.
└─────────────────────────┘
```

---

## 5. Verification & Testing Checklist

Once the above code edits are applied to **Q RESTOBAR**:

1. **Submit a Test Booking**:
   - Fill out the booking form on Q RESTOBAR with a test name (e.g., `Test Guest`).
2. **Verify Confirmation**:
   - Ensure the success modal displays a valid reference number starting with `QRESTO-`.
3. **Verify Host Dashboard in Q F&B OS**:
   - Open **Q F&B OS** (`/app/overview` or `/app/reservations`).
   - Confirm the reservation appears under **Today's Bookings** with `Source: Q RESTOBAR`.
4. **Verify Guest CRM**:
   - Open `/app/guests` in Q F&B OS.
   - Confirm `Test Guest` appears with visit history and phone number mapped.

---

**End of Integration Guide v1.0.0**
