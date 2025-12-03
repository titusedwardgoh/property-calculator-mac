import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Server-side Supabase client with service role key (for database operations)
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

export async function POST(request) {
  try {
    const { action, sessionId, deviceId, userId, data, propertyId, userSaved } = await request.json()

    switch (action) {
      case 'save':
        return await saveProperty(sessionId, deviceId, userId, data, propertyId, userSaved)
      case 'load':
        return await loadProperty(sessionId)
      case 'loadUserProperties':
        return await loadUserProperties(userId)
      case 'loadPropertyById':
        return await loadPropertyById(propertyId, userId)
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function saveProperty(sessionId, deviceId, userId, data, propertyId, userSaved = false) {
  try {
    // Verify user ID from session if provided
    let verifiedUserId = null
    if (userId) {
      const serverClient = await createServerClient()
      const { data: { user }, error } = await serverClient.auth.getUser()
      
      if (error || !user || user.id !== userId) {
        // User ID doesn't match session, ignore it (treat as anonymous)
        verifiedUserId = null
      } else {
        // Check if profile exists in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (profileError) {
          console.error('Error checking profile:', profileError)
          // If there's an error checking profile, treat as anonymous
          verifiedUserId = null
        } else if (profile) {
          // Profile exists, use the user ID
          verifiedUserId = userId
        } else {
          // Profile doesn't exist yet - this can happen if trigger hasn't run
          // Try to create it, or set to null
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: user.email || null
              })
              .select()
              .maybeSingle()
            
            if (createError) {
              console.error('Error creating profile:', createError)
              verifiedUserId = null
            } else if (newProfile) {
              verifiedUserId = userId
            } else {
              verifiedUserId = null
            }
          } catch (err) {
            console.error('Exception creating profile:', err)
            verifiedUserId = null
          }
        }
      }
    }

    const {
      propertyPrice,
      propertyAddress,
      selectedState,
      propertyDetails,
      buyerDetails,
      loanDetails,
      sellerQuestions,
      calculatedValues,
      completionStatus,
      completionPercentage,
      currentSection
    } = data

    const recordData = {
      device_id: deviceId, // Permanent device identifier
      session_id: sessionId, // Unique per form attempt
      user_id: verifiedUserId, // Verified user ID from session, or NULL for anonymous
      property_price: propertyPrice ? parseFloat(propertyPrice) : null,
      property_address: propertyAddress || null,
      selected_state: selectedState || null,
      property_details: propertyDetails || {},
      buyer_details: buyerDetails || {},
      loan_details: loanDetails || {},
      seller_questions: sellerQuestions || {},
      calculated_values: calculatedValues || {},
      completion_status: completionStatus || 'in_progress',
      completion_percentage: completionPercentage || 0,
      current_section: currentSection || 'property_details',
      user_saved: userSaved === true // Set to true only when user explicitly saves
    }
    
    console.log('💾 Saving property with user_saved:', userSaved === true, 'propertyId:', propertyId)

    // Helper function to save with retry on foreign key error
    const saveWithRetry = async (saveFunction) => {
      try {
        return await saveFunction()
      } catch (error) {
        // If foreign key constraint violation and we have a user_id, retry with null
        if (
          error.code === '23503' && // Foreign key violation
          error.message?.includes('properties_user_id_fkey') &&
          recordData.user_id !== null
        ) {
          console.warn('Foreign key violation detected, retrying with user_id = null')
          const originalUserId = recordData.user_id
          recordData.user_id = null
          try {
            return await saveFunction()
          } catch (retryError) {
            // Restore original user_id for error message
            recordData.user_id = originalUserId
            throw retryError
          }
        }
        throw error
      }
    }

    if (propertyId) {
      // Try to update existing record
      const result = await saveWithRetry(async () => {
        const { data: updatedRecord, error } = await supabase
          .from('properties')
          .update(recordData)
          .eq('id', propertyId)
          .select()
          .maybeSingle()

        if (error) throw error

        // If record doesn't exist, return null to trigger creation
        if (!updatedRecord) {
          return null
        }

        return updatedRecord
      })

      // If update succeeded, return success
      if (result) {
        return Response.json({ 
          success: true, 
          propertyId: result.id,
          message: 'Property updated successfully' 
        })
      }
      
      // If record not found, fall through to create new record
      console.log('Record not found for update, creating new record instead')
    }
    
    // Create new record (either no propertyId or update failed)
    {
      // Create new record
      const result = await saveWithRetry(async () => {
        const { data: newRecord, error } = await supabase
          .from('properties')
          .insert(recordData)
          .select()
          .maybeSingle()

        if (error) throw error

        if (!newRecord) {
          throw new Error('Failed to create new record')
        }

        return newRecord
      })

      return Response.json({ 
        success: true, 
        propertyId: result.id,
        message: 'Property created successfully' 
      })
    }
  } catch (error) {
    console.error('Save error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function loadProperty(sessionId) {
  try {
    const { data: records, error } = await supabase
      .from('properties')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) throw error

    if (records && records.length > 0) {
      const record = records[0]
      return Response.json({ 
        success: true, 
        data: record,
        message: 'Property loaded successfully' 
      })
    } else {
      return Response.json({ 
        success: true, 
        data: null,
        message: 'No property found' 
      })
    }
  } catch (error) {
    console.error('Load error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function loadUserProperties(userId) {
  try {
    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify user ID from session
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: records, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .eq('user_saved', true) // Only show surveys that user has explicitly saved
      .order('updated_at', { ascending: false })

    if (error) throw error

    return Response.json({ 
      success: true, 
      data: records || [],
      message: 'User properties loaded successfully' 
    })
  } catch (error) {
    console.error('Load user properties error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function loadPropertyById(propertyId, userId) {
  try {
    if (!propertyId) {
      return Response.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Verify user ID from session if provided
    if (userId) {
      const serverClient = await createServerClient()
      const { data: { user }, error: authError } = await serverClient.auth.getUser()
      
      if (authError || !user || user.id !== userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { data: record, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .maybeSingle()

    if (error) throw error

    // If userId provided, verify the property belongs to the user
    if (userId && record && record.user_id !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (record) {
      return Response.json({ 
        success: true, 
        data: record,
        message: 'Property loaded successfully' 
      })
    } else {
      return Response.json({ 
        success: true, 
        data: null,
        message: 'Property not found' 
      })
    }
  } catch (error) {
    console.error('Load property by ID error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
