import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_PLACES_API_KEY) {
  console.error('Missing required env vars. Expected:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('- GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 200;
if (!Number.isFinite(limit) || limit <= 0) {
  console.error('Invalid --limit value');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sanitize = (value) => (value == null ? '' : String(value).trim().replace(/\s+/g, ' '));

const buildQueryAddress = (row) => {
  const address = sanitize(row.property_address);
  const state = sanitize(row.selected_state);
  if (!address) return '';
  const lower = address.toLowerCase();
  const parts = [address];
  if (state && !lower.includes(state.toLowerCase())) parts.push(state);
  if (!lower.includes('australia')) parts.push('Australia');
  return parts.join(', ');
};

async function geocodeAddress(address) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', GOOGLE_PLACES_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return { status: `HTTP_${response.status}`, coordinates: null };
  }

  const data = await response.json();
  if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
    return {
      status: data.status,
      coordinates: {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      },
    };
  }

  return { status: data.status || 'UNKNOWN_ERROR', coordinates: null };
}

async function main() {
  console.log(`Starting coordinate backfill (dryRun=${dryRun}, limit=${limit})`);

  const { data: rows, error: fetchError } = await supabase
    .from('properties')
    .select('id, property_address, selected_state, latitude, longitude')
    .is('latitude', null)
    .is('longitude', null)
    .not('property_address', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (fetchError) {
    console.error('Failed to load properties:', fetchError.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No properties need backfill.');
    return;
  }

  console.log(`Found ${rows.length} properties needing coordinates.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const queryAddress = buildQueryAddress(row);
    if (!queryAddress) {
      skipped += 1;
      continue;
    }

    const geocoded = await geocodeAddress(queryAddress);
    if (!geocoded.coordinates) {
      failed += 1;
      console.log(`[${i + 1}/${rows.length}] ${row.id} -> ${geocoded.status}`);
      await sleep(150);
      continue;
    }

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          latitude: geocoded.coordinates.lat,
          longitude: geocoded.coordinates.lng,
          geocode_status: geocoded.status,
          geocode_source: 'backfill_script',
          geocoded_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      if (updateError) {
        failed += 1;
        console.log(`[${i + 1}/${rows.length}] ${row.id} -> UPDATE_FAILED (${updateError.message})`);
        await sleep(150);
        continue;
      }
    }

    updated += 1;
    console.log(`[${i + 1}/${rows.length}] ${row.id} -> OK (${geocoded.coordinates.lat}, ${geocoded.coordinates.lng})`);
    await sleep(150);
  }

  console.log('--- Backfill complete ---');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed:  ${failed}`);
}

main().catch((error) => {
  console.error('Backfill script failed:', error);
  process.exit(1);
});

