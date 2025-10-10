import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
        return NextResponse.json(
            { error: 'Google Maps API key not configured' },
            { status: 500 }
        );
    }

    return NextResponse.json({
        scriptUrl: `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    });
}