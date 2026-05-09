import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      detections, // { screamProbability, fallDetected, fireProbability, violentMotion }
      userStatus, // "responsive" | "unresponsive"
      locationContext, // { isHighCrimeZone: boolean, isIndoor: boolean }
      environmentalSensors // { smokeIncreasing: boolean }
    } = body;

    // Severity Agent - Estimate danger level based on point system
    let score = 0;

    // Event Points mapping
    if (detections.screamProbability > 0.7) score += 30; // scream detected
    if (detections.violentMotion || detections.fallDetected) score += 20; // violent motion
    if (userStatus === 'unresponsive') score += 40; // no response
    if (locationContext?.isHighCrimeZone) score += 15; // high crime zone
    if (detections.fireProbability > 0.5 && locationContext?.isIndoor) score += 50; // indoor fire
    if (environmentalSensors?.smokeIncreasing) score += 30; // smoke increasing

    // Severity Level Mapping
    // 0–30 Low, 31–60 Moderate, 61–85 High, 86+ Critical
    let level = "LOW";
    if (score >= 86) level = "CRITICAL";
    else if (score >= 61) level = "HIGH";
    else if (score >= 31) level = "MODERATE";

    return NextResponse.json({
      score,
      severity: level,
      breakdown: {
        points: score,
        thresholds: "0-30: Low, 31-60: Moderate, 61-85: High, 86+: Critical"
      }
    });

  } catch (error) {
    console.error('Severity Agent Error:', error);
    return NextResponse.json({ error: 'Failed to calculate severity' }, { status: 500 });
  }
}
