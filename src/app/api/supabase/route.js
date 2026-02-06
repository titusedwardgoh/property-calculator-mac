import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function stableStringify(value) {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

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
    const { action, sessionId, deviceId, userId, data, propertyId, userSaved, inspected, propertyIds, linkedUserId } = await request.json()

    switch (action) {
      case 'save':
        return await saveProperty(sessionId, deviceId, userId, data, propertyId, userSaved)
      case 'load':
        return await loadProperty(sessionId)
      case 'loadUserProperties':
        return await loadUserProperties(userId)
      case 'loadPropertyById':
        return await loadPropertyById(propertyId, userId)
      case 'linkPropertyToUser':
        return await linkPropertyToUser(propertyId)
      case 'linkGuestSurveyToUser':
        return await linkGuestSurveyToUser(propertyId, linkedUserId)
      case 'updatePropertyInspected':
        return await updatePropertyInspected(propertyId, inspected)
      case 'bulkDeleteProperties':
        return await bulkDeleteProperties(propertyIds)
      case 'bulkUpdateInspected':
        return await bulkUpdateInspected(propertyIds)
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

    // Word Document Save Model Implementation
    
    // Prepare base record data
    const recordData = {
      device_id: deviceId,
      session_id: sessionId,
      user_id: verifiedUserId,
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
      user_saved: userSaved === true
    }

    // Path 1: User NOT Signed In - Manual Save (INSERT on completion with is_active = FALSE)
    if (!verifiedUserId && userSaved === true) {
      recordData.is_active = false
      recordData.parent_id = null
      recordData.root_id = null
      
      const { data: newRecord, error: insertError } = await supabase
        .from('properties')
        .insert(recordData)
        .select()
        .maybeSingle()

      if (insertError) throw insertError

      return Response.json({ 
        success: true, 
        propertyId: newRecord.id,
        message: 'Property saved (anonymous)' 
      })
    }

    // Path 1.5: User NOT Signed In - Auto-save/Background Save
    // Allow anonymous users to auto-save (create/update records with user_id = null)
    if (!verifiedUserId && userSaved === false) {
      recordData.is_active = false // Always FALSE for auto-saves
      
      if (propertyId) {
        // Update existing anonymous record
        const { data: currentRecord } = await supabase
          .from('properties')
          .select('id, user_id, is_active')
          .eq('id', propertyId)
          .maybeSingle()

        if (currentRecord && currentRecord.user_id === null) {
          // This is an anonymous record - safe to update
          // Don't modify parent_id, root_id, or is_active - keep them as-is
          const { data: updatedRecord, error } = await supabase
            .from('properties')
            .update(recordData)
            .eq('id', propertyId)
            .select()
            .maybeSingle()

          if (error) throw error

          if (updatedRecord) {
            return Response.json({ 
              success: true, 
              propertyId: updatedRecord.id,
              message: 'Draft auto-saved (anonymous)' 
            })
          }
        }
      } else {
        // Create new anonymous draft (first auto-save)
        recordData.parent_id = null
        recordData.root_id = null
        
        const { data: newRecord, error } = await supabase
          .from('properties')
          .insert(recordData)
          .select()
          .maybeSingle()

        if (error) throw error

        return Response.json({ 
          success: true, 
          propertyId: newRecord.id,
          message: 'Draft created (anonymous)' 
        })
      }
    }

    // Path 2: User IS Signed In - Auto-save/Background Save
    // Always set is_active = FALSE for auto-saves (only update session records)
    if (verifiedUserId && userSaved === false) {
      recordData.is_active = false // Always FALSE for auto-saves
      
      if (propertyId) {
        // Verify this is a session record (is_active = false) before updating
        // This ensures we never accidentally update the master record
        const { data: currentRecord } = await supabase
          .from('properties')
          .select('id, is_active, root_id, user_id')
          .eq('id', propertyId)
          .maybeSingle()

        if (currentRecord && currentRecord.user_id !== verifiedUserId) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (currentRecord && currentRecord.is_active === false) {
          // This is a session record - safe to update
          // Don't modify parent_id, root_id, or is_active - keep them as-is
          const { data: updatedRecord, error } = await supabase
            .from('properties')
            .update(recordData)
            .eq('id', propertyId)
            .select()
            .maybeSingle()

          if (error) throw error

          if (updatedRecord) {
            return Response.json({ 
              success: true, 
              propertyId: updatedRecord.id,
              message: 'Draft auto-saved' 
            })
          }
        } else if (currentRecord && currentRecord.is_active === true) {
          // Master record: never create a session draft on auto-save. Only manual "Save" creates drafts.
          // This guarantees no duplicate rows when user just views a completed survey (client can still
          // send auto-save due to timing/normalization flakiness).
          return Response.json({
            success: true,
            propertyId: propertyId,
            persisted: false,
            message: 'Auto-save skipped (viewing master; save explicitly to create version)'
          })
        }
      } else {
        // Create new draft (first auto-save)
        recordData.parent_id = null
        recordData.root_id = null
        
        const { data: newRecord, error } = await supabase
          .from('properties')
          .insert(recordData)
          .select()
          .maybeSingle()

        if (error) throw error

        return Response.json({ 
          success: true, 
          propertyId: newRecord.id,
          message: 'Draft created' 
        })
      }
    }

    // Path 3: User IS Signed In - Manual "Save" Click
    // Manual Save Handler: Handle first-time save vs subsequent saves
    if (verifiedUserId && userSaved === true) {
      console.log('💾 Manual Save triggered:', { propertyId, verifiedUserId })
      
      if (propertyId) {
        let effectivePropertyId = propertyId
        // Fetch the current record
        let { data: currentRecord, error: fetchError } = await supabase
          .from('properties')
          .select('id, root_id, parent_id, is_active')
          .eq('id', propertyId)
          .maybeSingle()

        if (fetchError) {
          console.error('❌ Error fetching current record:', fetchError)
          throw fetchError
        }

        if (!currentRecord) {
          console.error('❌ Record not found for propertyId:', propertyId)
          throw new Error('Record not found')
        }

        console.log('📋 Current record:', {
          id: currentRecord.id,
          parent_id: currentRecord.parent_id,
          root_id: currentRecord.root_id,
          is_active: currentRecord.is_active
        })

        // If user is saving while still on an active master record (no session draft yet),
        // create the session draft now and continue the normal versioning flow.
        if (currentRecord.is_active === true) {
          const rootId = currentRecord.root_id || currentRecord.id
          const sessionRecordData = {
            ...recordData,
            parent_id: currentRecord.id,
            root_id: rootId,
            is_active: false,
            user_saved: false
          }

          const { data: sessionRecord, error: insertError } = await supabase
            .from('properties')
            .insert(sessionRecordData)
            .select()
            .maybeSingle()

          if (insertError) throw insertError

          effectivePropertyId = sessionRecord.id
          currentRecord = {
            id: sessionRecord.id,
            root_id: sessionRecord.root_id,
            parent_id: sessionRecord.parent_id,
            is_active: sessionRecord.is_active
          }
        }

        // Scenario: First Time Saving (First Version)
        // If current record has no parent_id and is_active = false, this is the first save
        if (!currentRecord.parent_id && currentRecord.is_active === false) {
          console.log('📝 First-time save detected')
          // This is a first-time save - activate the draft and set root_id in one step
          recordData.is_active = true
          recordData.parent_id = null
          recordData.root_id = effectivePropertyId // Set root_id to its own id

          const { data: updatedRecord, error: updateError } = await supabase
            .from('properties')
            .update(recordData)
            .eq('id', effectivePropertyId)
            .select()
            .maybeSingle()

          if (updateError) {
            console.error('❌ Error updating first-time save:', updateError)
            throw updateError
          }

          console.log('✅ First save: Activated record', effectivePropertyId)

          return Response.json({ 
            success: true, 
            propertyId: updatedRecord.id,
            message: 'Property saved to dashboard' 
          })
        }

        // Scenario: Subsequent Saves (Resume -> Edit -> Save)
        // The Versioning "Flip"
        console.log('🔄 Subsequent save detected (resume -> save)')
        
        // 1. Deactivate the Master (The record the session was branched from)
        if (currentRecord.parent_id) {
          console.log('📤 Deactivating master record:', currentRecord.parent_id)
          const { error: deactivateError } = await supabase
            .from('properties')
            .update({ is_active: false })
            .eq('id', currentRecord.parent_id)

          if (deactivateError) {
            console.error('❌ Error deactivating master record:', deactivateError)
            throw deactivateError
          }
          console.log('✅ Master record deactivated')
        } else {
          console.log('⚠️ No parent_id found - this might be an edge case')
        }

        // 2. Activate the Session (The record the user is currently editing)
        // Preserve parent_id and root_id from session record
        recordData.is_active = true
        recordData.root_id = currentRecord.root_id || currentRecord.id
        recordData.parent_id = currentRecord.parent_id || null

        console.log('📥 Activating session record:', effectivePropertyId, 'with root_id:', recordData.root_id)

        const { data: updatedRecord, error: updateError } = await supabase
          .from('properties')
          .update(recordData)
          .eq('id', effectivePropertyId)
          .select()
          .maybeSingle()

        if (updateError) {
          console.error('❌ Error activating session record:', updateError)
          throw updateError
        }

        console.log('✅ Saved: Deactivated master', currentRecord.parent_id, 'Activated session', effectivePropertyId)

        return Response.json({ 
          success: true, 
          propertyId: updatedRecord.id,
          message: 'Property saved to dashboard' 
        })
      } else {
        // First manual save - create new active record (no previous draft exists)
        recordData.is_active = true
        recordData.parent_id = null
        recordData.root_id = null // Will be set to its own id after creation

        const { data: newRecord, error } = await supabase
          .from('properties')
          .insert(recordData)
          .select()
          .maybeSingle()

        if (error) throw error

        // Set root_id to its own id for the first record
        const { error: updateRootError } = await supabase
          .from('properties')
          .update({ root_id: newRecord.id })
          .eq('id', newRecord.id)

        if (updateRootError) {
          console.error('Error setting root_id:', updateRootError)
          // Don't throw - record is created, just root_id update failed
        }

        return Response.json({ 
          success: true, 
          propertyId: newRecord.id,
          message: 'Property saved to dashboard' 
        })
      }
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

    // Dashboard: Only show active records with user_saved = true (latest saved version)
    const { data: records, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true) // Only show active versions (latest saved version)
      .eq('user_saved', true) // Only show surveys that the user has saved (not deleted)
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

async function linkPropertyToUser(propertyId) {
  try {
    if (!propertyId) {
      return Response.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Get user from session
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized - must be logged in' }, { status: 401 })
    }

    // Check if profile exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    
    if (profileError) {
      console.error('Error checking profile:', profileError)
      return Response.json({ error: 'Error verifying user profile' }, { status: 500 })
    }

    if (!profile) {
      // Profile doesn't exist yet - try to create it
      try {
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || null
          })
        
        if (createError) {
          console.error('Error creating profile:', createError)
          return Response.json({ error: 'Error creating user profile' }, { status: 500 })
        }
      } catch (err) {
        console.error('Exception creating profile:', err)
        return Response.json({ error: 'Error creating user profile' }, { status: 500 })
      }
    }

    // Fetch the property record to verify it exists and is anonymous
    const { data: propertyRecord, error: fetchError } = await supabase
      .from('properties')
      .select('id, user_id')
      .eq('id', propertyId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching property:', fetchError)
      return Response.json({ error: 'Error fetching property record' }, { status: 500 })
    }

    if (!propertyRecord) {
      return Response.json({ error: 'Property not found' }, { status: 404 })
    }

    // Only link if the property doesn't already have a user_id (is anonymous)
    if (propertyRecord.user_id !== null) {
      // Property already has a user - check if it's the same user
      if (propertyRecord.user_id === user.id) {
        return Response.json({ 
          success: true, 
          message: 'Property already linked to your account' 
        })
      } else {
        return Response.json({ error: 'Property belongs to another user' }, { status: 403 })
      }
    }

    // Update the property record's user_id, set is_active to true, and user_saved to true
    // This makes it visible in the user's dashboard
    const { error: updateError } = await supabase
      .from('properties')
      .update({ 
        user_id: user.id,
        is_active: true,
        user_saved: true
      })
      .eq('id', propertyId)

    if (updateError) {
      console.error('Error linking property to user:', updateError)
      return Response.json({ error: 'Error linking property to account' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'Property linked to your account successfully' 
    })
  } catch (error) {
    console.error('Link property to user error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function loadPropertyById(propertyId, userId) {
  try {
    if (!propertyId) {
      return Response.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Always try to get user from session (even if userId not provided)
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    // Use session user ID if userId not provided, or verify if provided
    const verifiedUserId = userId || (user ? user.id : null)
    
    if (userId && (authError || !user || user.id !== userId)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the master record (the one being resumed)
    const { data: masterRecord, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (!masterRecord) {
      return Response.json({ 
        success: true, 
        data: null,
        message: 'Property not found' 
      })
    }

    // If verifiedUserId exists, verify the property belongs to the user
    if (verifiedUserId && masterRecord.user_id !== verifiedUserId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // IMPORTANT: Do NOT create a session (shadow) record on load.
    // Creating session records is deferred until the first save (auto-save or manual save),
    // so simply viewing/resuming a completed survey without edits does not create duplicates.

    // Return the record (either not a resume operation, or master is already inactive)
    return Response.json({ 
      success: true, 
      data: masterRecord,
      message: 'Property loaded successfully' 
    })
  } catch (error) {
    console.error('Load property by ID error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function updatePropertyInspected(propertyId, inspected) {
  try {
    if (!propertyId) {
      return Response.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Get user from session
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized - must be logged in' }, { status: 401 })
    }

    // Verify user owns the property
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', propertyId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching property:', fetchError)
      return Response.json({ error: 'Error fetching property' }, { status: 500 })
    }

    if (!property) {
      return Response.json({ error: 'Property not found' }, { status: 404 })
    }

    if (property.user_id !== user.id) {
      return Response.json({ error: 'Unauthorized - property does not belong to user' }, { status: 403 })
    }

    // Update the inspected status
    const { error: updateError } = await supabase
      .from('properties')
      .update({ inspected: inspected === true })
      .eq('id', propertyId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating inspected status:', updateError)
      return Response.json({ error: 'Failed to update inspected status' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'Inspected status updated successfully' 
    })
  } catch (error) {
    console.error('Update inspected error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function bulkDeleteProperties(propertyIds) {
  try {
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return Response.json({ error: 'Property IDs array is required' }, { status: 400 })
    }

    // Get user from session
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized - must be logged in' }, { status: 401 })
    }

    // Verify all properties belong to the authenticated user
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, user_id')
      .in('id', propertyIds)

    if (fetchError) {
      console.error('Error fetching properties:', fetchError)
      return Response.json({ error: 'Error fetching properties' }, { status: 500 })
    }

    if (!properties || properties.length === 0) {
      return Response.json({ error: 'No properties found' }, { status: 404 })
    }

    // Check if all properties belong to the user
    const unauthorizedProperties = properties.filter(p => p.user_id !== user.id)
    if (unauthorizedProperties.length > 0) {
      return Response.json({ error: 'Unauthorized - some properties do not belong to user' }, { status: 403 })
    }

    // Update user_saved to false for all matching properties
    const { error: updateError } = await supabase
      .from('properties')
      .update({ user_saved: false })
      .in('id', propertyIds)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error bulk deleting properties:', updateError)
      return Response.json({ error: 'Failed to delete properties' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: `${propertyIds.length} properties deleted successfully`,
      deletedCount: propertyIds.length
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function bulkUpdateInspected(propertyIds) {
  try {
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return Response.json({ error: 'Property IDs array is required' }, { status: 400 })
    }

    // Get user from session
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized - must be logged in' }, { status: 401 })
    }

    // Verify all properties belong to the authenticated user
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, user_id')
      .in('id', propertyIds)

    if (fetchError) {
      console.error('Error fetching properties:', fetchError)
      return Response.json({ error: 'Error fetching properties' }, { status: 500 })
    }

    if (!properties || properties.length === 0) {
      return Response.json({ error: 'No properties found' }, { status: 404 })
    }

    // Check if all properties belong to the user
    const unauthorizedProperties = properties.filter(p => p.user_id !== user.id)
    if (unauthorizedProperties.length > 0) {
      return Response.json({ error: 'Unauthorized - some properties do not belong to user' }, { status: 403 })
    }

    // Set inspected to true for all matching properties
    const { error: updateError } = await supabase
      .from('properties')
      .update({ inspected: true })
      .in('id', propertyIds)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error bulk updating inspected status:', updateError)
      return Response.json({ error: 'Failed to update inspected status' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: `${propertyIds.length} properties marked as inspected`,
      updatedCount: propertyIds.length
    })
  } catch (error) {
    console.error('Bulk update inspected error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function linkGuestSurveyToUser(propertyId, userId) {
  try {
    if (!propertyId) {
      return Response.json({ error: 'Property ID is required' }, { status: 400 })
    }

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify the property exists
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id, user_id')
      .eq('id', propertyId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching property:', fetchError)
      return Response.json({ error: 'Error fetching property' }, { status: 500 })
    }

    if (!property) {
      return Response.json({ error: 'Property not found' }, { status: 404 })
    }

    // Update the property to link it to the user
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        user_id: userId,
        user_saved: true,
        is_active: true
      })
      .eq('id', propertyId)

    if (updateError) {
      console.error('Error linking survey to user:', updateError)
      return Response.json({ error: 'Failed to link survey to user' }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'Survey linked to user successfully'
    })
  } catch (error) {
    console.error('Link guest survey error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
