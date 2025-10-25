import { v4 as uuidv4 } from 'uuid'

const USER_ID_KEY = 'property_calculator_user_id'
const SESSION_ID_KEY = 'property_calculator_session_id'

/**
 * Get or create a persistent user ID for anonymous users
 * This persists across browser sessions to track the same user over time
 * @returns {string} user ID from database
 */
export function getUserId() {
  if (typeof window === 'undefined') {
    return null
  }

  let userId = localStorage.getItem(USER_ID_KEY)
  
  if (!userId) {
    // First time - will be created in database when first property is saved
    userId = 'pending'
    localStorage.setItem(USER_ID_KEY, userId)
  }
  
  return userId
}

/**
 * Set the user ID (called after creating anonymous user in database)
 */
export function setUserId(userId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_ID_KEY, userId)
  }
}

/**
 * Get or create a session ID for this browser session
 * This is per-browser-session (cleared on browser close, but persists across page refreshes)
 * @returns {string} session ID
 */
export function getSessionId() {
  if (typeof window === 'undefined') {
    return null
  }

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = uuidv4()
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  
  return sessionId
}

/**
 * Clear the current session ID and create a new one
 * Useful for "Start Over" functionality
 * Keeps the user ID but starts a fresh session
 */
export function clearSessionId() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_ID_KEY)
    // New session ID will be created on next getSessionId() call
  }
}

/**
 * Check if we have a valid session ID
 * @returns {boolean}
 */
export function hasSessionId() {
  if (typeof window === 'undefined') {
    return false
  }
  
  return !!sessionStorage.getItem(SESSION_ID_KEY)
}
