'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Camera, ShieldCheck, Clock, Info } from 'lucide-react';

import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function EvidenceVault() {
  const { vaultItems, addVaultItem, location } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const handleThermalAlert = async (e: any) => {
      console.warn("SafeSphere AI: Initiating Cloud Evidence Gathering...");
      startRecording();
    };

    const handleVaultArchive = (e: any) => {
      const { url, type, source, timestamp } = e.detail;
      addVaultItem({
        id: 'vault-' + Date.now() + Math.random(),
        url,
        type,
        source: source || 'Citizen Evidence',
        timestamp: timestamp || new Date().toLocaleTimeString()
      });
    };

    window.addEventListener('safesphere:thermal_alert', handleThermalAlert);
    window.addEventListener('safesphere:vault_archive', handleVaultArchive);
    return () => {
      window.removeEventListener('safesphere:thermal_alert', handleThermalAlert);
      window.removeEventListener('safesphere:vault_archive', handleVaultArchive);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      setIsRecording(true);
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        
        try {
          // 1. Upload AI Evidence to Cloud Storage
          const storageRef = ref(storage, `ai-evidence/${Date.now()}-thermal-auto.mp4`);
          const snapshot = await uploadBytes(storageRef, blob);
          const cloudUrl = await getDownloadURL(snapshot.ref);

          // 2. Log AI Incident to Firestore
          const aiCaseId = 'ai-case-' + Date.now();
          await addDoc(collection(db, 'ai_incidents'), {
            type: 'FIRE_THERMAL',
            location: location || { lat: 0, lng: 0 },
            timestamp: new Date().toISOString(),
            serverTimestamp: serverTimestamp(),
            evidenceUrl: cloudUrl,
            analysis: 'Automated AI Response: Critical Thermal Threshold Crossed. Video evidence secured.'
          });

          addVaultItem({
            id: 'vault-ai-' + Date.now(),
            url: cloudUrl,
            type: 'video/mp4',
            source: 'AI Auto-Capture: Fire/Thermal',
            timestamp: new Date().toLocaleTimeString()
          });
        } catch (err) {
          console.error("SafeSphere Cloud Sync Failed:", err);
        }
        
        setIsRecording(false);
        stopStream();
      };

      recorder.start();
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 5000);

    } catch (err) {
      console.error("SafeSphere: Camera access denied for evidence collection.", err);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <>
      {isRecording && (
        <div className="fixed top-24 right-8 z-[60] w-64 bg-black rounded-2xl border-4 border-error overflow-hidden shadow-2xl animate-pulse">
           <video ref={videoRef} autoPlay muted className="w-full h-40 object-cover" />
           <div className="p-3 flex items-center justify-between bg-error text-white">
             <span className="flex items-center gap-2 text-[10px] font-black uppercase">
               <Camera className="w-3 h-3 animate-bounce" /> AI Evidence Capture
             </span>
             <span className="text-[10px] font-mono font-bold">REC</span>
           </div>
        </div>
      )}

      {vaultItems.length > 0 && (
        <div className="bg-surface-container-lowest border-2 border-outline-variant/30 p-6 rounded-3xl mt-6 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-primary flex items-center gap-3 text-xs uppercase tracking-[0.15em]">
              <ShieldCheck className="w-5 h-5" /> Secure Evidence Vault
            </h3>
            <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-1 rounded uppercase">AES-256 Encrypted</span>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {vaultItems.map((item, idx) => (
              <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden group hover:border-primary/30 transition-all">
                <div className="relative h-32 bg-black">
                  {item.type.includes('video') ? (
                    <video src={item.url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img 
                      src={item.url} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&q=80&w=300";
                      }}
                      alt="Evidence" 
                      className="w-full h-full object-cover" 
                    />
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[8px] px-2 py-1 rounded-full uppercase font-black tracking-tighter flex items-center gap-1">
                    <Clock className="w-2 h-2" /> {item.timestamp}
                  </div>
                </div>
                <div className="p-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                     <Info className="w-3 h-3" /> Origin Source
                   </p>
                   <p className="text-xs font-bold text-slate-700 truncate">{item.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
