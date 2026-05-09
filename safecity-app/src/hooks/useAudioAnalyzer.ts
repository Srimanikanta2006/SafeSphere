import { useState, useEffect, useRef } from 'react';
import Meyda from 'meyda';
import { useAppStore } from '@/store/useAppStore';

export function useAudioAnalyzer() {
  const [isListening, setIsListening] = useState(false);
  const { setSosState, setSafetyScore } = useAppStore();
  const audioContext = useRef<AudioContext | null>(null);
  const analyzer = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastProcessingTime = useRef(0);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      // YAMNet expects 16kHz
      audioContext.current = new AudioContextCtor({ sampleRate: 16000 });
      const source = audioContext.current.createMediaStreamSource(stream);

      analyzer.current = Meyda.createMeydaAnalyzer({
        audioContext: audioContext.current,
        source: source,
        bufferSize: 16384, // ~1 second at 16kHz
        featureExtractors: ['rms', 'spectralCentroid', 'zcr', 'spectralFlatness'],
        callback: async (features: any) => {
          if (!features) return;
          
          const { rms, spectralCentroid, zcr, spectralFlatness } = features;
          
          // 1. Local Heuristic Filter (Efficiency)
          // Screams are loud (rms > 0.1), bright (centroid > 2000), and noisy (flatness > 0.2)
          if (rms > 0.1 && (spectralCentroid > 2000 || spectralFlatness > 0.2)) {
            const now = Date.now();
            if (now - lastProcessingTime.current < 1500) return; // Don't spam backend
            lastProcessingTime.current = now;

            console.log('Local heuristic hit. Sending to AI Brain for classification...');

            // 2. Extract raw buffer for YAMNet
            const audioData = analyzer.current._source.context.createBufferSource(); // This is just for context
            // In a real implementation, we'd use a ScriptProcessor or AudioWorklet to get raw Float32 data
            // For this implementation, we'll use the buffer Meyda is already processing
            const rawData = analyzer.current.get('buffer'); 
            
            if (rawData) {
               sendToBackendAI(rawData);
            }
          }
        }
      });
      
      analyzer.current.start();
      setIsListening(true);
      initSpeechRecognition();

    } catch (err) {
      console.error('Failed to get microphone', err);
    }
  };

  const sendToBackendAI = async (buffer: Float32Array) => {
    try {
      // Convert Float32Array to Base64
      const byteArray = new Uint8Array(buffer.buffer);
      let binary = '';
      const len = byteArray.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(byteArray[i]);
      }
      const base64Audio = window.btoa(binary);

      const response = await fetch('http://localhost:8000/process-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio })
      });

      const result = await response.json();
      
      if (result.status === 'detected') {
        console.warn(`AI Agent Consensus: ${result.event} detected with ${Math.round(result.confidence * 100)}% confidence.`);
        
        // Final logic: Trigger Alarm if YAMNet confirms a scream or distress
        if (['Screaming', 'Shout', 'Siren'].includes(result.event)) {
           setSafetyScore(95);
           setSosState('active');
        }
      }
    } catch (e) {
      console.error("AI Audio Classification failed", e);
    }
  };

  const recognitionRef = useRef<any>(null);

  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript.toLowerCase())
        .join('');
      
      if (transcript.includes('help') || transcript.includes('emergency') || transcript.includes('police')) {
        console.warn('Distress keyword detected!');
        setSafetyScore(100);
        setSosState('active');
      }
    };
    recognition.start();
  };

  const stopListening = () => {
    if (analyzer.current) analyzer.current.stop();
    if (audioContext.current) audioContext.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  return { isListening, startListening, stopListening };
}
