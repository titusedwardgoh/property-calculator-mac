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
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 200;
const includeExisting = args.includes('--include-existing');

if (!Number.isFinite(limit) || limit <= 0) {
  console.error('Invalid --limit value');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const buildStreetViewUrl = ({ lat, lng }) => {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/streetview');
  url.searchParams.set('size', '640x360');
  url.searchParams.set('location', `${Number(lat)},${Number(lng)}`);
  url.searchParams.set('fov', '90');
  url.searchParams.set('pitch', '0');
  url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
  return url.toString();
};

const buildPlaceholderUrl = () =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="960" y2="540" gradientUnits="userSpaceOnUse">
          <stop stop-color="#001858"/>
          <stop offset="1" stop-color="#0A2F8D"/>
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill="url(#bg)"/>
      <circle cx="812" cy="112" r="158" fill="#f582ae" fill-opacity="0.35"/>
      <circle cx="126" cy="460" r="220" fill="#f582ae" fill-opacity="0.20"/>
      <path d="M220 344L356 238L470 320L616 210L740 312V404H220V344Z" fill="#f582ae" fill-opacity="0.35"/>
      <rect x="220" y="404" width="520" height="12" rx="6" fill="#f582ae" fill-opacity="0.85"/>
      <text x="480" y="180" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="52" font-weight="700">PropWiz</text>
      <text x="480" y="226" text-anchor="middle" fill="#ffffff" fill-opacity="0.9" font-family="Arial, sans-serif" font-size="24">Property Preview Unavailable</text>
    </svg>`
  )}`;

async function geocodeAddress(address) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', GOOGLE_PLACES_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return { status: `HTTP_${response.status}`, coordinates: null, placeId: null };
  }

  const data = await response.json();
  if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
    return {
      status: data.status,
      placeId: data.results[0].place_id || null,
      coordinates: {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      },
    };
  }

  return { status: data.status || 'UNKNOWN_ERROR', coordinates: null, placeId: null };
}

async function getPlacePhotoUrl(placeId) {
  if (!placeId) return null;

  const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  detailsUrl.searchParams.set('place_id', placeId);
  detailsUrl.searchParams.set('fields', 'photo');
  detailsUrl.searchParams.set('key', GOOGLE_PLACES_API_KEY);

  const response = await fetch(detailsUrl.toString());
  if (!response.ok) return null;
  const data = await response.json();
  const photoRef = data?.result?.photos?.[0]?.photo_reference;
  if (!photoRef) return null;

  const photoUrl = new URL('https://maps.googleapis.com/maps/api/place/photo');
  photoUrl.searchParams.set('maxwidth', '1280');
  photoUrl.searchParams.set('photo_reference', photoRef);
  photoUrl.searchParams.set('key', GOOGLE_PLACES_API_KEY);
  return photoUrl.toString();
}

async function main() {
  console.log(
    `Starting property photo backfill (dryRun=${dryRun}, limit=${limit}, includeExisting=${includeExisting})`
  );

  let query = supabase
    .from('properties')
    .select('id, property_address, selected_state, latitude, longitude, photo_url')
    .not('property_address', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (!includeExisting) {
    query = query.is('photo_url', null);
  }

  const { data: rows, error: fetchError } = await query;
  if (fetchError) {
    console.error('Failed to load properties:', fetchError.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No properties need photo backfill.');
    return;
  }

  console.log(`Found ${rows.length} properties to process.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let usedPlacePhoto = 0;
  let usedStreetView = 0;
  let usedPlaceholder = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const queryAddress = buildQueryAddress(row);
    if (!queryAddress) {
      skipped += 1;
      continue;
    }

    let coordinates =
      row.latitude != null && row.longitude != null
        ? { lat: Number(row.latitude), lng: Number(row.longitude) }
        : null;
    let placeId = null;

    if (!coordinates || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
      const geocoded = await geocodeAddress(queryAddress);
      coordinates = geocoded.coordinates;
      placeId = geocoded.placeId;
    } else {
      // Still attempt to derive place id for place photo.
      const geocoded = await geocodeAddress(queryAddress);
      placeId = geocoded.placeId;
    }

    let photoUrl = await getPlacePhotoUrl(placeId);
    let photoSource = null;

    if (photoUrl) {
      photoSource = 'place_photo';
      usedPlacePhoto += 1;
    } else {
      const streetViewUrl = buildStreetViewUrl(coordinates || {});
      if (streetViewUrl) {
        photoUrl = streetViewUrl;
        photoSource = 'street_view';
        usedStreetView += 1;
      } else {
        photoUrl = buildPlaceholderUrl();
        photoSource = 'placeholder';
        usedPlaceholder += 1;
      }
    }

    if (!dryRun) {
      const updatePayload = {
        photo_url: photoUrl,
        photo_source: photoSource,
        photo_updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('properties')
        .update(updatePayload)
        .eq('id', row.id);

      if (updateError) {
        failed += 1;
        console.log(`[${i + 1}/${rows.length}] ${row.id} -> UPDATE_FAILED (${updateError.message})`);
        await sleep(180);
        continue;
      }
    }

    updated += 1;
    console.log(`[${i + 1}/${rows.length}] ${row.id} -> OK (${photoSource})`);
    await sleep(180);
  }

  console.log('--- Photo backfill complete ---');
  console.log(`Updated:        ${updated}`);
  console.log(`Skipped:        ${skipped}`);
  console.log(`Failed:         ${failed}`);
  console.log(`Place photo:    ${usedPlacePhoto}`);
  console.log(`Street view:    ${usedStreetView}`);
  console.log(`Placeholder:    ${usedPlaceholder}`);
}

main().catch((error) => {
  console.error('Photo backfill script failed:', error);
  process.exit(1);
});
