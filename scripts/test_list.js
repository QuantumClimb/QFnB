import { createClient } from '@supabase/supabase-js';

const url = 'https://mtkqkzgjaxugtoazcjvv.supabase.co';
const key = 'sb_publishable_fc6T7jlSX8gmWCnPO49btQ_eMFlJhjm';

const supabase = createClient(url, key);

async function testList() {
  console.log("Fetching reservations from Q F&B OS database...");
  const { data, error } = await supabase.from('reservations').select('*');

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log(`Retrieved ${data.length} reservation(s):`);
    console.log(JSON.stringify(data, null, 2));
  }
}

testList();
