import math
import logging
from datetime import datetime
from typing import List, Dict
from app.config import config

logger = logging.getLogger("ValidationEngine")

class ValidationEngine:
    def __init__(self):
        self.motion_buffer = []
        self.last_event_time = {}

    def process_motion(self, accel: Dict[str, float], gyro: Dict[str, float]):
        """
        Calculate acceleration magnitude and jerk.
        a = sqrt(x² + y² + z²)
        """
        ax, ay, az = accel.get('x', 0), accel.get('y', 0), accel.get('z', 0)
        magnitude = math.sqrt(ax**2 + ay**2 + az**2)
        
        # Calculate Jerk (simple delta)
        jerk = 0
        if self.motion_buffer:
            prev_mag = self.motion_buffer[-1]['magnitude']
            jerk = abs(magnitude - prev_mag)

        current_sample = {
            "magnitude": magnitude,
            "jerk": jerk,
            "timestamp": datetime.now().isoformat()
        }
        
        self.motion_buffer.append(current_sample)
        if len(self.motion_buffer) > config.MOTION_BUFFER_SIZE:
            self.motion_buffer.pop(0)

        # Detection Logic
        if magnitude > config.ACCELERATION_THRESHOLD or jerk > config.JERK_THRESHOLD:
            return {
                "type": "motion",
                "event": "violent_impact" if magnitude > 35 else "sudden_jerk",
                "acceleration": magnitude,
                "jerk": jerk,
                "timestamp": current_sample['timestamp']
            }
        
        return None

    def calculate_severity(self, events: List[Dict]):
        """
        Multimodal point-based scoring system.
        """
        score = 0
        recent_events = events[-10:] # Look at last 10 events
        
        types_detected = set(e.get('type') for e in recent_events)
        event_names = [e.get('event') for e in recent_events]

        # Basic Points
        if 'Screaming' in event_names: score += config.POINTS_SCREAM
        if 'Shout' in event_names: score += 15
        if 'violent_impact' in event_names: score += config.POINTS_CRASH
        
        # Fire/Smoke logic
        fire_events = [e for e in recent_events if e.get('fire_detected')]
        if fire_events:
            score += config.POINTS_FIRE

        # Correlations (Multimodal Escalation)
        if 'audio' in types_detected and 'motion' in types_detected:
            score += 20 # Scream + Impact
        
        if 'audio' in types_detected and fire_events:
            score += 30 # Scream + Fire

        # Repeated Events
        scream_count = event_names.count('Screaming')
        if scream_count > 1:
            score += config.POINTS_REPEATED_SCREAM

        # Severity Mapping
        level = "LOW"
        reasoning = "System normal. Baseline anomalies are within safe thresholds."
        
        if score >= 86: 
            level = "CRITICAL"
            reasoning = "CRITICAL: Multiple high-risk agents in consensus. Immediate multimodal threat verified."
        elif score >= 61: 
            level = "HIGH"
            reasoning = "HIGH: Significant anomalies detected. High probability of emergency. Unified response recommended."
        elif score >= 31: 
            level = "MODERATE"
            reasoning = "MODERATE: Persistent anomalies detected. System monitoring for escalation."

        # Add specific insights
        if 'audio' in types_detected and fire_events:
            reasoning += " (Cross-Agent Alert: Audio Distress + Visual Fire Signature)"
        elif 'audio' in types_detected and 'motion' in types_detected:
            reasoning += " (Cross-Agent Alert: Audio Distress + Sudden Impact)"

        return {"level": level, "score": score, "reasoning": reasoning}
