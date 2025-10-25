import { v4 as uuidv4 } from 'uuid'

const SESSION_KEY = 'property_calculator_session_id'

/**
 * Get or create a session ID for anonymous users
 * @returns {string} session ID
 */
export function getSessionId() {
  if (typeof window === 'undefined') {
    // Server-side rendering - return null
    return null
  }

  let sessionId = localStorage.getItem(SESSION_KEY)
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = uuidv4()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  
  return sessionId
}

/**
 * Clear the session ID (useful for testing or logout)
 */
export function clearSessionId() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
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
  
  return !!localStorage.getItem(SESSION_KEY)
}
