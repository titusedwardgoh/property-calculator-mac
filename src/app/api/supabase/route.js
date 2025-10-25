import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request) {
  try {
    const { action, sessionId, data, propertyId } = await request.json()

    switch (action) {
      case 'save':
        return await saveProperty(sessionId, data, propertyId)
      case 'load':
        return await loadProperty(sessionId)
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function saveProperty(sessionId, data, propertyId) {
  try {
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
      session_id: sessionId,
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
      current_section: currentSection || 'property_details'
    }

    if (propertyId) {
      // Update existing record
      const { data: updatedRecord, error } = await supabase
        .from('properties')
        .update(recordData)
        .eq('id', propertyId)
        .select()
        .single()

      if (error) throw error

      return Response.json({ 
        success: true, 
        propertyId: updatedRecord.id,
        message: 'Property updated successfully' 
      })
    } else {
      // Create new record
      const { data: newRecord, error } = await supabase
        .from('properties')
        .insert(recordData)
        .select()
        .single()

      if (error) throw error

      return Response.json({ 
        success: true, 
        propertyId: newRecord.id,
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
