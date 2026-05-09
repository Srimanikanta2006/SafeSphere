import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      detections,
      context, // e.g., "indoors", "outdoors", "home", "night"
      movementPattern, // "single_impact_no_rotation", "erratic", etc.
      userInteraction, // "ignored", "prank", "responsive"
      timestamp
    } = body;

    // Validation Agent - False-positive reduction layer
    // Purpose: "Is this likely real?"
    let isValid = true;
    let confidence = 0.9;
    let reasoning = "Sensors indicate a genuine emergency pattern.";

    // Check 1: Phone drop vs Real fall
    if (detections.fallDetected || detections.violentMotion) {
      if (movementPattern === 'single_impact_no_rotation') {
        isValid = false;
        confidence = 0.4;
        reasoning = "Validation: Impact pattern resembles a simple phone drop rather than a human fall. Alert suppressed.";
      }
    }

    // Check 2: TV scream vs Real scream
    if (detections.screamProbability > 0.7) {
      if (context === 'home' && userInteraction === 'ignored') {
        isValid = false;
        confidence = 0.3;
        reasoning = "Validation: Audio matches screaming, but context implies TV/Media (home zone, no user reaction). Alert suppressed.";
      }
    }

    // Check 3: Campfire vs Dangerous fire
    if (detections.fireProbability > 0.5) {
      if (context === 'outdoors' && detections.smokeIncreasing === false) {
        isValid = false;
        confidence = 0.5;
        reasoning = "Validation: Fire detected outdoors but no increasing smoke/spread. Likely a controlled campfire. Alert suppressed.";
      }
    }

    // Check 4: Prank vs Emergency
    if (userInteraction === 'prank_history_detected' || userInteraction === 'immediate_dismiss') {
       isValid = false;
       confidence = 0.1;
       reasoning = "Validation: User behavior suggests a non-emergency or false alarm. Alert suppressed.";
    }

    return NextResponse.json({
      isValid,
      confidence,
      reasoning,
      filteredDetections: isValid ? detections : {}
    });

  } catch (error) {
    console.error('Validation Agent Error:', error);
    return NextResponse.json({ error: 'Failed to validate alert' }, { status: 500 });
  }
}
