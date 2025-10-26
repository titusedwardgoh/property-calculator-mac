import { v4 as uuidv4 } from 'uuid'

const DEVICE_ID_KEY = 'property_calculator_device_id'

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
 * Generate a NEW session ID for each page load
 * This creates a fresh session every time, so page refresh = new form attempt
 * Does NOT store in sessionStorage - generates new UUID every call
 * @returns {string} session ID (UUID)
 */
export function getSessionId() {
  if (typeof window === 'undefined') {
    return null
  }

  // Always generate a new session ID
  const sessionId = uuidv4()
  console.log('🔄 New session ID generated:', sessionId)
  
  return sessionId
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
 * For future use: Get the authenticated user ID if logged in
 * @returns {string|null} User ID or null if not logged in
 */
export function getAuthenticatedUserId() {
  if (typeof window === 'undefined') {
    return null
  }
  
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
