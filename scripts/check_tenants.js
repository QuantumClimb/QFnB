import { createClient } from '@supabase/supabase-js';

const url = 'https://mtkqkzgjaxugtoazcjvv.supabase.co';
const key = 'sb_publishable_fc6T7jlSX8gmWCnPO49btQ_eMFlJhjm';

const supabase = createClient(url, key);

async function checkTenants() {
  const { data: orgs } = await supabase.from('organizations').select('*');
  const { data: outlets } = await supabase.from('outlets').select('*');
  const { data: tables } = await supabase.from('restaurant_tables').select('*');
  const { data: seating } = await supabase.from('seating_areas').select('*');

  console.log("Database Organizations:", orgs);
  console.log("Database Outlets:", outlets);
  console.log("Database Tables Count:", tables ? tables.length : 0);
  console.log("Database Seating Areas Count:", seating ? seating.length : 0);
}

checkTenants();
