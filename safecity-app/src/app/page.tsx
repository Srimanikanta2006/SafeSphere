'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import MapView from '../components/MapView';
import Sidebar from '../components/Sidebar';
import ReportForm from '../components/ReportForm';
import EvidenceVault from '../components/EvidenceVault';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useGeolocation } from '../hooks/useGeolocation';
import { useMotionDetector } from '../hooks/useMotionDetector';
import { useThermalDetector } from '../hooks/useThermalDetector';
import { processSafetyQuery } from './actions/aiAssistant';

export default function SafeSphereHome() {
  const { initBackend, incidents, safetyScore, cityReasoning, citySeverity, setSosState } = useAppStore();
  const { isListening, startListening, stopListening } = useAudioAnalyzer();
  const { location } = useGeolocation();
  const { temperature } = useThermalDetector();
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [patrolAdvice, setPatrolAdvice] = useState<string | null>(null);

  useMotionDetector();

  useEffect(() => {
    return initBackend();
  }, []);

  const responders = Math.floor(incidents.length * 1.2) + 8;
  const crashes = incidents.filter(i => i.type === 'CRASH').length;
  const fires = incidents.filter(i => i.type === 'FIRE').length;

  const handleAdjustPatrols = async () => {
    setIsPatrolling(true);
    const incidentContext = incidents.map(i => `${i.type} at ${i.location.lat},${i.location.lng}: ${i.agentAnalysis}`).join('\n');
    const prompt = `Based on these active incidents, suggest exactly where to move 5 patrol units for maximum city safety: \n${incidentContext}`;
    try {
      const result = await processSafetyQuery(prompt, incidents);
      if (result.success) setPatrolAdvice(result.response);
      else setPatrolAdvice("AI Patrol Optimizer: Link busy. Increasing density near Zone Alpha.");
    } catch (e) {
      setPatrolAdvice("AI Patrol Optimizer: Move units to High-Risk Zone Alpha.");
    }
    setIsPatrolling(false);
  };

  const handleStreamGPS = () => {
    if (!location) { alert("SafeSphere: Waiting for GPS..."); return; }
    alert(`SafeSphere: Streaming coordinates [${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}]`);
  };

  return (
    <div className="bg-background text-on-background font-body-base overflow-hidden h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full bg-surface overflow-y-auto relative">
        <header className="sticky top-0 z-40 flex justify-between items-center px-8 py-4 bg-surface/60 backdrop-blur-xl border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-primary italic">Command Center</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/10">
              <span className={`material-symbols-outlined text-[18px] ${isListening ? 'text-error animate-pulse' : 'text-primary'}`}>{isListening ? 'mic' : 'sensors'}</span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">{isListening ? 'Active' : 'Secure'}</span>
            </div>
            <button onClick={() => setSosState('active')} className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-bold transition-all active:scale-95 shadow-sm">Quick SOS</button>
            <img alt="Chief" className="w-10 h-10 rounded-full border border-outline-variant/30 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPhjKcZx33EPrviS203d7R9G8tVEchvexuB-REjWirHLIbkOg2wfZhAvv0WM6fLLgdExETK0Q-d3iD9yvC0Qi6OF2i9dLX0RMUjlt3WPp2CxR1gSAi8Y9MsIsY_l2ycSf5zRmuRJyiQF5XOW3wa9wa2W3ctZo6fZwbWeBAfnxRPdF71vJDhdzZcg_146qsTd0G7mBz-_dHcz1cty1CWq_QNxl2isWml91zls_ayDzzoLb94oRN5CopeNamqN3U69uvfxNH_T0_iZ6_" />
          </div>
        </header>

        <div className="p-8">
          <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex flex-wrap gap-4">
                <div className="bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-mono text-[10px] text-on-surface uppercase text-black">AI ONLINE</span>
                </div>
                <div className="bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[16px]">location_searching</span>
                  <span className="font-mono text-[10px] text-on-surface text-black">
                    {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'LOCATING...'}
                  </span>
                </div>
                <div className="bg-secondary-container px-3 py-1.5 rounded-full flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-on-secondary-container tracking-widest">{temperature ? `${temperature}°C` : '--'} SYSTEM TEMP</span>
                </div>
              </div>
            </div>
            <button onClick={isListening ? stopListening : startListening} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:brightness-110 active:scale-95 border ${isListening ? 'bg-error text-white animate-pulse' : 'bg-white text-primary border-outline-variant/30'}`}>
              <span className="material-symbols-outlined">{isListening ? 'mic' : 'mic_off'}</span>
              {isListening ? 'Listening' : 'Start Mic Agent'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-1">
            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-1">
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl flex flex-col justify-between h-36 shadow-sm">
                <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">Incidents</span>
                <div className="text-5xl font-black text-primary">{incidents.length.toString().padStart(2, '0')}</div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl flex flex-col justify-between h-36 shadow-sm">
                <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">Risk Score</span>
                <div>
                  <div className="text-5xl font-black text-primary">{safetyScore}%</div>
                  <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${safetyScore}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl flex flex-col justify-between h-36 shadow-sm">
                <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">Responders</span>
                <div className="text-5xl font-black text-primary">{responders}</div>
              </div>

              <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-outline-variant/10 bg-slate-50/50">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">sensors</span> Neural Stream
                  </h3>
                </div>
                <div className="p-0 max-h-[190px] overflow-y-auto custom-scrollbar">
                  {incidents.length > 0 ? incidents.slice().reverse().map((incident) => (
                    <div key={incident.id} className="p-4 border-b border-outline-variant/10 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between mb-1">
                        <span className={`font-black text-[9px] uppercase tracking-widest ${incident.severity === 'CRITICAL' ? 'text-error' : 'text-primary'}`}>
                          {incident.type}
                        </span>
                        <span className="font-mono text-[9px] opacity-40">{new Date(incident.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-on-surface text-xs line-clamp-1 opacity-80 italic">"{incident.agentAnalysis.split('\n')[0]}"</p>
                    </div>
                  )) : (
                    <div className="py-12 text-center opacity-20">
                      <span className="material-symbols-outlined text-3xl font-thin">radar</span>
                      <p className="text-[9px] font-black uppercase tracking-widest mt-2">Zero Anomalies</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-primary text-on-primary p-6 rounded-2xl flex flex-col justify-between shadow-xl shadow-primary/10 h-full min-h-[10rem]">
                <div>
                  <div className="flex items-center gap-2 mb-4 opacity-70">
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                    <span className="font-black text-[9px] tracking-widest uppercase">SafeSphere Brain</span>
                  </div>
                  {patrolAdvice ? (
                    <p className="text-xs font-bold leading-relaxed border-l-2 border-white/50 pl-3">"{patrolAdvice}"</p>
                  ) : (
                    <p className="text-sm font-bold leading-tight line-clamp-2">{cityReasoning}</p>
                  )}
                </div>
                <button onClick={handleAdjustPatrols} disabled={isPatrolling} className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                  {isPatrolling ? 'Thinking...' : 'Adjust Patrols'}
                </button>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden h-52 relative group shadow-sm">
                <MapView />
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md p-2 rounded-lg z-10">
                  <p className="text-white font-black text-[9px] uppercase tracking-widest">Tactical View</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] font-black uppercase block mb-1 opacity-50">Crashes</span>
                  <span className="text-xl font-bold text-primary">{crashes.toString().padStart(2, '0')}</span>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] font-black uppercase block mb-1 opacity-50">Fires</span>
                  <span className="text-xl font-bold text-primary">{fires.toString().padStart(2, '0')}</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm">
                <h3 className="font-black text-[10px] text-primary mb-4 uppercase tracking-[0.2em]">Overrides</h3>
                <div className="space-y-2">
                  <button onClick={() => setSosState('active')} className="w-full text-left px-4 py-3 bg-error text-white rounded-xl flex items-center justify-between hover:brightness-110 transition-all shadow-md active:scale-95">
                    <span className="flex items-center gap-3 font-black text-[10px] uppercase">
                      <span className="material-symbols-outlined text-sm">emergency_share</span> Trigger SOS
                    </span>
                    <span className="material-symbols-outlined text-white/50 text-sm">chevron_right</span>
                  </button>
                  <ReportForm>
                    <button className="w-full text-left px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-primary/5 transition-all group">
                      <span className="flex items-center gap-3 font-black text-[10px] text-primary uppercase">
                        <span className="material-symbols-outlined text-sm">report_gmailerrorred</span> Report Hazard
                      </span>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-all text-sm">chevron_right</span>
                    </button>
                  </ReportForm>
                  <button onClick={handleStreamGPS} className="w-full text-left px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-primary/5 transition-all group">
                    <span className="flex items-center gap-3 font-black text-[10px] text-primary uppercase">
                      <span className="material-symbols-outlined text-sm">share_location</span> Stream GPS
                    </span>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-all text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
              <EvidenceVault />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
