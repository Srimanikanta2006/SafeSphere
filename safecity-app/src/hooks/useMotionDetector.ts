import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useMotionDetector() {
  const { updateDetections, setSosState, setSafetyScore } = useAppStore();
  const lastUpdate = useRef(0);

  useEffect(() => {
    const handleMotion = async (event: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - lastUpdate.current < 200) return; // Sample at 5Hz
      lastUpdate.current = now;

      const accel = {
        x: event.accelerationIncludingGravity?.x || 0,
        y: event.accelerationIncludingGravity?.y || 0,
        z: event.accelerationIncludingGravity?.z || 0
      };

      // Calculate magnitude of acceleration
      const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
      
      // Jerk Detection (Sudden spike > 25 m/s^2 indicates violent motion or impact)
      if (magnitude > 25) {
        console.warn("SafeSphere: Sudden Jerk Detected! Triggering Emergency Protocol.");
        setSafetyScore(90);
        setSosState('active');
        updateDetections({ violentMotion: true, impactMagnitude: magnitude });
      }

      const gyro = {
        x: event.rotationRate?.alpha || 0,
        y: event.rotationRate?.beta || 0,
        z: event.rotationRate?.gamma || 0
      };

      // Stream to Python Backend
      try {
        await fetch('http://localhost:8000/sensor-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accel,
            gyro,
            timestamp: new Date().toISOString()
          })
        });
      } catch (err) {
        // Fallback or silent fail if backend is down
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);
}
