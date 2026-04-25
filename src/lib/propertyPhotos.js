const encodeSvg = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const PROPWIZ_BRANDED_PLACEHOLDER_URL = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" fill="none">
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
</svg>
`);

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getStreetViewPhotoUrl = ({ lat, lng, location, apiKey, size = '640x360' }) => {
  const latitude = toFiniteNumber(lat);
  const longitude = toFiniteNumber(lng);
  const hasCoordinates = latitude != null && longitude != null;
  const locationString = typeof location === 'string' ? location.trim() : '';
  if (!hasCoordinates && !locationString) return null;
  if (!apiKey) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/streetview');
  url.searchParams.set('size', size);
  url.searchParams.set('location', hasCoordinates ? `${latitude},${longitude}` : locationString);
  url.searchParams.set('fov', '90');
  url.searchParams.set('pitch', '0');
  url.searchParams.set('source', 'outdoor');
  url.searchParams.set('return_error_code', 'true');
  url.searchParams.set('key', apiKey);
  return url.toString();
};

export const getStreetViewMetadataStatus = async ({ lat, lng, location, apiKey }) => {
  const latitude = toFiniteNumber(lat);
  const longitude = toFiniteNumber(lng);
  const hasCoordinates = latitude != null && longitude != null;
  const locationString = typeof location === 'string' ? location.trim() : '';
  if (!hasCoordinates && !locationString) return 'INVALID_REQUEST';
  if (!apiKey) return 'INVALID_REQUEST';

  const url = new URL('https://maps.googleapis.com/maps/api/streetview/metadata');
  url.searchParams.set('location', hasCoordinates ? `${latitude},${longitude}` : locationString);
  url.searchParams.set('source', 'outdoor');
  url.searchParams.set('key', apiKey);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return `HTTP_${response.status}`;
    const data = await response.json();
    return data?.status || 'UNKNOWN_ERROR';
  } catch {
    return 'NETWORK_ERROR';
  }
};

export const getPropertyPhotoUrl = async (placeId, placesService) => {
  if (!placeId || !placesService) return null;

  const details = await new Promise((resolve) => {
    placesService.getDetails(
      {
        placeId,
        fields: ['photos'],
      },
      (result, status) => {
        if (status === 'OK' && result) {
          resolve(result);
          return;
        }
        resolve(null);
      }
    );
  });

  const firstPhoto = details?.photos?.[0];
  if (!firstPhoto || typeof firstPhoto.getUrl !== 'function') return null;

  return firstPhoto.getUrl({
    maxWidth: 1280,
    maxHeight: 720,
  });
};
