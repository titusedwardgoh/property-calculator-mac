import { createClient as createServiceClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key (for admin operations)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Merge guest surveys from survey_leads to a user account
 * @param {string} email - User's email address
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, linkedCount: number, error?: string}>}
 */
export async function mergeGuestSurveys(email, userId) {
  try {
    if (!email || !userId) {
      return { success: false, linkedCount: 0, error: 'Email and userId are required' }
    }

    // Find all unconverted survey leads for this email
    const { data: surveyLeads, error: fetchError } = await supabase
      .from('survey_leads')
      .select('id, property_id')
      .eq('email', email.toLowerCase())
      .eq('converted', false)

    if (fetchError) {
      console.error('Error fetching survey leads:', fetchError)
      return { success: false, linkedCount: 0, error: fetchError.message }
    }

    if (!surveyLeads || surveyLeads.length === 0) {
      return { success: true, linkedCount: 0 }
    }

    // Extract property IDs
    const propertyIds = surveyLeads.map(lead => lead.property_id)

    // Update all matching properties to link them to the user
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        user_id: userId,
        user_saved: true,
        is_active: true
      })
      .in('id', propertyIds)

    if (updateError) {
      console.error('Error linking properties to user:', updateError)
      return { success: false, linkedCount: 0, error: updateError.message }
    }

    // Mark all survey leads as converted
    const leadIds = surveyLeads.map(lead => lead.id)
    const { error: convertError } = await supabase
      .from('survey_leads')
      .update({ converted: true })
      .in('id', leadIds)

    if (convertError) {
      console.error('Error marking survey leads as converted:', convertError)
      // Don't fail the whole operation if this fails - properties are already linked
    }

    return { success: true, linkedCount: surveyLeads.length }
  } catch (error) {
    console.error('Exception in mergeGuestSurveys:', error)
    return { success: false, linkedCount: 0, error: error.message }
  }
}

