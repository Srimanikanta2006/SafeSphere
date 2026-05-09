'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import MapView from '../../components/MapView';
import Sidebar from '../../components/Sidebar';
import IntelligenceStats from '../../components/IntelligenceStats';
import { useGeolocation } from '../../hooks/useGeolocation';

export default function LiveMapPage() {
  const { initBackend, cityReasoning, citySeverity, setSosState } = useAppStore();
  const { location } = useGeolocation();
  const [layers, setLayers] = useState({
    crime: true,
    accidents: true,
    fire: true,
    responders: true,
    lighting: false
  });
  const [minSeverity, setMinSeverity] = useState('All');
  const [mapCommand, setMapCommand] = useState<any>(null);

  useEffect(() => {
    initBackend();
  }, []);

  const sendCommand = (type: string, payload?: any) => {
    setMapCommand({ type, payload, timestamp: Date.now() });
  };

  return (
    <div className="bg-background text-on-surface overflow-hidden h-screen flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full bg-surface relative">
        <header className="h-16 flex justify-between items-center px-8 bg-surface/60 backdrop-blur-xl border-b border-outline-variant/30 z-30">
          <div className="flex items-center gap-4">
             <span className="text-xl font-bold text-primary italic">Live Tactical Map</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSosState('active')}
              className="px-6 py-2 bg-error text-white font-black rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(186,26,26,0.3)] uppercase text-xs tracking-widest"
            >
              Quick SOS
            </button>
            <img alt="Chief" className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPhjKcZx33EPrviS203d7R9G8tVEchvexuB-REjWirHLIbkOg2wfZhAvv0WM6fLLgdExETK0Q-d3iD9yvC0Qi6OF2i9dLX0RMUjlt3WPp2CxR1gSAi8Y9MsIsY_l2ycSf5zRmuRJyiQF5XOW3wa9wa2W3ctZo6fZwbWeBAfnxRPdF71vJDhdzZcg_146qsTd0G7mBz-_dHcz1cty1CWq_QNxl2isWml91zls_ayDzzoLb94oRN5CopeNamqN3U69uvfxNH_T0_iZ6_"/>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <MapView layers={layers} minSeverity={minSeverity} externalCommand={mapCommand} />
          </div>

          {/* Floating Layer Controls */}
          <div className="absolute top-6 left-6 z-20 w-72 space-y-4">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-2xl">
              <h3 className="font-black text-primary mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">layers</span> Signal Layers
              </h3>
              <div className="space-y-4">
                {Object.entries(layers).map(([key, val]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[11px] font-black text-on-surface-variant group-hover:text-primary transition-colors uppercase tracking-wider">{key.replace('_', ' ')}</span>
                    <div 
                      onClick={() => setLayers(prev => ({ ...prev, [key]: !val }))}
                      className={`w-10 h-5 rounded-full relative transition-all ${val ? 'bg-primary shadow-[0_0_10px_rgba(94,83,70,0.3)]' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${val ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-primary p-6 rounded-3xl shadow-2xl space-y-4 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white text-[18px]">psychology</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Neural Link</span>
              </div>
              <p className="text-xl font-black text-white uppercase tracking-tight line-clamp-1">{citySeverity} STATUS</p>
              <p className="text-[10px] text-white/70 font-medium leading-relaxed italic line-clamp-2">"{cityReasoning}"</p>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">
            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 flex flex-col shadow-xl">
              <button onClick={() => sendCommand('zoomIn')} className="p-3 hover:bg-primary/10 rounded-xl transition-colors text-primary">
                <span className="material-symbols-outlined font-black">add</span>
              </button>
              <div className="h-[1px] bg-slate-100 my-1 mx-2"></div>
              <button onClick={() => sendCommand('zoomOut')} className="p-3 hover:bg-primary/10 rounded-xl transition-colors text-primary">
                <span className="material-symbols-outlined font-black">remove</span>
              </button>
            </div>
            <button onClick={() => location && sendCommand('recenter', location)} className="bg-primary text-white p-3.5 rounded-2xl shadow-xl hover:brightness-110 active:scale-90 transition-all flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined font-black">my_location</span>
            </button>
          </div>

          {/* Center Stats Overlay - High Visibility, Spacious */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-4xl px-12">
             <div className="pointer-events-auto bg-white/95 border-2 border-primary shadow-2xl rounded-3xl p-6">
                <IntelligenceStats />
             </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-auto max-w-lg">
            <div className="bg-white/90 backdrop-blur-2xl px-10 py-4 rounded-full border border-white/40 shadow-2xl flex items-center gap-10 whitespace-nowrap overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-error animate-pulse shadow-[0_0_10px_rgba(186,26,26,0.5)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Emergency</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Safe Hubs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
