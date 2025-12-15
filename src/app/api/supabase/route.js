import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

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

    // Path 1: User NOT Signed In - INSERT on completion with is_active = FALSE
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

    // Path 2: User IS Signed In - Auto-save/Background Save
    // Always set is_active = FALSE for auto-saves (only update session records)
    if (verifiedUserId && userSaved === false) {
      recordData.is_active = false // Always FALSE for auto-saves
      
      if (propertyId) {
        // Verify this is a session record (is_active = false) before updating
        // This ensures we never accidentally update the master record
        const { data: currentRecord } = await supabase
          .from('properties')
          .select('id, is_active')
          .eq('id', propertyId)
          .maybeSingle()

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
          // This is a master record - should not be auto-saved
          // This shouldn't happen, but if it does, return success without updating
          console.warn('Attempted to auto-save master record - skipping')
          return Response.json({ 
            success: true, 
            propertyId: propertyId,
            message: 'Auto-save skipped (master record)' 
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
        // Fetch the current record
        const { data: currentRecord, error: fetchError } = await supabase
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

        // Scenario: First Time Saving (First Version)
        // If current record has no parent_id and is_active = false, this is the first save
        if (!currentRecord.parent_id && currentRecord.is_active === false) {
          console.log('📝 First-time save detected')
          // This is a first-time save - activate the draft and set root_id in one step
          recordData.is_active = true
          recordData.parent_id = null
          recordData.root_id = propertyId // Set root_id to its own id

          const { data: updatedRecord, error: updateError } = await supabase
            .from('properties')
            .update(recordData)
            .eq('id', propertyId)
            .select()
            .maybeSingle()

          if (updateError) {
            console.error('❌ Error updating first-time save:', updateError)
            throw updateError
          }

          console.log('✅ First save: Activated record', propertyId)

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

        console.log('📥 Activating session record:', propertyId, 'with root_id:', recordData.root_id)

        const { data: updatedRecord, error: updateError } = await supabase
          .from('properties')
          .update(recordData)
          .eq('id', propertyId)
          .select()
          .maybeSingle()

        if (updateError) {
          console.error('❌ Error activating session record:', updateError)
          throw updateError
        }

        console.log('✅ Saved: Deactivated master', currentRecord.parent_id, 'Activated session', propertyId)

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

    // Survey Resume Handler: If user is signed in and master record is active, create session record
    console.log('🔍 loadPropertyById versioning check:', {
      verifiedUserId: !!verifiedUserId,
      masterIsActive: masterRecord.is_active,
      masterId: masterRecord.id,
      willCreateSession: verifiedUserId && masterRecord.is_active === true
    })
    
    if (verifiedUserId && masterRecord.is_active === true) {
      // Identify root_id: use existing root_id or master record's id
      const rootId = masterRecord.root_id || masterRecord.id

      console.log('📝 Creating session record for resume:', {
        masterId: masterRecord.id,
        rootId: rootId,
        userId: verifiedUserId
      })

      // Create session record (clone of master with is_active = false)
      const newSessionId = uuidv4()
      const sessionRecordData = {
        device_id: masterRecord.device_id,
        session_id: newSessionId,
        user_id: masterRecord.user_id,
        parent_id: masterRecord.id, // Parent is the master record
        root_id: rootId, // Same root as master
        is_active: false, // Session record is always inactive
        user_saved: false, // Not yet saved
        property_price: masterRecord.property_price,
        property_address: masterRecord.property_address,
        selected_state: masterRecord.selected_state,
        property_details: masterRecord.property_details,
        buyer_details: masterRecord.buyer_details,
        loan_details: masterRecord.loan_details,
        seller_questions: masterRecord.seller_questions,
        calculated_values: masterRecord.calculated_values,
        completion_status: masterRecord.completion_status,
        completion_percentage: masterRecord.completion_percentage,
        current_section: masterRecord.current_section
      }

      const { data: sessionRecord, error: insertError } = await supabase
        .from('properties')
        .insert(sessionRecordData)
        .select()
        .maybeSingle()

      if (insertError) {
        console.error('Error creating session record:', insertError)
        // Fall back to returning master record if session creation fails
        return Response.json({ 
          success: true, 
          data: masterRecord,
          message: 'Property loaded successfully' 
        })
      }

      console.log('✅ Created session record:', {
        sessionId: sessionRecord.id,
        masterId: masterRecord.id,
        rootId: rootId,
        is_active: sessionRecord.is_active
      })

      // Return the session record for editing
      return Response.json({ 
        success: true, 
        data: sessionRecord,
        message: 'Property loaded successfully (session record created)' 
      })
    }

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
