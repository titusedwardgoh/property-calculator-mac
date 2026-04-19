"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Play, Eye, Trash2, FileText, Loader2, X, AlertTriangle, Search, ArrowUpDown, Map, List } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useFormStore } from '@/stores/formStore';
import { resetSessionAndForm } from '@/lib/sessionManager';

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

const sanitizeAddressPart = (value) => {
  if (!value) return '';
  return String(value).trim().replace(/\s+/g, ' ');
};

const buildSurveyAddress = (survey) => {
  const address = sanitizeAddressPart(survey?.property_address);
  const state = sanitizeAddressPart(survey?.selected_state);
  const parts = [address, state, 'Australia'].filter(Boolean);
  return parts.join(', ');
};

const createMapCacheKey = (surveyId, queryAddress) => `${surveyId}::${queryAddress}`;

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
  const title = escapeHtml(point.address || point.label || 'Property');
  const stateLine = point.state
    ? `<div style="color:#4b5563;margin-bottom:8px;"><span style="color:#6b7280;">State:</span> ${escapeHtml(point.state)}</div>`
    : '';
  const priceText =
    point.price != null && point.price !== ''
      ? `$${Number(point.price).toLocaleString()}`
      : 'TBD';
  return `
    <div style="max-width:280px;padding-right:8px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.5;color:#111827;">
      <div style="font-weight:600;margin-bottom:6px;">${title}</div>
      ${stateLine}
      <div style="margin-bottom:4px;"><span style="color:#6b7280;">Price:</span> ${escapeHtml(priceText)}</div>
      <div><span style="color:#6b7280;">Inspected:</span> ${point.inspected ? 'Yes' : 'No'}</div>
    </div>
  `;
};

const geocodeAddress = (geocoder, address) =>
  new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0] && results[0].geometry?.location) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
        });
        return;
      }
      resolve(null);
    });
  });

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
  if (!(window.google && window.google.maps)) {
    throw new Error('Google Maps is not available yet');
  }

  let MapConstructor = window.google.maps.Map;
  if (typeof MapConstructor !== 'function' && typeof window.google.maps.importLibrary === 'function') {
    const mapsLib = await window.google.maps.importLibrary('maps');
    MapConstructor = mapsLib?.Map;
  }
  if (typeof MapConstructor !== 'function') {
    throw new Error('Google Maps Map constructor unavailable');
  }

  return MapConstructor;
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
  const [scriptReady, setScriptReady] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mappedCount, setMappedCount] = useState(0);

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
    if (!shouldLoadMap || !scriptReady || !mapRef.current) return;

    let cancelled = false;
    const map = mapRef.current;

    const clearMarkers = () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      markersRef.current.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
    };

    const renderMarkers = (pointsToRender) => {
      clearMarkers();
      if (!pointsToRender.length) {
        map.setCenter(AUSTRALIA_CENTER);
        map.setZoom(4);
        setMappedCount(0);
        return;
      }

      const bounds = new window.google.maps.LatLngBounds();
      pointsToRender.forEach(point => {
        const marker = new window.google.maps.Marker({
          map,
          position: { lat: point.lat, lng: point.lng },
          title: point.label,
        });
        const focusMarker = () => {
          map.setCenter(marker.getPosition());
          map.setZoom(MARKER_FOCUS_ZOOM);
          if (!infoWindowRef.current) {
            infoWindowRef.current = new window.google.maps.InfoWindow({
              maxWidth: 280,
            });
          }
          infoWindowRef.current.setContent(buildMarkerInfoHtml(point));
          infoWindowRef.current.open({ map, anchor: marker });
        };
        marker.addListener('click', focusMarker);
        markersRef.current.push({ propertyId: point.propertyId, marker, focusMarker });
        bounds.extend(marker.getPosition());
      });

      map.fitBounds(bounds, 72);
      if (focusedPropertyId) {
        const focusedEntry = markersRef.current.find(entry => entry.propertyId === focusedPropertyId);
        if (focusedEntry) {
          focusedEntry.focusMarker();
        }
      }
      setMappedCount(pointsToRender.length);
    };

    const syncMarkers = async () => {
      setIsGeocoding(true);
      setMapError('');
      try {
        if (!geocoderRef.current) {
          const GeocoderConstructor = await resolveGeocoderConstructor();
          if (GeocoderConstructor) {
            geocoderRef.current = new GeocoderConstructor();
          }
        }

        const geocoder = geocoderRef.current;
        if (!geocoder) {
          if (!cancelled) {
            setMapError('Map loaded, but geocoding is unavailable right now.');
            renderMarkers([]);
          }
          return;
        }

        const nextCacheValues = {};
        const pointsToRender = [];

        for (const point of mapPoints) {
          if (cancelled) return;
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

          const geocoded = await geocodeAddress(geocoder, point.queryAddress);
          nextCacheValues[point.cacheKey] = geocoded;
          if (geocoded) {
            pointsToRender.push({
              ...point,
              lat: geocoded.lat,
              lng: geocoded.lng,
            });
          }
        }

        if (Object.keys(nextCacheValues).length > 0) {
          setGeocodeCache(prev => ({ ...prev, ...nextCacheValues }));
        }

        if (!cancelled) {
          renderMarkers(pointsToRender);
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
    };
  }, [focusedPropertyId, mapPoints, geocodeCache, scriptReady, setGeocodeCache, shouldLoadMap]);

  useEffect(() => {
    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
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
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/70 px-6 text-center text-sm text-gray-600">
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
  const [isMapHiddenDesktop, setIsMapHiddenDesktop] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState(null);
  const [mobileViewMode, setMobileViewMode] = useState('list');
  const [geocodeCache, setGeocodeCache] = useState({});
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
        setSurveys(result.data || []);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

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
    const originalInspectedStatus = new Map();
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
          address: survey.property_address || '',
          state: survey.selected_state || '',
          price: survey.property_price,
          completionStatus: survey.completion_status,
          completionPercentage: survey.completion_percentage,
          updatedAt: survey.updated_at,
          inspected: !!survey.inspected,
        };
      })
      .filter(Boolean);
  }, [sortedSurveys]);

  const surveyCards = sortedSurveys.map((survey, index) => {
    const status = getCompletionStatus(survey);
    const isComplete = survey.completion_status === 'complete';

    const handleCardClick = () => {
      setFocusedPropertyId(survey.id);
      setIsMapHiddenDesktop(false);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileViewMode('map');
      }
    };

    return (
      <motion.div
        key={survey.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        onClick={handleCardClick}
        className="h-full min-h-[230px] cursor-pointer rounded-2xl border border-secondary p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl lg:p-5 xl:p-6"
      >
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-4 sm:grid-rows-[auto_1fr] sm:gap-x-4 sm:gap-y-2">
          <div className="col-start-1 row-start-1 min-w-0 self-start pr-1 sm:pr-0">
            <div className="mb-2 flex flex-wrap items-start gap-x-2 gap-y-1 sm:items-center">
              <h3 className="text-[17px] font-semibold leading-snug text-gray-900 [overflow-wrap:anywhere] sm:text-lg sm:leading-normal">
                {survey.property_address || `Survey ${index + 1}`}
              </h3>
              <span
                className={`inline-flex shrink-0 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap rounded-full ${status.color} ${status.bg}`}
              >
                {status.text}
              </span>
            </div>
          </div>
          <div className="col-start-2 row-start-1 justify-self-end self-start">
            <input
              type="checkbox"
              checked={selectedProperties.has(survey.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleCheckboxChange(survey.id, e.target.checked);
              }}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 text-primary focus:outline-none focus:ring-0 focus:ring-offset-0 sm:mt-0"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select survey ${survey.property_address || index + 1}`}
            />
          </div>
          <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-1 sm:row-start-2">
            <div className="text-[15px] text-gray-600 space-y-1.5">
              <p>
                Property Price:{' '}
                {survey.property_price != null && survey.property_price !== ''
                  ? `$${Number(survey.property_price).toLocaleString()}`
                  : 'TBD'}
              </p>
              {survey.selected_state && (
                <p>State: {survey.selected_state}</p>
              )}
              <p>Last updated: {formatDate(survey.updated_at)}</p>
              <div className="mt-2 hidden items-center gap-2 sm:flex">
                <span className="text-sm text-gray-600">Inspected:</span>
                <SurveyInspectedToggle
                  inspected={!!survey.inspected}
                  compact={false}
                  onToggle={(e) => {
                    e.stopPropagation();
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
                    handleToggleInspected(survey.id, survey.inspected || false);
                  }}
                />
              </div>
              {isComplete ? (
                <button
                  onClick={() => handleResume(survey.id)}
                  type="button"
                  className="flex shrink-0 cursor-pointer items-center justify-center gap-0 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors sm:gap-2 sm:px-6 sm:py-2 sm:text-base"
                >
                  <Eye className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
                  View
                </button>
              ) : (
                <button
                  onClick={() => handleResume(survey.id)}
                  type="button"
                  className="flex shrink-0 cursor-pointer items-center justify-center gap-0 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-secondary transition-all hover:bg-primary-focus hover:shadow-lg sm:gap-2 sm:px-4.5 sm:py-2 sm:text-base"
                >
                  <Play className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
                  Resume
                </button>
              )}
              <button
                type="button"
                onClick={(e) => handleDeleteClick(survey.id, e)}
                disabled={deletingId === survey.id}
                className="flex shrink-0 cursor-pointer items-center gap-0 rounded-full bg-error/10 px-3 py-2 text-error hover:bg-error/20 transition-colors disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2"
              >
                {deletingId === survey.id ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:h-4 sm:w-4" />
                ) : (
                  <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                )}
              </button>
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
        <section className="mx-auto w-full max-w-[1920px] shrink-0 bg-secondary px-4 py-5 md:px-6 lg:px-8 lg:py-6">
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
                  className="mb-1 text-3xl font-bold leading-tight text-base-100 md:text-4xl lg:text-5xl"
                >
                  Dashboard
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  className="mb-0 text-base text-base-100 md:text-lg lg:text-xl"
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
                  !isMapHiddenDesktop ? 'lg:w-[75%] lg:pr-3 xl:pr-4' : ''
                }`}
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
                    <Map className="h-4 w-4" />
                    Map
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapHiddenDesktop(prev => !prev)}
                  className="hidden cursor-pointer items-center gap-2 rounded-full border border-base-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-base-200 lg:inline-flex"
                >
                  <Map className="h-4 w-4" />
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
                  !isMapHiddenDesktop ? 'lg:w-[75%] lg:pr-3 xl:pr-4' : ''
                }`}
              >
                {/* Select-all checkbox - fixed position, not part of sliding animation */}
                {sortedSurveys.length > 0 && (
                  <label className="absolute right-6 top-0 bottom-0 flex items-center z-10 cursor-pointer select-none shrink-0">
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
                      </div>
                    
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
                            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20"
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
                    <div className={isMapHiddenDesktop ? 'lg:col-span-12' : 'lg:col-span-9'}>
                      <div className={`grid gap-3 xl:gap-4 ${isMapHiddenDesktop ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                        {surveyCards}
                      </div>
                    </div>
                    {!isMapHiddenDesktop && (
                      <div className="lg:col-span-3 lg:-mt-[7.75rem] lg:-mr-3 xl:-mr-4">
                        <div className="sticky top-24 flex h-[calc(100vh-8.5rem)] min-h-[560px] flex-col rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                          <DashboardGoogleMapPanel
                            mapPoints={mapPoints}
                            geocodeCache={geocodeCache}
                            setGeocodeCache={setGeocodeCache}
                            focusedPropertyId={focusedPropertyId}
                            shouldLoadMap={!isMapHiddenDesktop}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="lg:hidden">
                    {mobileViewMode === 'map' ? (
                      <div className="flex h-[60vh] min-h-[420px] flex-col rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
                        <DashboardGoogleMapPanel
                          mapPoints={mapPoints}
                          geocodeCache={geocodeCache}
                          setGeocodeCache={setGeocodeCache}
                          focusedPropertyId={focusedPropertyId}
                          shouldLoadMap={mobileViewMode === 'map'}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {surveyCards}
                      </div>
                    )}
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

