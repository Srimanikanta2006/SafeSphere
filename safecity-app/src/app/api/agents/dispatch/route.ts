import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      severity,
      riskScore,
      userProfile,
      location
    } = body;

    // Dispatch Agent - Decide who to alert, when, how aggressively.
    let actions: string[] = [];
    let responseType = "MONITORING"; // Default

    // Decision Logic
    if (severity === 'CRITICAL') {
      responseType = "IMMEDIATE_EMERGENCY_RESPONSE";
      actions = [
        "call_ambulance",
        "contact_police",
        "notify_family",
        "trigger_live_recording",
        "alert_nearby_volunteers"
      ];
    } else if (severity === 'HIGH') {
      responseType = "URGENT_ALERT";
      actions = [
        "notify_user",
        "notify_family",
        "trigger_live_recording",
        "alert_nearby_volunteers"
      ];
    } else if (severity === 'MODERATE') {
      responseType = "WARNING";
      actions = [
        "notify_user",
        "monitor_sensors_intensely"
      ];
    } else {
      // LOW
      actions = [
        "log_event"
      ];
    }

    return NextResponse.json({
      responseType,
      actions,
      nextStep: severity === 'LOW' ? "CONTINUE_MONITORING" : "INITIATE_WORKFLOW",
      orchestration: {
        familyNotified: actions.includes('notify_family'),
        emergencyServicesAlerted: actions.includes('contact_police') || actions.includes('call_ambulance')
      }
    });

  } catch (error) {
    console.error('Dispatch Agent Error:', error);
    return NextResponse.json({ error: 'Failed to orchestrate dispatch' }, { status: 500 });
  }
}
