'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from './ui/sheet';
import { Button } from './ui/button';
import { TriangleAlert, Camera, MapPin, X, Loader2 } from 'lucide-react';

import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ReportFormProps {
  children?: React.ReactNode;
}

export default function ReportForm({ children }: ReportFormProps) {
  const { location } = useGeolocation();
  const { setReports, reports, userId, addVaultItem } = useAppStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [type, setType] = useState<"POTHOLE" | "UNSAFE_ROAD" | "LOW_LIGHT" | "SUSPICIOUS">('POTHOLE');
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState('');
  
  // Media State
  const [mediaFiles, setMediaFiles] = useState<{ file: File; url: string; type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      setMediaFiles(prev => [...prev, { file, url, type: file.type }]);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert("SafeSphere: Waiting for high-accuracy GPS signal...");
      return;
    }

    const reportId = 'report-' + Date.now();
    
    // 1. OPTIMISTIC UPDATE: Add to UI & Vault instantly
    const localMedia = mediaFiles.map(m => ({ url: m.url, type: m.type }));
    
    const finalReport = {
      id: reportId,
      type,
      userId,
      location: { lat: location.lat, lng: location.lng },
      severity,
      notes,
      timestamp: new Date().toISOString(),
      status: "pending" as const,
      upvotes: 0,
      media: localMedia
    };

    // Add to dashboard feed
    setReports([finalReport, ...reports]);

    // Add to digital vault
    localMedia.forEach((media, idx) => {
      addVaultItem({
        id: `vault-${reportId}-${idx}`,
        url: media.url,
        type: media.type,
        source: `Report: ${type}`,
        timestamp: new Date().toLocaleTimeString()
      });
    });

    // 2. CLOSE FORM IMMEDIATELY
    setIsOpen(false);
    setMediaFiles([]);
    setNotes('');

    // 3. BACKGROUND CLOUD SYNC: Don't make the user wait
    (async () => {
      try {
        console.log("SafeSphere: Background Cloud Sync Initiated...");
        
        const uploadedMedia = await Promise.all(
          mediaFiles.map(async (media) => {
            const storageRef = ref(storage, `evidence/${Date.now()}-${media.file.name}`);
            const snapshot = await uploadBytes(storageRef, media.file);
            return { url: await getDownloadURL(snapshot.ref), type: media.type };
          })
        );

        await addDoc(collection(db, 'reports'), {
          ...finalReport,
          serverTimestamp: serverTimestamp(),
          media: uploadedMedia
        });
        
        // Update local store with permanent cloud URLs
        useAppStore.getState().syncReportToCloud(reportId, uploadedMedia);
        
        console.log("SafeSphere: Background Cloud Sync Complete.");
      } catch (cloudError) {
        console.warn("SafeSphere: Background Sync Failed (System remains in local mode).", cloudError);
      }
    })();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children ? children : (
          <Button 
            className="fixed bottom-6 left-6 z-50 rounded-full h-14 w-14 shadow-lg bg-amber-500 hover:bg-amber-600 border-2 border-white"
            size="icon"
          >
            <TriangleAlert className="h-6 w-6 text-white" />
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent side="bottom" className="rounded-t-3xl h-[90vh] sm:h-[700px] flex flex-col border-t-4 border-amber-500">
        <SheetHeader className="pb-4 border-b border-slate-100">
          <SheetTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <TriangleAlert className="text-amber-500 w-6 h-6" />
            Lodge Citizen Report
          </SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Securely report infrastructure hazards or safety threats to the SafeSphere network.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-6 flex-1 overflow-y-auto pb-6">
          {/* Issue Type Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Hazard Classification</label>
            <div className="grid grid-cols-2 gap-2">
              {['POTHOLE', 'UNSAFE_ROAD', 'LOW_LIGHT', 'SUSPICIOUS'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t as any)}
                  disabled={isUploading}
                  className={`p-4 text-xs font-black rounded-xl border-2 transition-all active:scale-95 ${
                    type === t 
                    ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200' 
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-amber-200'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Slider */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex justify-between">
              Criticality Index <span>LEVEL {severity}/5</span>
            </label>
            <div className="px-2">
               <input 
                type="range" 
                min="1" max="5" 
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                disabled={isUploading}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Contextual Intelligence</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isUploading}
              placeholder="Describe the hazard in detail for AI analysis..."
              className="w-full min-h-[120px] p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:border-amber-500 focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Media Capture Section */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 text-black">Visual Evidence (Photo/Video)</label>
            <div className="flex flex-wrap gap-3">
              {mediaFiles.map((file, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-100 bg-black group">
                  {file.type.includes('video') ? (
                    <video src={file.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={file.url} alt="Evidence" className="w-full h-full object-cover" />
                  )}
                  {!isUploading && (
                    <button 
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow-lg hover:bg-white transition-colors"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <span className="text-[8px] text-white font-black uppercase tracking-tighter">Verified</span>
                  </div>
                </div>
              ))}
              
              <input 
                type="file" 
                accept="image/*,video/*" 
                multiple 
                hidden 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              
              {!isUploading && (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-amber-500 hover:text-amber-500 transition-all bg-slate-50/50"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase">Add Media</span>
                </button>
              )}
            </div>
          </div>

          {/* Location Bar */}
          <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1">Geospatial Lock</p>
                <p className="text-xs font-mono text-emerald-600 font-bold">
                  {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'ACQUIRING SIGNAL...'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-500 animate-pulse">ACTIVE</span>
          </div>

          <button 
            type="submit" 
            disabled={!location || isUploading}
            className="w-full h-16 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Archiving to SafeSphere Vault...
              </>
            ) : (
              'Finalize & Store Report'
            )}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
