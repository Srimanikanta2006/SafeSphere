import { NextResponse } from 'next/server';
import { generateSafetyWarning } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userLat,
      userLng,
      currentTime,
      dayOfWeek,
      plannedRouteBounds
    } = body;

    // Simulate querying Firestore for historical incidents in the area (1km radius)
    // In a real implementation, we would query the `incidents` or `hotspots` collection
    const incidentCount = Math.floor(Math.random() * 8); // Mock 0-7 incidents

    let warningLevel = 'none';
    let warningMessage = 'Area looks generally safe based on recent data.';
    const hotZones = [];
    let saferAlternative = null;

    // Trigger warning if current time matches peak times with 3+ incidents
    if (incidentCount >= 3) {
      warningLevel = incidentCount >= 5 ? 'high' : 'moderate';

      const timeRange = `${parseInt(currentTime.split(':')[0]) - 1}:00 - ${parseInt(currentTime.split(':')[0]) + 1}:00`;
      const historicalData = { incidentCount };

      warningMessage = await generateSafetyWarning(historicalData, 'your current location', dayOfWeek, timeRange);

      hotZones.push({
        lat: userLat + 0.005,
        lng: userLng - 0.005,
        radius: 300,
        reason: 'Frequent incident cluster detected'
      });

      saferAlternative = 'Consider taking main illuminated roads and avoid inner alleys in this sector.';
    }

    return NextResponse.json({
      warningLevel,
      warningMessage,
      hotZones,
      saferAlternative
    });

  } catch (error) {
    console.error('Agent 3 Error:', error);
    return NextResponse.json({ error: 'Failed to predict safety' }, { status: 500 });
  }
}
