'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function SirenAlarm() {
  const { sosState, setSosState } = useAppStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let sirenInterval: any = null;
    let audioCtx: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;

    if (sosState === 'countdown' || sosState === 'active') {
      try {
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextCtor();
        oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'square';
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        
        let up = true;
        sirenInterval = setInterval(() => {
          if (audioCtx?.state === 'running') {
            oscillator?.frequency.setValueAtTime(up ? 800 : 400, audioCtx.currentTime);
            up = !up;
          }
        }, 500);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      } catch (e) {
        console.error("Audio playback failed", e);
      }
    }

    return () => {
      if (sirenInterval) clearInterval(sirenInterval);
      if (oscillator) {
        try { oscillator.stop(); } catch(e) {}
      }
      if (audioCtx) {
        try { audioCtx.close(); } catch(e) {}
      }
    };
  }, [sosState]);

  if (sosState === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Flashing Red Background */}
      <div className="absolute inset-0 bg-red-600/30 animate-[pulse_0.5s_ease-in-out_infinite]"></div>
      
      {/* Alarm Modal */}
      <div className="bg-red-600 text-white p-12 rounded-3xl shadow-2xl flex flex-col items-center justify-center animate-bounce pointer-events-auto border-4 border-white/50 backdrop-blur-md">
        <span className="material-symbols-outlined text-8xl mb-4">emergency</span>
        <h1 className="text-5xl font-black uppercase tracking-widest mb-2">Scream Detected</h1>
        <p className="text-xl font-bold opacity-90 mb-8">AI Validation: Confirmed Critical Threat</p>
        
        <button 
          onClick={() => {
            setSosState('idle');
            useAppStore.getState().setSafetyScore(10); // Reset safety score
          }}
          className="px-8 py-4 bg-white text-red-600 rounded-full font-black text-xl hover:bg-red-50 transition-colors shadow-lg active:scale-95"
        >
          DISMISS ALARM
        </button>
      </div>
    </div>
  );
}
