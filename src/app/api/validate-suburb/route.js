import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get('postcode');
  
  if (!postcode) {
    return NextResponse.json(
      { error: 'Postcode is required' },
      { status: 400 }
    );
  }

  // Validate postcode format (4 digits)
  if (!/^\d{4}$/.test(postcode)) {
    return NextResponse.json(
      { error: 'Invalid postcode format' },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.AUSPOST_API_KEY;
    
    if (!apiKey) {
      // For development/testing, return mock data based on common postcodes
      const mockSuburbs = getMockSuburbsForPostcode(postcode);
      return NextResponse.json({
        postcode,
        suburbs: mockSuburbs,
        note: 'Using mock data - Australia Post API key not configured'
      });
    }

    // Call Australia Post API
    const response = await fetch(
      `https://digitalapi.auspost.com.au/postcode/search.json?q=${postcode}`,
      {
        headers: {
          'AUTH-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Australia Post API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract suburbs from response
    const suburbs = [];
    if (data.localities && data.localities.locality) {
      const localities = Array.isArray(data.localities.locality) 
        ? data.localities.locality 
        : [data.localities.locality];
      
      localities.forEach(locality => {
        if (locality.location && locality.postcode === postcode) {
          suburbs.push({
            name: locality.location,
            state: locality.state,
            postcode: locality.postcode
          });
        }
      });
    }

    return NextResponse.json({
      postcode,
      suburbs: suburbs.sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
    });

  } catch (error) {
    console.error('Australia Post API error:', error);
    // Fallback to mock data if API fails
    const mockSuburbs = getMockSuburbsForPostcode(postcode);
    return NextResponse.json({
      postcode,
      suburbs: mockSuburbs,
      note: 'API failed, using mock data'
    });
  }
}

// Mock data for common postcodes (for development/testing)
function getMockSuburbsForPostcode(postcode) {
  const mockData = {
    '3000': [{ name: 'Melbourne', state: 'VIC', postcode: '3000' }],
    '3001': [{ name: 'Melbourne', state: 'VIC', postcode: '3001' }],
    '3002': [{ name: 'East Melbourne', state: 'VIC', postcode: '3002' }],
    '3003': [{ name: 'West Melbourne', state: 'VIC', postcode: '3003' }],
    '3004': [{ name: 'Melbourne', state: 'VIC', postcode: '3004' }],
    '3141': [{ name: 'South Yarra', state: 'VIC', postcode: '3141' }],
    '3142': [{ name: 'South Yarra', state: 'VIC', postcode: '3142' }],
    '2000': [{ name: 'Sydney', state: 'NSW', postcode: '2000' }],
    '2001': [{ name: 'Sydney', state: 'NSW', postcode: '2001' }],
    '4000': [{ name: 'Brisbane', state: 'QLD', postcode: '4000' }],
    '4001': [{ name: 'Brisbane', state: 'QLD', postcode: '4001' }],
    '6000': [{ name: 'Perth', state: 'WA', postcode: '6000' }],
    '6001': [{ name: 'Perth', state: 'WA', postcode: '6001' }],
    '5000': [{ name: 'Adelaide', state: 'SA', postcode: '5000' }],
    '5001': [{ name: 'Adelaide', state: 'SA', postcode: '5001' }],
    '7000': [{ name: 'Hobart', state: 'TAS', postcode: '7000' }],
    '7001': [{ name: 'Hobart', state: 'TAS', postcode: '7001' }],
    '2600': [{ name: 'Canberra', state: 'ACT', postcode: '2600' }],
    '2601': [{ name: 'Canberra', state: 'ACT', postcode: '2601' }],
    '0800': [{ name: 'Darwin', state: 'NT', postcode: '0800' }],
    '0801': [{ name: 'Darwin', state: 'NT', postcode: '0801' }]
  };
  
  return mockData[postcode] || [];
}
