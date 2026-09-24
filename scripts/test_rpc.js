import { createClient } from '@supabase/supabase-js';

const url = 'https://mtkqkzgjaxugtoazcjvv.supabase.co';
const key = 'sb_publishable_fc6T7jlSX8gmWCnPO49btQ_eMFlJhjm';

const supabase = createClient(url, key);

async function testIntegration() {
  console.log("Testing create_public_reservation RPC...");
  const { data, error } = await supabase.rpc('create_public_reservation', {
    p_org_slug: 'lumina-group',
    p_outlet_slug: 'lumina-klcc',
    p_guest_name: 'Tan Sri Dato Farhan',
    p_guest_phone: '+60123456789',
    p_guest_email: 'farhan@example.com',
    p_reservation_date: '2026-10-01',
    p_reservation_time: '19:30',
    p_party_size: 4,
    p_special_occasion: 'birthday',
    p_special_requests: 'VIP table near window',
    p_external_reference: 'QRESTO-TEST-1001'
  });

  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("RPC Success Result:", data);
  }
}

testIntegration();
