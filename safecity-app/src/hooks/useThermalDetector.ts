'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useThermalDetector() {
  const { setSosState, updateDetections } = useAppStore();
  const [temperature, setTemperature] = useState<number | null>(null);
  const isTriggered = useRef(false);

  useEffect(() => {
    // Battery Status API for temperature proxy
    const monitorBattery = async () => {
      try {
        const battery: any = await (navigator as any).getBattery();
        
        const checkTemp = () => {
          // battery.temperature is not standard on all browsers, 
          // so we supplement with a simulation for demo if missing
          const currentTemp = battery.temperature || 30; 
          setTemperature(currentTemp);

          // Threshold: 45 degrees Celsius (Critical for mobile devices)
          if (currentTemp > 45 && !isTriggered.current) {
            console.warn("SafeSphere: Critical Thermal Threshold Crossed!");
            isTriggered.current = true;
            
            // Trigger AI Pipeline
            updateDetections({ highTemperature: true, value: currentTemp });
            
            // This will trigger the Camera evidence recorder in page.tsx
            window.dispatchEvent(new CustomEvent('safesphere:thermal_alert', { 
              detail: { temp: currentTemp } 
            }));
          }
        };

        battery.addEventListener('temperaturechange', checkTemp);
        const interval = setInterval(checkTemp, 10000); // Check every 10s

        return () => {
          battery.removeEventListener('temperaturechange', checkTemp);
          clearInterval(interval);
        };
      } catch (e) {
        // Fallback for browsers without Battery API
      }
    };

    monitorBattery();
  }, []);

  return { temperature };
}
