import { v4 as uuidv4 } from 'uuid'
import { createClient } from './supabase/client'

const DEVICE_ID_KEY = 'property_calculator_device_id'
const SESSION_ID_KEY = 'property_calculator_session_id'

/**
 * Get or create a persistent device ID for tracking anonymous users
 * This persists FOREVER in localStorage to track the same device across all sessions
 * @returns {string} device ID (UUID)
 */
export function getDeviceId() {
  if (typeof window === 'undefined') {
    return null
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  
  if (!deviceId) {
    // First time visitor - create new device ID
    deviceId = uuidv4()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
    console.log('🆕 New device ID created:', deviceId)
  }
  
  return deviceId
}

/**
 * Get or create a session ID for the current survey attempt
 * This persists in sessionStorage for the duration of the survey
 * @returns {string} session ID (UUID)
 */
export function getSessionId() {
  if (typeof window === 'undefined') {
    return null
  }

  // Check if we already have a session ID in sessionStorage
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  
  if (!sessionId) {
    // Create a new session ID for this survey attempt
    sessionId = uuidv4()
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
    console.log('🆕 New session ID created:', sessionId)
  }
  
  return sessionId
}

/**
 * Generate a completely new session ID (for starting a fresh survey)
 * This clears the old session and creates a new one
 * @returns {string} new session ID (UUID)
 */
export function createNewSession() {
  if (typeof window === 'undefined') {
    return null
  }

  // Clear old session
  sessionStorage.removeItem(SESSION_ID_KEY)
  
  // Create new session ID
  const sessionId = uuidv4()
  sessionStorage.setItem(SESSION_ID_KEY, sessionId)
  console.log('🔄 New session created (old session cleared):', sessionId)
  
  return sessionId
}

/**
 * Clear the current session ID
 * Use this when starting a completely fresh survey
 */
export function clearSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_ID_KEY)
    console.log('🗑️ Session cleared')
  }
}

/**
 * For future use: Set the authenticated user ID when user logs in
 * Currently not used (all users are anonymous)
 * @param {string} userId - User ID from users table
 */
export function setAuthenticatedUserId(userId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('property_calculator_authenticated_user_id', userId)
  }
}

/**
 * Get the Supabase user ID from the current session
 * This is the primary method for getting authenticated user ID
 * @returns {Promise<string|null>} User ID or null if not authenticated
 */
export async function getSupabaseUserId() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      return null
    }
    
    return session.user.id
  } catch (error) {
    console.error('Error getting Supabase user ID:', error)
    return null
  }
}

/**
 * Get the authenticated user ID if logged in
 * Prioritizes Supabase session over localStorage
 * @returns {Promise<string|null>} User ID or null if not logged in
 */
export async function getAuthenticatedUserId() {
  if (typeof window === 'undefined') {
    return null
  }
  
  // Try Supabase session first (primary method)
  const supabaseUserId = await getSupabaseUserId()
  if (supabaseUserId) {
    return supabaseUserId
  }
  
  // Fallback to localStorage (for backwards compatibility)
  return localStorage.getItem('property_calculator_authenticated_user_id')
}

/**
 * For future use: Clear authenticated user ID on logout
 */
export function clearAuthenticatedUserId() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('property_calculator_authenticated_user_id')
  }
}

/**
 * Reset session and form - used when starting a completely fresh survey
 * @param {Function} resetForm - Function to reset the form state (from Zustand store)
 */
export function resetSessionAndForm(resetForm) {
  if (typeof window !== 'undefined') {
    // Clear existing session ID from sessionStorage
    sessionStorage.removeItem(SESSION_ID_KEY)
    // Clear any resume flags
    sessionStorage.removeItem('resumePropertyId')
    // Clear any old authenticated user ID from localStorage (if needed)
    // Note: We don't clear device_id as it should persist across sessions
  }
  // Reset Zustand form state
  if (resetForm && typeof resetForm === 'function') {
    resetForm()
  }
  // A new session ID will be generated on the next call to getSessionId()
}
