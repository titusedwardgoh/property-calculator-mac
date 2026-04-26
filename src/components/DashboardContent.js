"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Play, Eye, Trash2, FileText, Loader2, X, AlertTriangle, Search, ArrowUpDown, Map as MapIcon, List, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useFormStore } from '@/stores/formStore';
import { resetSessionAndForm } from '@/lib/sessionManager';
import {
  getPropertyPhotoUrl,
  getStreetViewPhotoUrl,
  getStreetViewMetadataStatus,
  PROPWIZ_BRANDED_PLACEHOLDER_URL,
} from '@/lib/propertyPhotos';

function SurveyInspectedToggle({ inspected, onToggle, compact }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full focus:outline-none active:outline-none ${
        compact ? 'h-6 w-12' : 'h-6 w-14'
      }`}
      animate={{
        backgroundColor: inspected ? '#10b981' : '#ef4444',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <AnimatePresence>
        {!inspected && (
          <motion.span
            key="no"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-none absolute right-0 flex h-full items-center font-bold text-white z-10 ${
              compact ? 'pr-2.5 text-[10px]' : 'pr-3 text-[10px]'
            }`}
          >
            No
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {inspected && (
          <motion.span
            key="yes"
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-none absolute left-0 flex h-full items-center font-bold text-white z-10 ${
              compact ? 'pl-2 text-[10px]' : 'pl-2.5 text-[10px]'
            }`}
          >
            Yes
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span
        className={`absolute rounded-full bg-white shadow-md ${
          compact ? 'h-4 w-4' : 'h-4.5 w-4.5'
        }`}
        animate={{
          left: inspected ? 'auto' : compact ? '0.15rem' : '0.225rem',
          right: inspected ? (compact ? '0.125rem' : '0.155rem') : 'auto',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
    </motion.button>
  );
}

const AUSTRALIA_CENTER = { lat: -25.2744, lng: 133.7751 };
/** Zoom when a marker is clicked (property-level view) */
const MARKER_FOCUS_ZOOM = 17;
const MAP_CONSTRUCTOR_RETRY_DELAY_MS = 150;
const MAP_CONSTRUCTOR_RETRY_ATTEMPTS = 20;
const GEOCODE_CACHE_SESSION_KEY = 'dashboardGeocodeCacheV1';
const PHOTO_CACHE_SESSION_KEY = 'dashboardPropertyPhotoCacheV1';
const GEOCODE_REQUEST_GAP_MS = 120;
const PHOTO_REQUEST_GAP_MS = 150;

const sanitizeAddressPart = (value) => {
  if (!value) return '';
  return String(value).trim().replace(/\s+/g, ' ');
};

const buildSurveyAddress = (survey) => {
  const address = sanitizeAddressPart(survey?.property_address);
  const state = sanitizeAddressPart(survey?.selected_state);
  if (!address) return '';
  const addressLower = address.toLowerCase();
  const hasStateAlready = state ? addressLower.includes(state.toLowerCase()) : false;
  const hasCountryAlready = addressLower.includes('australia');
  const parts = [address];
  if (state && !hasStateAlready) {
    parts.push(state);
  }
  if (!hasCountryAlready) {
    parts.push('Australia');
  }
  return parts.join(', ');
};

const createMapCacheKey = (surveyId, queryAddress) => `${surveyId}::${queryAddress}`;
const getPhotoCacheKey = (survey) =>
  `${survey?.id || 'unknown'}::${buildSurveyAddress(survey) || 'no-address'}`;

const extractGoogleApiKeyFromScriptUrl = (scriptUrl) => {
  if (!scriptUrl) return '';
  try {
    const parsed = new URL(scriptUrl);
    return parsed.searchParams.get('key') || '';
  } catch {
    return '';
  }
};

const AU_STATE_POSTCODE_RE = /\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\s+(\d{4})\b/i;

/**
 * Splits an Australian-style address into a street/suburb line and a
 * state/postcode line. Falls back to `fallbackState` when the address
 * string doesn't contain a state + postcode.
 */
const splitPropertyAddress = (address, fallbackState = '') => {
  const trimmed = (address || '').trim();
  if (!trimmed) return { primary: '', secondary: fallbackState || '' };

  const match = trimmed.match(AU_STATE_POSTCODE_RE);
  if (match) {
    const state = match[1].toUpperCase();
    const postcode = match[2];
    let primary = trimmed.slice(0, match.index).trim();
    primary = primary.replace(/,\s*$/, '').trim();
    return { primary: primary || trimmed, secondary: `${state} ${postcode}` };
  }

  return { primary: trimmed, secondary: fallbackState || '' };
};

/**
 * Approximate distance (in km) between two lat/lng points using equirectangular projection.
 * Accurate enough for clustering decisions at city/country scale.
 */
const approxDistanceKm = (a, b) => {
  const latRad = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const dLat = (b.lat - a.lat) * 111;
  const dLng = (b.lng - a.lng) * 111 * Math.cos(latRad);
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

/**
 * Finds the densest cluster of points within `radiusKm` of a center point.
 * Returns the subset that would make the "best" default view, or null if
 * everything already fits tightly (caller should just fit all points).
 */
const findDensestClusterPoints = (points, radiusKm = 60) => {
  if (!points || points.length <= 1) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  points.forEach((p) => {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  });

  const overallSpanKm = approxDistanceKm(
    { lat: minLat, lng: minLng },
    { lat: maxLat, lng: maxLng }
  );

  if (overallSpanKm < radiusKm * 2.5) return null;

  let bestCluster = [];
  points.forEach((center) => {
    const cluster = points.filter((p) => approxDistanceKm(center, p) <= radiusKm);
    if (cluster.length > bestCluster.length) {
      bestCluster = cluster;
    }
  });

  if (bestCluster.length < 2) return null;
  if (bestCluster.length === points.length) return null;
  return bestCluster;
};

const escapeHtml = (value) => {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const formatMapInfoDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  try {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
};

const buildMarkerInfoHtml = (point) => {
  const { primary, secondary } = splitPropertyAddress(point.address || point.label || 'Property', point.state || '');
  const addressTitle = `<div style="font-weight:600;line-height:1.4;margin-bottom:8px;font-size:15px;"><div>${escapeHtml(primary)}</div>${secondary ? `<div style="font-weight:500;color:#6b7280;">${escapeHtml(secondary)}</div>` : ''}</div>`;
  const priceText =
    point.price != null && point.price !== ''
      ? `$${Number(point.price).toLocaleString()}`
      : 'TBD';
  const thumbnailUrl = point.photoUrl || PROPWIZ_BRANDED_PLACEHOLDER_URL;
  return `
    <div style="width:360px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.15); display: flex; align-items: stretch; min-height: 140px;">
      <div style="width:42%; position:relative; background:#f3f4f6; overflow:hidden; line-height: 0; font-size: 0;">
          <img 
            src="${escapeHtml(thumbnailUrl)}" 
            alt="Property" 
            style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; display:block; border:0; margin:0;" 
          />
        </div>
        <div style="width:58%; padding:16px; font-family:system-ui,-apple-system,sans-serif; font-size:13px; line-height:1.5; color:#111827; display:flex; flex-direction:column; justify-content:center; background: #ffffff;">
          ${addressTitle}
          <div style="margin-bottom:4px;"><span style="color:#6b7280;">Price:</span> ${escapeHtml(priceText)}</div>
          <div><span style="color:#6b7280;">Inspected:</span> <span style="color:${point.inspected ? '#10b981' : '#ef4444'}; font-weight:600;">${point.inspected ? 'Yes' : 'No'}</span></div>
        </div>
    </div>
  `;
};

const GEOCODE_TERMINAL_FAILURE_STATUSES = new Set([
  'ZERO_RESULTS',
  'INVALID_REQUEST',
  'REQUEST_DENIED',
]);
const GEOCODE_RETRYABLE_STATUSES = new Set([
  'OVER_QUERY_LIMIT',
  'UNKNOWN_ERROR',
  'ERROR',
]);
const GEOCODE_MAX_ATTEMPTS = 4;
// First-load map/geocoder availability can be delayed by network + Google script readiness.
// Keep retrying long enough so user interactions are not needed to "kick" the map.
const GEOCODE_SYNC_RETRY_DELAY_MS = 1000;
const GEOCODE_SYNC_MAX_RETRIES = 20;

const geocodeAddress = (geocoder, address) =>
  new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0] && results[0].geometry?.location) {
        const location = results[0].geometry.location;
        resolve({
          status,
          placeId: results[0].place_id || null,
          coordinates: {
            lat: location.lat(),
            lng: location.lng(),
          },
        });
        return;
      }
      resolve({
        status,
        placeId: null,
        coordinates: null,
      });
    });
  });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const geocodeAddressWithRetry = async (geocoder, address) => {
  let lastResult = null;
  for (let attempt = 1; attempt <= GEOCODE_MAX_ATTEMPTS; attempt += 1) {
    const result = await geocodeAddress(geocoder, address);
    lastResult = result;

    if (result.coordinates) {
      return result;
    }
    if (!GEOCODE_RETRYABLE_STATUSES.has(result.status)) {
      return result;
    }

    // Exponential-ish backoff helps with quota bursts / transient backend hiccups.
    const delayMs = Math.min(1200, 200 * attempt * attempt);
    await sleep(delayMs);
  }

  return lastResult || { status: 'UNKNOWN_ERROR', coordinates: null };
};

const ensureGoogleMapsLoaded = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps is only available in the browser');
  }

  if (window.__googleMapsLoaded || (window.google && window.google.maps)) {
    return;
  }

  if (window.__googleMapsScriptPromise) {
    await window.__googleMapsScriptPromise;
    return;
  }

  window.__googleMapsLoading = true;
  window.__googleMapsScriptPromise = (async () => {
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (!existingScript) {
      const response = await fetch('/api/google-maps-config');
      if (!response.ok) {
        throw new Error('Failed to fetch Google Maps config');
      }

      const data = await response.json();
      if (!data?.scriptUrl) {
        throw new Error('Google Maps config returned no script URL');
      }

      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = data.scriptUrl;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
      });
    } else if (!(window.google && window.google.maps)) {
      await new Promise((resolve, reject) => {
        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')), { once: true });
      });
    }

    window.__googleMapsLoaded = true;
  })();

  try {
    await window.__googleMapsScriptPromise;
  } finally {
    window.__googleMapsLoading = false;
  }
};

const resolveMapConstructor = async () => {
  for (let attempt = 0; attempt < MAP_CONSTRUCTOR_RETRY_ATTEMPTS; attempt += 1) {
    if (window.google && window.google.maps) {
      let MapConstructor = window.google.maps.Map;
      if (typeof MapConstructor !== 'function' && typeof window.google.maps.importLibrary === 'function') {
        try {
          const mapsLib = await window.google.maps.importLibrary('maps');
          MapConstructor = mapsLib?.Map;
        } catch (error) {
          // Retry below; Google loader can be briefly unavailable on first load.
        }
      }
      if (typeof MapConstructor === 'function') {
        return MapConstructor;
      }
    }

    await sleep(MAP_CONSTRUCTOR_RETRY_DELAY_MS);
  }

  throw new Error('Google Maps Map constructor unavailable');
};

const resolveGeocoderConstructor = async () => {
  if (!(window.google && window.google.maps)) {
    return null;
  }

  let GeocoderConstructor = window.google.maps.Geocoder;
  if (typeof GeocoderConstructor !== 'function' && typeof window.google.maps.importLibrary === 'function') {
    try {
      const geocodingLib = await window.google.maps.importLibrary('geocoding');
      GeocoderConstructor = geocodingLib?.Geocoder;
    } catch (error) {
      GeocoderConstructor = null;
    }
  }

  return typeof GeocoderConstructor === 'function' ? GeocoderConstructor : null;
};

function DashboardGoogleMapPanel({
  mapPoints,
  geocodeCache,
  setGeocodeCache,
  focusedPropertyId,
  shouldLoadMap,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const persistedCoordinateKeysRef = useRef(new Set());
  const initialFitDoneRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mappedCount, setMappedCount] = useState(0);
  const [geocodeSyncRetryTick, setGeocodeSyncRetryTick] = useState(0);
  const geocodeSyncRetryCountRef = useRef(0);
  const geocodeSyncRetryTimerRef = useRef(null);
  const renderedMarkerSignatureRef = useRef('');
  const lastFocusedPropertyIdRef = useRef(null);
  const activeInfoWindowPropertyIdRef = useRef(null);

  useEffect(() => {
    if (!shouldLoadMap || scriptReady) return;

    let cancelled = false;
    const loadScript = async () => {
      setIsLoadingMap(true);
      setMapError('');
      try {
        await ensureGoogleMapsLoaded();
        if (!cancelled) {
          setScriptReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setMapError(error?.message || 'Unable to load Google Maps');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMap(false);
        }
      }
    };

    loadScript();
    return () => {
      cancelled = true;
    };
  }, [shouldLoadMap, scriptReady]);

  useEffect(() => {
    if (!shouldLoadMap || !scriptReady || !mapContainerRef.current || mapRef.current) return;

    let cancelled = false;
    const initializeMap = async () => {
      try {
        const MapConstructor = await resolveMapConstructor();
        if (cancelled) return;

        mapRef.current = new MapConstructor(mapContainerRef.current, {
          center: AUSTRALIA_CENTER,
          zoom: 4,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          gestureHandling: 'greedy',
        });
        const GeocoderConstructor = await resolveGeocoderConstructor();
        if (!cancelled && GeocoderConstructor) {
          geocoderRef.current = new GeocoderConstructor();
        }
        if (!cancelled) {
          setMapReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setMapError('Unable to initialize Google Map. Please refresh and try again.');
        }
      }
    };

    initializeMap();
    return () => {
      cancelled = true;
    };
  }, [shouldLoadMap, scriptReady]);

  useEffect(() => {
    if (!shouldLoadMap || !scriptReady || !mapReady || !mapRef.current) return;

    let cancelled = false;
    const map = mapRef.current;
    const buildMarkerSignature = (points) =>
      points
        .map(point => `${point.propertyId}:${point.lat}:${point.lng}:${point.label || ''}`)
        .join('|');

    const clearMarkers = () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      activeInfoWindowPropertyIdRef.current = null;
      markersRef.current.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
      renderedMarkerSignatureRef.current = '';
    };

    const renderMarkers = (pointsToRender) => {
      const markerSignature = buildMarkerSignature(pointsToRender);
      const sameMarkerSet = markerSignature === renderedMarkerSignatureRef.current;
      const focusedPropertyChanged = focusedPropertyId !== lastFocusedPropertyIdRef.current;

      if (sameMarkerSet) {
        const latestPointById = new globalThis.Map(
          pointsToRender.map(point => [point.propertyId, point])
        );
        markersRef.current.forEach(entry => {
          entry.point = latestPointById.get(entry.propertyId) || entry.point;
        });

        if (focusedPropertyId && focusedPropertyChanged) {
          const focusedEntry = markersRef.current.find(entry => entry.propertyId === focusedPropertyId);
          focusedEntry?.focusMarker({ toggleIfAlreadyOpen: false });
        } else if (focusedPropertyId && infoWindowRef.current) {
          const focusedEntry = markersRef.current.find(entry => entry.propertyId === focusedPropertyId);
          if (focusedEntry?.point) {
            infoWindowRef.current.setContent(buildMarkerInfoHtml(focusedEntry.point));
          }
        }

        setMappedCount(pointsToRender.length);
        lastFocusedPropertyIdRef.current = focusedPropertyId;
        return;
      }

      clearMarkers();
      if (!pointsToRender.length) {
        map.setCenter(AUSTRALIA_CENTER);
        map.setZoom(4);
        setMappedCount(0);
        lastFocusedPropertyIdRef.current = focusedPropertyId;
        return;
      }

      pointsToRender.forEach(point => {
        const marker = new window.google.maps.Marker({
          map,
          position: { lat: point.lat, lng: point.lng },
          title: point.label,
        });
        const focusMarker = ({ toggleIfAlreadyOpen = false } = {}) => {
          const isSamePropertyOpen =
            activeInfoWindowPropertyIdRef.current === point.propertyId &&
            !!infoWindowRef.current;
          if (toggleIfAlreadyOpen && isSamePropertyOpen) {
            infoWindowRef.current.close();
            activeInfoWindowPropertyIdRef.current = null;
            return;
          }
          map.setCenter(marker.getPosition());
          map.setZoom(MARKER_FOCUS_ZOOM);
          if (!infoWindowRef.current) {
            infoWindowRef.current = new window.google.maps.InfoWindow({
              maxWidth: 360,
              headerDisabled: true,
            });
          }
          const currentPoint = markersRef.current.find(entry => entry.propertyId === point.propertyId)?.point || point;
          infoWindowRef.current.setContent(buildMarkerInfoHtml(currentPoint));
          infoWindowRef.current.open({ map, anchor: marker });
          activeInfoWindowPropertyIdRef.current = point.propertyId;
        };
        marker.addListener('click', () => focusMarker({ toggleIfAlreadyOpen: true }));
        markersRef.current.push({ propertyId: point.propertyId, marker, focusMarker, point });
      });

      if (focusedPropertyId) {
        const focusedEntry = markersRef.current.find(entry => entry.propertyId === focusedPropertyId);
        if (focusedEntry) {
          focusedEntry.focusMarker({ toggleIfAlreadyOpen: false });
          initialFitDoneRef.current = true;
        }
      } else if (!initialFitDoneRef.current) {
        const densestCluster = findDensestClusterPoints(pointsToRender);
        const pointsForView = densestCluster || pointsToRender;
        const bounds = new window.google.maps.LatLngBounds();
        pointsForView.forEach(point => bounds.extend({ lat: point.lat, lng: point.lng }));
        map.fitBounds(bounds, 72);
        initialFitDoneRef.current = true;
      }

      setMappedCount(pointsToRender.length);
      renderedMarkerSignatureRef.current = markerSignature;
      lastFocusedPropertyIdRef.current = focusedPropertyId;
    };

    const syncMarkers = async () => {
      setIsGeocoding(true);
      setMapError('');
      try {
        const scheduleSyncRetry = () => {
          if (geocodeSyncRetryCountRef.current >= GEOCODE_SYNC_MAX_RETRIES) {
            return;
          }
          geocodeSyncRetryCountRef.current += 1;
          if (geocodeSyncRetryTimerRef.current) {
            clearTimeout(geocodeSyncRetryTimerRef.current);
          }
          geocodeSyncRetryTimerRef.current = setTimeout(() => {
            setGeocodeSyncRetryTick(prev => prev + 1);
          }, GEOCODE_SYNC_RETRY_DELAY_MS);
        };

        const nextCacheValues = {};
        const pointsToRender = [];
        const pointsNeedingGeocode = [];
        let sawTransientGeocodeFailure = false;
        const coordinatesToPersist = [];

        for (const point of mapPoints) {
          if (cancelled) return;

          if (point.storedCoordinates) {
            pointsToRender.push({
              ...point,
              lat: point.storedCoordinates.lat,
              lng: point.storedCoordinates.lng,
            });
            continue;
          }

          const cached = geocodeCache[point.cacheKey];
          if (cached === null) {
            continue;
          }
          if (cached) {
            pointsToRender.push({
              ...point,
              lat: cached.lat,
              lng: cached.lng,
            });
            continue;
          }

          pointsNeedingGeocode.push(point);
        }

        let geocoder = geocoderRef.current;
        if (pointsNeedingGeocode.length > 0 && !geocoder) {
          const GeocoderConstructor = await resolveGeocoderConstructor();
          if (GeocoderConstructor) {
            geocoderRef.current = new GeocoderConstructor();
            geocoder = geocoderRef.current;
          }
        }

        if (!geocoder && pointsNeedingGeocode.length > 0) {
          if (!cancelled) {
            setMapError(pointsToRender.length > 0 ? '' : 'Map loaded, but geocoding is unavailable right now.');
            renderMarkers(pointsToRender);
            scheduleSyncRetry();
          }
          return;
        }

        for (const point of pointsNeedingGeocode) {
          if (cancelled) return;
          const geocoded = await geocodeAddressWithRetry(geocoder, point.queryAddress);
          if (geocoded.coordinates) {
            nextCacheValues[point.cacheKey] = geocoded.coordinates;
            pointsToRender.push({
              ...point,
              lat: geocoded.coordinates.lat,
              lng: geocoded.coordinates.lng,
            });
            if (
              point.propertyId &&
              !persistedCoordinateKeysRef.current.has(point.cacheKey)
            ) {
              coordinatesToPersist.push({
                propertyId: point.propertyId,
                cacheKey: point.cacheKey,
                latitude: geocoded.coordinates.lat,
                longitude: geocoded.coordinates.lng,
              });
            }
          } else if (GEOCODE_TERMINAL_FAILURE_STATUSES.has(geocoded.status)) {
            // Cache only permanent failures; transient failures should retry next sync.
            nextCacheValues[point.cacheKey] = null;
          } else {
            // Any non-terminal failure should trigger sync-level retry.
            // Some Google statuses are environment-specific and not always in our known list.
            sawTransientGeocodeFailure = true;
          }

          // Small gap between requests to reduce OVER_QUERY_LIMIT bursts.
          await sleep(GEOCODE_REQUEST_GAP_MS);
        }

        if (Object.keys(nextCacheValues).length > 0) {
          setGeocodeCache(prev => {
            let hasChanges = false;
            const next = { ...prev };
            Object.entries(nextCacheValues).forEach(([cacheKey, value]) => {
              const existing = prev[cacheKey];
              const changed =
                value === null
                  ? existing !== null
                  : !existing || existing.lat !== value.lat || existing.lng !== value.lng;
              if (changed) {
                next[cacheKey] = value;
                hasChanges = true;
              }
            });
            return hasChanges ? next : prev;
          });
        }

        if (coordinatesToPersist.length > 0) {
          for (const coordinate of coordinatesToPersist) {
            try {
              const response = await fetch('/api/supabase', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  action: 'updatePropertyCoordinates',
                  propertyId: coordinate.propertyId,
                  latitude: coordinate.latitude,
                  longitude: coordinate.longitude,
                }),
              });

              if (response.ok) {
                persistedCoordinateKeysRef.current.add(coordinate.cacheKey);
              }
            } catch {
              // Best-effort persistence; map should still work even if this fails.
            }
          }
        }

        if (!cancelled) {
          renderMarkers(pointsToRender);
          const shouldScheduleRetry =
            sawTransientGeocodeFailure &&
            mapPoints.length > 0 &&
            pointsToRender.length === 0 &&
            geocodeSyncRetryCountRef.current < GEOCODE_SYNC_MAX_RETRIES;

          if (shouldScheduleRetry) {
            scheduleSyncRetry();
          } else {
            geocodeSyncRetryCountRef.current = 0;
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMapError('Unable to map these properties right now.');
          renderMarkers([]);
        }
      } finally {
        if (!cancelled) {
          setIsGeocoding(false);
        }
      }
    };

    syncMarkers();
    return () => {
      cancelled = true;
      if (geocodeSyncRetryTimerRef.current) {
        clearTimeout(geocodeSyncRetryTimerRef.current);
      }
    };
  }, [focusedPropertyId, geocodeSyncRetryTick, mapPoints, geocodeCache, mapReady, scriptReady, setGeocodeCache, shouldLoadMap]);

  useEffect(() => {
    return () => {
      if (geocodeSyncRetryTimerRef.current) {
        clearTimeout(geocodeSyncRetryTimerRef.current);
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      activeInfoWindowPropertyIdRef.current = null;
      markersRef.current.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  const showNoResults = !isLoadingMap && !isGeocoding && !mapError && mapPoints.length > 0 && mappedCount === 0;
  const showNoAddresses = !isLoadingMap && !isGeocoding && !mapError && mapPoints.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative flex min-h-0 flex-1 bg-[radial-gradient(ellipse_at_top,rgba(67,151,117,0.08),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(229,148,115,0.08),transparent_55%),rgba(245,247,249,0.7)]">
        <div ref={mapContainerRef} className="absolute inset-0" />

        {(isLoadingMap || isGeocoding) && (
          <div className="aurora-loading-overlay pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-gray-600">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isLoadingMap ? 'Loading map...' : 'Mapping property addresses...'}
            </span>
          </div>
        )}

        {mapError && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-error">
            {mapError}
          </div>
        )}

        {showNoAddresses && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-gray-500">
            No saved property addresses yet.
          </div>
        )}

        {showNoResults && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-gray-500">
            We could not place markers from the current addresses.
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardContent({
  userEmail,
  userName,
  profilePictureUrl,
  handleLogout,
}) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteCount, setBulkDeleteCount] = useState(0);
  const [sortOption, setSortOption] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search by property address...');
  const [selectedProperties, setSelectedProperties] = useState(new Set());
  const [openCardMenuId, setOpenCardMenuId] = useState(null);
  const openCardMenuRef = useRef(null);
  const [isMapHiddenDesktop, setIsMapHiddenDesktop] = useState(false);
  const [isDesktopMapExiting, setIsDesktopMapExiting] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState(null);
  const [mobileViewMode, setMobileViewMode] = useState('list');
  const [geocodeCache, setGeocodeCache] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = sessionStorage.getItem(GEOCODE_CACHE_SESSION_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const [propertyPhotoCache, setPropertyPhotoCache] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = sessionStorage.getItem(PHOTO_CACHE_SESSION_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const [imageLoadedByPropertyId, setImageLoadedByPropertyId] = useState({});
  const photoInflightRef = useRef(new Map());
  const photoAttemptedKeysRef = useRef(new Set());
  const placesServiceRef = useRef(null);
  const geocoderForPhotosRef = useRef(null);
  const persistedPhotoKeysRef = useRef(new Set());
  const googleApiKeyRef = useRef('');
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const resetForm = useFormStore(state => state.resetForm);

  useEffect(() => {
    loadSurveys();
  }, [user?.id]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () =>
      setSearchPlaceholder(mq.matches ? 'Search address' : 'Search by property address...');
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(GEOCODE_CACHE_SESSION_KEY, JSON.stringify(geocodeCache));
    } catch {
      // Ignore storage quota / privacy mode errors.
    }
  }, [geocodeCache]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(PHOTO_CACHE_SESSION_KEY, JSON.stringify(propertyPhotoCache));
    } catch {
      // Ignore storage quota / privacy mode errors.
    }
  }, [propertyPhotoCache]);

  useEffect(() => {
    if (openCardMenuId == null) return;

    const handlePointerDown = (event) => {
      if (openCardMenuRef.current && !openCardMenuRef.current.contains(event.target)) {
        setOpenCardMenuId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [openCardMenuId]);

  const loadSurveys = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'loadUserProperties',
          userId: user.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const merged = (result.data || []).map((survey) => {
          const cacheKey = getPhotoCacheKey(survey);
          const cached = propertyPhotoCache[cacheKey];
          if (survey.photo_url) {
            return survey;
          }
          if (!cached?.photoUrl) {
            return survey;
          }
          return {
            ...survey,
            photo_url: cached.photoUrl,
            photo_source: cached.photoSource || survey.photo_source || null,
          };
        });
        setSurveys(merged);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || surveys.length === 0) return;

    let cancelled = false;

    const ensurePhotoServices = async () => {
      await ensureGoogleMapsLoaded();
      if (!(window.google && window.google.maps)) return false;

      if (!placesServiceRef.current) {
        try {
          if (typeof window.google.maps.importLibrary === 'function') {
            await window.google.maps.importLibrary('places');
          }
        } catch {
          // Fall through; constructor may still exist on window.google.maps.places
        }
        if (window.google?.maps?.places?.PlacesService) {
          placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        }
      }

      if (!geocoderForPhotosRef.current) {
        const GeocoderConstructor = await resolveGeocoderConstructor();
        if (GeocoderConstructor) {
          geocoderForPhotosRef.current = new GeocoderConstructor();
        }
      }

      if (!googleApiKeyRef.current) {
        try {
          const response = await fetch('/api/google-maps-config');
          if (response.ok) {
            const data = await response.json();
            googleApiKeyRef.current = extractGoogleApiKeyFromScriptUrl(data?.scriptUrl || '');
          }
        } catch {
          // Street view fallback may be skipped if we can't resolve a key.
        }
      }

      return true;
    };

    const resolveAndPersistPhoto = async (survey) => {
      const cacheKey = getPhotoCacheKey(survey);
      const existingUrl = survey.photo_url;
      const isPlaceholderUrl = (url) => url === PROPWIZ_BRANDED_PLACEHOLDER_URL;
      const isSvgPlaceholderDataUrl = (url) =>
        typeof url === 'string' && url.startsWith('data:image/svg+xml');
      const isAnyDataImageUrl = (url) =>
        typeof url === 'string' && url.startsWith('data:image');
      const persistPhotoUrl = async ({ photoUrl, photoSource }) => {
        if (
          !photoUrl ||
          isPlaceholderUrl(photoUrl) ||
          isAnyDataImageUrl(photoUrl) ||
          persistedPhotoKeysRef.current.has(cacheKey)
        ) {
          return;
        }
        try {
          const response = await fetch('/api/supabase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'updatePropertyPhoto',
              propertyId: survey.id,
              photoUrl,
              photoSource: photoSource || null,
            }),
          });
          if (response.ok) {
            persistedPhotoKeysRef.current.add(cacheKey);
          }
        } catch {
          // Best-effort persistence only.
        }
      };

      if (existingUrl && !isSvgPlaceholderDataUrl(existingUrl)) {
        const source = survey.photo_source || 'persisted';
        setPropertyPhotoCache((prev) => {
          if (prev[cacheKey]?.photoUrl === existingUrl && prev[cacheKey]?.photoSource === source) {
            return prev;
          }
          return {
            ...prev,
            [cacheKey]: { photoUrl: existingUrl, photoSource: source },
          };
        });
        if (!survey.photo_updated_at) {
          await persistPhotoUrl({ photoUrl: existingUrl, photoSource: source });
        }
        return;
      }

      // If we already attempted this record in the current session and only had
      // placeholder data, avoid re-running on every render. It will retry next login.
      if (photoAttemptedKeysRef.current.has(cacheKey)) {
        return;
      }

      const cached = propertyPhotoCache[cacheKey];
      if (cached?.photoUrl) {
        setSurveys((prev) => {
          let changed = false;
          const next = prev.map((item) => {
            if (item.id !== survey.id) return item;
            const nextSource = cached.photoSource || item.photo_source || null;
            if (item.photo_url === cached.photoUrl && item.photo_source === nextSource) {
              return item;
            }
            changed = true;
            return { ...item, photo_url: cached.photoUrl, photo_source: nextSource };
          });
          return changed ? next : prev;
        });
        await persistPhotoUrl({
          photoUrl: cached.photoUrl,
          photoSource: cached.photoSource || 'cached',
        });
        return;
      }

      if (photoInflightRef.current.has(cacheKey)) {
        await photoInflightRef.current.get(cacheKey);
        return;
      }

      const task = (async () => {
        let finalUrl = null;
        let finalSource = null;
        let derivedCoordinates =
          survey.latitude != null && survey.longitude != null
            ? { lat: Number(survey.latitude), lng: Number(survey.longitude) }
            : null;

        const ready = await ensurePhotoServices();
        if (!ready || cancelled) return;

        const address = buildSurveyAddress(survey);
        let resolvedPlaceId = survey.place_id || survey.google_place_id || null;

        if (!resolvedPlaceId && geocoderForPhotosRef.current && address) {
          const geocoded = await geocodeAddressWithRetry(geocoderForPhotosRef.current, address);
          if (geocoded?.coordinates && !derivedCoordinates) {
            derivedCoordinates = geocoded.coordinates;
          }
          resolvedPlaceId = geocoded?.placeId || null;
        }

        if (resolvedPlaceId && placesServiceRef.current) {
          finalUrl = await getPropertyPhotoUrl(resolvedPlaceId, placesServiceRef.current);
          if (finalUrl) {
            finalSource = 'place_photo';
          }
        }

        const hasValidDerivedCoordinates =
          derivedCoordinates &&
          Number.isFinite(Number(derivedCoordinates.lat)) &&
          Number.isFinite(Number(derivedCoordinates.lng));

        if (!finalUrl) {
          let metadataStatus = 'INVALID_REQUEST';
          if (address) {
            metadataStatus = await getStreetViewMetadataStatus({
              location: address,
              apiKey: googleApiKeyRef.current,
            });
          }

          if (metadataStatus !== 'OK' && hasValidDerivedCoordinates) {
            metadataStatus = await getStreetViewMetadataStatus({
              lat: derivedCoordinates.lat,
              lng: derivedCoordinates.lng,
              apiKey: googleApiKeyRef.current,
            });
          }

          if (metadataStatus === 'OK' && hasValidDerivedCoordinates) {
            const streetViewUrl = getStreetViewPhotoUrl({
              lat: derivedCoordinates.lat,
              lng: derivedCoordinates.lng,
              apiKey: googleApiKeyRef.current,
            });
            if (streetViewUrl) {
              finalUrl = streetViewUrl;
              finalSource = 'street_view';
            }
          }
        }

        if (!finalUrl) {
          finalUrl = PROPWIZ_BRANDED_PLACEHOLDER_URL;
          finalSource = 'placeholder';
        }

        if (cancelled) return;

        setPropertyPhotoCache((prev) => {
          const current = prev[cacheKey];
          if (current?.photoUrl === finalUrl && current?.photoSource === finalSource) {
            return prev;
          }
          return {
            ...prev,
            [cacheKey]: { photoUrl: finalUrl, photoSource: finalSource },
          };
        });

        setSurveys((prev) => {
          let changed = false;
          const next = prev.map((item) => {
            if (item.id !== survey.id) return item;
            if (item.photo_url === finalUrl && item.photo_source === finalSource) {
              return item;
            }
            changed = true;
            return { ...item, photo_url: finalUrl, photo_source: finalSource };
          });
          return changed ? next : prev;
        });

        await persistPhotoUrl({ photoUrl: finalUrl, photoSource: finalSource });
        if (finalSource === 'placeholder') {
          photoAttemptedKeysRef.current.add(cacheKey);
        }
      })();

      photoInflightRef.current.set(cacheKey, task);
      try {
        await task;
      } finally {
        photoInflightRef.current.delete(cacheKey);
      }
    };

    const resolvePhotosForVisibleSurveys = async () => {
      for (const survey of surveys) {
        if (cancelled) return;
        await resolveAndPersistPhoto(survey);
        await sleep(PHOTO_REQUEST_GAP_MS);
      }
    };

    resolvePhotosForVisibleSurveys();

    return () => {
      cancelled = true;
    };
  }, [user, surveys, propertyPhotoCache]);

  const handleResume = (propertyId) => {
    // Store property ID in sessionStorage to resume
    sessionStorage.setItem('resumePropertyId', propertyId);
    router.push('/calculator?resume=true');
  };

  const handleDeleteClick = (propertyId, e) => {
    e.stopPropagation();
    setPropertyToDelete(propertyId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;

    setDeletingId(propertyToDelete);
    setShowDeleteModal(false);
    
    try {
      // Update user_saved to false instead of deleting
      const { error } = await supabase
        .from('properties')
        .update({ user_saved: false })
        .eq('id', propertyToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state (it won't show on dashboard anymore)
      setSurveys(surveys.filter(s => s.id !== propertyToDelete));
    } catch (error) {
      console.error('Error updating survey:', error);
      alert('Failed to update survey. Please try again.');
    } finally {
      setDeletingId(null);
      setPropertyToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPropertyToDelete(null);
  };

  const handleToggleInspected = async (propertyId, currentInspected) => {
    if (!user) return;
    
    const newInspectedStatus = !currentInspected;
    
    // Optimistically update UI immediately
    setSurveys(prevSurveys => 
      prevSurveys.map(survey => 
        survey.id === propertyId 
          ? { ...survey, inspected: newInspectedStatus }
          : survey
      )
    );

    // Update database in the background
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatePropertyInspected',
          propertyId: propertyId,
          inspected: newInspectedStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to update inspected status');
      }
    } catch (error) {
      console.error('Error updating inspected status:', error);
      // Revert the optimistic update on error
      setSurveys(prevSurveys => 
        prevSurveys.map(survey => 
          survey.id === propertyId 
            ? { ...survey, inspected: currentInspected }
            : survey
        )
      );
      alert('Failed to update inspected status. Please try again.');
    }
  };

  const handleCheckboxChange = (propertyId, isChecked) => {
    setSelectedProperties(prev => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(propertyId);
      } else {
        next.delete(propertyId);
      }
      // Close sort menu when selecting properties
      if (isChecked && showSortMenu) {
        setShowSortMenu(false);
      }
      return next;
    });
  };

  // Select all / unselect all based on current visible (sorted) list
  const handleSelectAllChange = (visibleIds) => {
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedProperties.has(id));
    if (allSelected) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(visibleIds));
    }
  };

  const handleBulkDelete = () => {
    if (selectedProperties.size === 0 || !user) return;
    
    // Show confirmation modal
    setBulkDeleteCount(selectedProperties.size);
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedProperties.size === 0 || !user) return;
    
    // Close modal
    setShowBulkDeleteModal(false);
    
    const propertyIds = Array.from(selectedProperties);
    
    // Store deleted surveys for rollback
    const deletedSurveys = surveys.filter(survey => selectedProperties.has(survey.id));
    
    // Optimistically remove from UI immediately
    setSurveys(prevSurveys => 
      prevSurveys.filter(survey => !selectedProperties.has(survey.id))
    );
    
    // Clear selection immediately for instant feedback
    setSelectedProperties(new Set());
    
    // Update database in the background
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulkDeleteProperties',
          propertyIds: propertyIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to delete properties');
      }
    } catch (error) {
      console.error('Error deleting properties:', error);
      // Restore deleted surveys on error
      setSurveys(prevSurveys => [...prevSurveys, ...deletedSurveys]);
      alert('Failed to delete properties. Please try again.');
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false);
    setBulkDeleteCount(0);
  };

  const handleBulkInspected = async () => {
    if (selectedProperties.size === 0 || !user) return;
    
    const propertyIds = Array.from(selectedProperties);
    
    // Store original inspected status for rollback
    const originalInspectedStatus = new globalThis.Map();
    surveys.forEach(survey => {
      if (selectedProperties.has(survey.id)) {
        originalInspectedStatus.set(survey.id, survey.inspected || false);
      }
    });
    
    // Store selected properties for rollback (needed for error handling)
    const selectedPropsForRollback = new Set(selectedProperties);
    
    // Optimistically update UI immediately
    setSurveys(prevSurveys => 
      prevSurveys.map(survey => 
        selectedProperties.has(survey.id)
          ? { ...survey, inspected: true }
          : survey
      )
    );
    
    // Clear selection immediately for instant feedback
    setSelectedProperties(new Set());

    // Update database in the background
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulkUpdateInspected',
          propertyIds: propertyIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to update inspected status');
      }
    } catch (error) {
      console.error('Error updating inspected status:', error);
      // Revert the optimistic update on error
      setSurveys(prevSurveys => 
        prevSurveys.map(survey => 
          selectedPropsForRollback.has(survey.id)
            ? { ...survey, inspected: originalInspectedStatus.get(survey.id) || false }
            : survey
        )
      );
      alert('Failed to update inspected status. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCompletionStatus = (survey) => {
    if (survey.completion_status === 'complete') {
      return { text: 'Survey Complete', color: 'text-success', bg: 'bg-success/10' };
    }
    const percentage = survey.completion_percentage || 0;
    return {
      text: `Survey ${percentage}% Complete`,
      color: 'text-warning',
      bg: 'bg-warning/10',
    };
  };

  const sortSurveys = (surveysToSort, sortBy) => {
    const sorted = [...surveysToSort];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
      case 'address-az':
        return sorted.sort((a, b) => {
          const addressA = (a.property_address || '').toLowerCase();
          const addressB = (b.property_address || '').toLowerCase();
          return addressA.localeCompare(addressB);
        });
      case 'state':
        return sorted.sort((a, b) => {
          const stateA = (a.selected_state || '').toLowerCase();
          const stateB = (b.selected_state || '').toLowerCase();
          return stateA.localeCompare(stateB);
        });
      case 'completion-asc':
        return sorted.sort((a, b) => {
          const percentA = a.completion_percentage || 0;
          const percentB = b.completion_percentage || 0;
          // Handle completed surveys - put them at the end
          if (a.completion_status === 'complete' && b.completion_status !== 'complete') return 1;
          if (b.completion_status === 'complete' && a.completion_status !== 'complete') return -1;
          if (a.completion_status === 'complete' && b.completion_status === 'complete') return 0;
          return percentA - percentB;
        });
      case 'completion-desc':
        return sorted.sort((a, b) => {
          const percentA = a.completion_percentage || 0;
          const percentB = b.completion_percentage || 0;
          // Handle completed surveys - put them at the beginning
          if (a.completion_status === 'complete' && b.completion_status !== 'complete') return -1;
          if (b.completion_status === 'complete' && a.completion_status !== 'complete') return 1;
          if (a.completion_status === 'complete' && b.completion_status === 'complete') return 0;
          return percentB - percentA;
        });
      default:
        return sorted;
    }
  };

  // Filter surveys based on search query
  const filteredSurveys = surveys.filter(survey => {
    if (!searchQuery.trim()) return true;
    const address = (survey.property_address || '').toLowerCase();
    const state = (survey.selected_state || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return address.includes(query) || state.includes(query);
  });

  // Sort the filtered surveys
  const sortedSurveys = sortSurveys(filteredSurveys, sortOption);
  const mapPoints = useMemo(() => {
    return sortedSurveys
      .map((survey, index) => {
        const queryAddress = buildSurveyAddress(survey);
        if (!queryAddress) return null;
        return {
          propertyId: survey.id,
          cacheKey: createMapCacheKey(survey.id, queryAddress),
          queryAddress,
          label: survey.property_address || `Survey ${index + 1}`,
          storedCoordinates:
            survey.latitude != null && survey.longitude != null
              ? {
                  lat: Number(survey.latitude),
                  lng: Number(survey.longitude),
                }
              : null,
          address: survey.property_address || '',
          state: survey.selected_state || '',
          photoUrl: survey.photo_url || '',
          price: survey.property_price,
          completionStatus: survey.completion_status,
          completionPercentage: survey.completion_percentage,
          updatedAt: survey.updated_at,
          inspected: !!survey.inspected,
        };
      })
      .filter(Boolean);
  }, [sortedSurveys]);
  const isDesktopMapVisible = !isMapHiddenDesktop || isDesktopMapExiting;

  const handleDesktopMapToggle = () => {
    if (isDesktopMapExiting) return;
    if (isMapHiddenDesktop) {
      setIsMapHiddenDesktop(false);
      return;
    }
    setIsDesktopMapExiting(true);
  };

  const surveyCards = sortedSurveys.map((survey, index) => {
    const status = getCompletionStatus(survey);
    const isComplete = survey.completion_status === 'complete';
    const cardPhotoUrl = survey.photo_url || PROPWIZ_BRANDED_PLACEHOLDER_URL;
    const isPhotoLoaded = !!imageLoadedByPropertyId[survey.id] || cardPhotoUrl.startsWith('data:image/');

    const handleCardClick = () => {
      setFocusedPropertyId(survey.id);
      setIsMapHiddenDesktop(false);
    };

    return (
      <motion.div
        key={survey.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24), ease: 'easeOut' }}
        onClick={handleCardClick}
        className="h-full min-h-[230px] cursor-pointer rounded-2xl border border-secondary p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl lg:p-5 xl:p-6"
      >
        <div className="relative -mx-4 -mt-4 mb-4 aspect-[16/9] w-[calc(100%+2rem)] overflow-hidden rounded-t-2xl bg-base-100 lg:-mx-5 lg:-mt-5 lg:w-[calc(100%+2.5rem)] xl:-mx-6 xl:-mt-6 xl:w-[calc(100%+3rem)]">
          {!isPhotoLoaded && (
            <div className="absolute inset-0 animate-pulse bg-base-300/60" aria-hidden />
          )}
          <Image
            src={cardPhotoUrl}
            alt={survey.property_address ? `Property preview for ${survey.property_address}` : 'Property preview'}
            fill
            className={`object-cover transition-opacity duration-300 ${isPhotoLoaded ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 42vw, 28vw"
            onError={() => {
              const currentPhotoSource = survey.photo_source || null;
              setSurveys((prev) =>
                prev.map((item) =>
                  item.id === survey.id
                    ? {
                        ...item,
                        photo_url: PROPWIZ_BRANDED_PLACEHOLDER_URL,
                        photo_source: 'placeholder',
                      }
                    : item
                )
              );
              setPropertyPhotoCache((prev) => ({
                ...prev,
                [getPhotoCacheKey(survey)]: {
                  photoUrl: PROPWIZ_BRANDED_PLACEHOLDER_URL,
                  photoSource: 'placeholder',
                },
              }));
              setImageLoadedByPropertyId((prev) => ({ ...prev, [survey.id]: true }));
              if (currentPhotoSource === 'persisted') {
                // Keep DB value untouched; local placeholder avoids broken UI.
              }
            }}
            onLoad={() =>
              setImageLoadedByPropertyId((prev) => {
                if (prev[survey.id]) return prev;
                return { ...prev, [survey.id]: true };
              })
            }
          />
          <span
            className={`absolute bottom-3 left-3 inline-flex shrink-0 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap shadow-sm backdrop-blur-[1px] ${status.color}`}
          >
            {status.text}
          </span>
          <div className="absolute right-3 top-3 z-10">
            <input
              type="checkbox"
              checked={selectedProperties.has(survey.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleCardClick();
                handleCheckboxChange(survey.id, e.target.checked);
              }}
              className="h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 bg-white/95 text-primary shadow-sm focus:outline-none focus:ring-0 focus:ring-offset-0"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select survey ${survey.property_address || index + 1}`}
            />
          </div>
        </div>
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-4 sm:grid-rows-[auto_1fr] sm:gap-x-4 sm:gap-y-2">
          <div className="col-span-2 row-start-1 min-w-0 self-start sm:col-span-1 sm:col-start-1">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-semibold leading-snug text-gray-900 sm:text-[18px] sm:leading-normal">
                {(() => {
                  if (!survey.property_address) return `Survey ${index + 1}`;
                  const { primary, secondary } = splitPropertyAddress(
                    survey.property_address,
                    survey.selected_state || ''
                  );
                  return (
                    <>
                      <span className="block truncate" title={primary}>
                        {primary}
                      </span>
                      {secondary && <span className="block truncate">{secondary}</span>}
                    </>
                  );
                })()}
              </h3>
              <div
                ref={openCardMenuId === survey.id ? openCardMenuRef : null}
                className="relative -mr-1 shrink-0 sm:-mr-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenCardMenuId(prev => (prev === survey.id ? null : survey.id));
                  }}
                  className="flex h-9 w-9 list-none cursor-pointer items-center justify-center rounded-full bg-base-200 text-gray-700 transition-colors hover:bg-base-300"
                  aria-label={`Open actions menu for ${survey.property_address || index + 1}`}
                >
                  <MoreHorizontal className="h-6 w-6" aria-hidden />
                </button>
                {openCardMenuId === survey.id && (
                    <div className="absolute right-0 z-20 mt-2 min-w-[9rem] rounded-xl border border-base-300 bg-white p-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResume(survey.id);
                      setOpenCardMenuId(null);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-base-200"
                  >
                    {isComplete ? <Eye className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                    {isComplete ? 'View' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick();
                      handleDeleteClick(survey.id, e);
                      setOpenCardMenuId(null);
                    }}
                    disabled={deletingId === survey.id}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                  >
                    {deletingId === survey.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </button>
                    </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-1 sm:row-start-2">
            <div className="text-[15px] text-gray-600 space-y-1.5">
              <p>
                Property Price:{' '}
                {survey.property_price != null && survey.property_price !== ''
                  ? `$${Number(survey.property_price).toLocaleString()}`
                  : 'TBD'}
              </p>
              <p>Last updated: {formatDate(survey.updated_at)}</p>
              <div className="mt-2 hidden items-center gap-2 sm:flex">
                <span className="text-sm text-gray-600">Inspected:</span>
                <SurveyInspectedToggle
                  inspected={!!survey.inspected}
                  compact={false}
                  onToggle={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                    handleToggleInspected(survey.id, survey.inspected || false);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="col-span-2 row-start-3 justify-self-stretch sm:col-span-1 sm:col-start-2 sm:row-start-2 sm:flex sm:h-full sm:min-h-0 sm:justify-self-end sm:self-stretch sm:items-end">
            <div className="flex w-full min-w-0 flex-nowrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:hidden">
                <span className="shrink-0 text-[13px] font-medium text-gray-600">
                  Inspected:
                </span>
                <SurveyInspectedToggle
                  inspected={!!survey.inspected}
                  compact
                  onToggle={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                    handleToggleInspected(survey.id, survey.inspected || false);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  });

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <main className="flex flex-1 flex-col">
        {/* Hero Section */}
        <section className="mx-auto w-full max-w-[1920px] shrink-0 bg-accent px-4 py-5 md:px-6 lg:px-8 lg:py-6">
          <div className="w-full text-left">
            <div className="flex items-center gap-4 md:gap-5">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="shrink-0"
              >
                {/* Fixed sizes (not h-full/w-auto): large photo intrinsic width was blowing up aspect-square */}
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary ring-2 ring-base-100/20 sm:h-[4.25rem] sm:w-[4.25rem] md:h-20 md:w-20 lg:h-[5.25rem] lg:w-[5.25rem]">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt={
                        userName || userEmail
                          ? `Profile photo of ${userName || userEmail}`
                          : 'Profile photo'
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-[40%] w-[40%]" aria-hidden />
                  )}
                </div>
              </motion.div>
              <div className="min-w-0 flex flex-col justify-center">
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                  className="mb-1 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl"
                >
                  Dashboard
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  className="mb-0 text-base text-white md:text-lg lg:text-xl"
                >
                  Welcome back, {userName || userEmail}
                </motion.p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Content — aurora wash (fills space down to footer; avoids flat white band) */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="dashboard-aurora-bg" aria-hidden="true">
            <span className="dashboard-aurora-blob dashboard-aurora-blob--1" />
            <span className="dashboard-aurora-blob dashboard-aurora-blob--2" />
            <span className="dashboard-aurora-blob dashboard-aurora-blob--3" />
            <span className="dashboard-aurora-blob dashboard-aurora-blob--bottom" />
          </div>
        <section className="relative z-10 mx-auto w-full max-w-[1920px] px-4 py-6 pb-24 md:px-6 lg:px-8 lg:py-8">
          <div className="w-full space-y-5">
            {/* Saved Surveys */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="bg-transparent p-0"
            >
              <div
                className={`mb-5 flex flex-wrap items-center justify-between gap-2.5 ${
                  isDesktopMapVisible ? 'lg:max-w-[66.6667%] lg:pr-3 xl:pr-4' : 'lg:max-w-full'
                } w-full transition-[max-width] duration-300 ease-in-out`}
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">Saved Surveys</h2>
                  <Link
                    href="/calculator"
                    onClick={() => {
                      resetSessionAndForm(resetForm);
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('resumePropertyId');
                      }
                    }}
                    className="hidden items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-secondary transition-all duration-200 hover:bg-primary-focus hover:shadow-lg md:inline-flex"
                  >
                    <FileText className="h-4 w-4" />
                    Start New Survey
                  </Link>
                </div>
                <div className="inline-flex items-center rounded-full border border-base-300 bg-white p-1 shadow-sm lg:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileViewMode('list')}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                      mobileViewMode === 'list'
                        ? 'bg-primary text-secondary shadow-sm'
                        : 'text-gray-700 hover:bg-base-200'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileViewMode('map')}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                      mobileViewMode === 'map'
                        ? 'bg-primary text-secondary shadow-sm'
                        : 'text-gray-700 hover:bg-base-200'
                    }`}
                  >
                    <MapIcon className="h-4 w-4" />
                    Map
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDesktopMapToggle}
                  className="hidden cursor-pointer items-center gap-2 rounded-full border border-base-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-base-200 lg:inline-flex"
                >
                  <MapIcon className="h-4 w-4" />
                  {isMapHiddenDesktop ? 'Show map' : 'Hide map'}
                </button>
              </div>
              <Link
                href="/calculator"
                onClick={() => {
                  resetSessionAndForm(resetForm);
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('resumePropertyId');
                  }
                }}
                className="mb-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-secondary transition-all duration-200 hover:bg-primary-focus hover:shadow-lg md:hidden"
              >
                <FileText className="h-4 w-4" />
                Start New Survey
              </Link>
              
              {/* Container with fixed height to prevent layout shift */}
              <div
                className={`relative mb-6 h-10 ${
                  isDesktopMapVisible ? 'lg:max-w-[66.6667%] lg:pr-3 xl:pr-4' : 'lg:max-w-full'
                } w-full ${showSortMenu ? 'overflow-visible' : 'overflow-hidden'} transition-[max-width] duration-300 ease-in-out`}
              >
                {/* Select-all checkbox - fixed position, not part of sliding animation */}
                {sortedSurveys.length > 0 && (
                  <label className="absolute right-4 top-0 bottom-0 flex items-center z-10 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={sortedSurveys.every(s => selectedProperties.has(s.id))}
                      onChange={() => handleSelectAllChange(sortedSurveys.map(s => s.id))}
                      className="w-5 h-5 cursor-pointer text-primary border-gray-300 rounded focus:ring-0 focus:ring-offset-0 focus:outline-none"
                      aria-label="Select or unselect all properties"
                    />
                  </label>
                )}
                {/* Search and Sort Bar - Hidden when properties are selected */}
                <AnimatePresence mode="wait">
                  {selectedProperties.size === 0 && (
                    <motion.div
                      key="search-bar"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center gap-3"
                    >
                      <div className="relative flex-1 h-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder={searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="relative mr-14">
                        <button
                          onClick={() => setShowSortMenu(!showSortMenu)}
                          className="flex cursor-pointer items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          aria-label="Sort surveys"
                        >
                          <ArrowUpDown className="w-5 h-5 text-gray-600" />
                        </button>
                        {/* Sort Dropdown Menu */}
                        <AnimatePresence>
                          {showSortMenu && (
                            <>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowSortMenu(false)}
                                className="fixed inset-0 z-10"
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20"
                              >
                                <button
                                  onClick={() => { setSortOption('newest'); setShowSortMenu(false); }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                    sortOption === 'newest' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  Newest First
                                </button>
                                <button
                                  onClick={() => { setSortOption('oldest'); setShowSortMenu(false); }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                    sortOption === 'oldest' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  Oldest First
                                </button>
                                <button
                                  onClick={() => { setSortOption('address-az'); setShowSortMenu(false); }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                    sortOption === 'address-az' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  Address (A-Z)
                                </button>
                                <button
                                  onClick={() => { setSortOption('state'); setShowSortMenu(false); }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                    sortOption === 'state' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  By State
                                </button>
                                <button
                                  onClick={() => { setSortOption('completion-asc'); setShowSortMenu(false); }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                    sortOption === 'completion-asc' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  Completion % (Low to High)
                                </button>
                                <button
                                  onClick={() => { setSortOption('completion-desc'); setShowSortMenu(false); }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                    sortOption === 'completion-desc' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  Completion % (High to Low)
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bulk Action Buttons - Shown when properties are selected */}
                <AnimatePresence mode="wait">
                  {selectedProperties.size > 0 && (
                    <motion.div
                      key="bulk-actions"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center gap-3 pr-14"
                    >
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        aria-label={`Delete ${selectedProperties.size} ${selectedProperties.size === 1 ? 'property' : 'properties'}`}
                        className="flex h-10 min-h-10 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0 rounded-lg bg-error px-2 py-0.5 text-center text-[13px] font-medium leading-tight text-white transition-colors hover:bg-error/90 sm:h-auto sm:min-h-0 sm:flex-initial sm:flex-row sm:gap-2 sm:px-6 sm:py-2 sm:text-base sm:leading-normal"
                      >
                        <Trash2 className="hidden h-5 w-5 shrink-0 sm:block" />
                        <span className="flex flex-col sm:hidden">
                          <span>Delete</span>
                          <span>
                            {selectedProperties.size}{' '}
                            {selectedProperties.size === 1 ? 'property' : 'properties'}
                          </span>
                        </span>
                        <span className="hidden sm:inline">
                          Delete {selectedProperties.size}{' '}
                          {selectedProperties.size === 1 ? 'property' : 'properties'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkInspected}
                        aria-label={`Mark ${selectedProperties.size} ${selectedProperties.size === 1 ? 'property' : 'properties'} as inspected`}
                        className="flex h-10 min-h-10 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0 rounded-lg bg-primary px-2 py-0.5 text-center text-[13px] font-medium leading-tight text-secondary transition-colors hover:bg-primary-focus sm:h-auto sm:min-h-0 sm:w-auto sm:flex-initial sm:flex-row sm:gap-2 sm:px-6 sm:py-2 sm:text-base sm:leading-normal"
                      >
                        <span className="flex flex-col sm:hidden">
                          <span>Inspect</span>
                          <span>
                            {selectedProperties.size}{' '}
                            {selectedProperties.size === 1 ? 'property' : 'properties'}
                          </span>
                        </span>
                        <Eye className="hidden h-5 w-5 shrink-0 sm:block" aria-hidden />
                        <span className="hidden sm:inline sm:text-base">
                          Inspected {selectedProperties.size}{' '}
                          {selectedProperties.size === 1 ? 'property' : 'properties'}
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : surveys.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No saved surveys yet.</p>
                  <p className="text-sm text-gray-500">
                    Start a new survey and save it to see it here.
                  </p>
                </div>
              ) : sortedSurveys.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Oops, we can&apos;t find any surveys matching your search.</p>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search terms or clear the search to see all surveys.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:grid lg:grid-cols-12 lg:gap-3 xl:gap-4">
                    <div className={isDesktopMapVisible ? 'lg:col-span-8' : 'lg:col-span-12'}>
                      <div className={`grid gap-3 xl:gap-4 ${isDesktopMapVisible ? 'lg:grid-cols-2 2xl:grid-cols-3' : 'lg:grid-cols-3 2xl:grid-cols-4'}`}>
                        {surveyCards}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isDesktopMapVisible && (
                        <motion.div
                          key="desktop-map-panel"
                          initial={{ opacity: 0, x: 120, y: 0 }}
                          animate={isDesktopMapExiting ? { opacity: 0, x: 120, y: 0 } : { opacity: 1, x: 0, y: 0 }}
                          exit={{ opacity: 0, x: 120, y: 0 }}
                          transition={{ duration: 0.32, ease: 'easeInOut', type: 'tween' }}
                          onAnimationComplete={() => {
                            if (isDesktopMapExiting) {
                              setIsDesktopMapExiting(false);
                              setIsMapHiddenDesktop(true);
                            }
                          }}
                          className="lg:col-span-4 lg:-mt-[7.75rem] lg:-mr-3 xl:-mr-4"
                        >
                        <div className="sticky top-24 flex h-[calc(100vh-8.5rem)] min-h-[560px] flex-col rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <DashboardGoogleMapPanel
                            mapPoints={mapPoints}
                            geocodeCache={geocodeCache}
                            setGeocodeCache={setGeocodeCache}
                            focusedPropertyId={focusedPropertyId}
                            shouldLoadMap={isDesktopMapVisible}
                          />
                        </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative lg:hidden">
                    <AnimatePresence initial={false}>
                      {mobileViewMode === 'map' && (
                        <motion.div
                          key="mobile-map-panel"
                          initial={{ opacity: 0, y: 28 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 28 }}
                          transition={{ duration: 0.28, ease: 'easeInOut' }}
                          className="relative z-10 flex h-[60vh] min-h-[420px] flex-col rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden"
                        >
                          <DashboardGoogleMapPanel
                            mapPoints={mapPoints}
                            geocodeCache={geocodeCache}
                            setGeocodeCache={setGeocodeCache}
                            focusedPropertyId={focusedPropertyId}
                            shouldLoadMap={mobileViewMode === 'map'}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: mobileViewMode === 'list' ? 1 : 0,
                        y: mobileViewMode === 'list' ? 0 : 24,
                      }}
                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                      className={`${mobileViewMode === 'map' ? 'pointer-events-none absolute inset-x-0 top-0' : 'relative'} space-y-3 sm:space-y-4`}
                    >
                      {surveyCards}
                    </motion.div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </section>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDeleteCancel}
              className="fixed inset-0 bg-black/50 z-[200]"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-primary/10 px-8 pt-8 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-gray-900">Delete saved survey?</h3>
                    </div>
                    <button
                      onClick={handleDeleteCancel}
                      className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="px-8 py-6">
                  <p className="text-gray-600 text-base mb-6">
                    This survey will be removed from your dashboard.
                  </p>
                
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                  <button
                    onClick={handleDeleteCancel}
                      className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                  >
                      Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                      className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                  >
                      Delete
                  </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBulkDeleteCancel}
              className="fixed inset-0 bg-black/50 z-[200]"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-primary/10 px-8 pt-8 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-gray-900">
                        Delete {bulkDeleteCount} {bulkDeleteCount === 1 ? 'survey' : 'surveys'}?
                      </h3>
                    </div>
                    <button
                      onClick={handleBulkDeleteCancel}
                      className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="px-8 py-6">
                  <p className="text-gray-600 text-base mb-6">
                    {bulkDeleteCount === 1 
                      ? 'This survey will be removed from your dashboard.'
                      : 'These surveys will be removed from your dashboard.'
                    }
                  </p>
                
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                  <button
                    onClick={handleBulkDeleteCancel}
                      className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                  >
                      Cancel
                  </button>
                  <button
                    onClick={handleBulkDeleteConfirm}
                      className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                  >
                      Delete
                  </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

