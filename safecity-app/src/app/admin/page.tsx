'use client';

import { useState, useEffect } from 'react';
import { useAppStore, Incident } from '../../store/useAppStore';
import MapView from '../../components/MapView';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { useGeolocation } from '../../hooks/useGeolocation';
import IntelligenceStats from '../../components/IntelligenceStats';

export default function AdminDashboard() {
  const { incidents, initBackend, setIncidents, safetyScore, cityReasoning, citySeverity, vaultItems, resolveIncident, addVaultItem } = useAppStore();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'resolved'>('active');
  const { location } = useGeolocation();
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  useEffect(() => {
    initBackend();
  }, []);

  const filteredIncidents = incidents.filter(i => 
    filter === 'active' ? i.status === 'active' : i.status === 'resolved'
  );

  const selectedIncident = (incidents.find(i => i.id === selectedIncidentId) || filteredIncidents[0]) as Incident;

  const handleDispatch = () => {
    if (!location) {
      alert("SafeSphere: Waiting for high-accuracy GPS to find nearest units.");
      return;
    }
    setDispatchStatus("LOCATING NEAREST UNIT...");
    setTimeout(() => {
      const stations = ["MG Road Police Post", "Silk Board Traffic Command", "HSR Layout Fire Station 2", "Indiranagar Emergency Hub"];
      const nearest = stations[Math.floor(Math.random() * stations.length)];
      setDispatchStatus(`DISPATCHED: ${nearest}`);
      alert(`SafeSphere Dispatch: Unit from ${nearest} has been alerted to respond to your current GPS coordinates.`);
    }, 1500);
  };

  const handleAirBackup = () => {
    alert("SafeSphere TACTICAL: Aerial Drone Surveillance Dispatched. High-altitude visual link established at Incident Epicenter.");
  };

  const handleArchive = () => {
    if (selectedIncident) {
      resolveIncident(selectedIncident.id);
      alert(`SafeSphere: Incident ${selectedIncident.id.slice(-6)} has been officially archived.`);
      setSelectedIncidentId(null);
    }
  };

  const simulateAlert = async () => {
    const types: ("SOS" | "CRASH" | "FIRE" | "DISTRESS")[] = ["SOS", "CRASH", "FIRE", "DISTRESS"];
    const type = types[Math.floor(Math.random() * types.length)];
    const mockDetections = {
      screamProbability: type === "SOS" ? 0.92 : 0.1,
      fallDetected: type === "CRASH",
      fireProbability: type === "FIRE" ? 0.88 : 0.05,
      violentMotion: type === "DISTRESS" || type === "CRASH"
    };

    try {
      const valRes = await fetch('/api/agents/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detections: mockDetections, context: 'metropolitan' })
      });
      const validation = await valRes.json();

      const sevRes = await fetch('/api/agents/severity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detections: mockDetections, userStatus: 'unresponsive' })
      });
      const severity = await sevRes.json();

      const analysisStr = `SafeSphere AI Analysis: 
[SENSORS] ${type} trigger detected. 
[CONSENSUS] Multi-agent verification complete (${Math.round(validation.confidence * 100)}%). ${validation.reasoning}
[ACTION] Recommended Severity: ${severity.severity}.`;

      const newIncident = {
        id: 'sim-' + Date.now(),
        type,
        userId: "user_sim",
        userName: "IoT Sentinel",
        location: location || { lat: 12.9716, lng: 77.5946 },
        timestamp: new Date().toISOString(),
        riskScore: severity.score,
        status: "active" as const,
        severity: severity.severity as any,
        agentAnalysis: analysisStr
      };

      setIncidents([newIncident as any, ...incidents]);
      setSelectedIncidentId(newIncident.id);
    } catch (error) {
      console.error("Simulation failed", error);
    }
  };

  const generateTimeline = (incident: Incident) => {
    const steps = [
      { t: 'T+0s', label: 'Detection', desc: `Neural sensors identified ${incident.type} signature.` },
      { t: 'T+22s', label: 'Validation', desc: 'AI Agent Consensus achieved via cross-modal verification.' },
      { t: 'T+45s', label: 'Dispatch', desc: `Response protocols activated for ${incident.severity} threat.` }
    ];
    if (incident.status === 'resolved') {
      steps.unshift({ t: 'ARCHIVED', label: 'Resolution', desc: 'Incident resolved and archived by Chief Officer.' });
    } else {
      steps.unshift({ t: 'NOW', label: 'Monitoring', desc: 'System is tracking live updates for district safety.' });
    }
    return steps;
  };

  return (
    <div className="bg-white text-slate-900 font-sans h-screen flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full bg-white relative">
        <header className="h-16 flex justify-between items-center px-8 border-b border-slate-100 shrink-0 bg-white z-50">
          <div className="flex items-center gap-10 flex-1">
            <Link href="/" className="text-2xl font-black text-primary italic tracking-tighter uppercase">SafeSphere</Link>
            <div className="relative w-80 ml-4">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm">search</span>
              <input className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 pl-12 pr-4 text-xs font-medium focus:ring-2 focus:ring-primary/10 transition-all outline-none" placeholder="Search mission archives..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={simulateAlert}
              className="px-4 py-1.5 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              Simulate AI Alert
            </button>
            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center p-0.5 grayscale">
              <img alt="Chief" className="w-full h-full object-cover rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoIlb4cGCA5ma_DagLIuD4ayDJbOPIiY2OR0MVs7gdKCs34mEUYYB7jR7HzoRv6NgRhh3jP-YT_S7EpFllZQABTq5g8dW_T_Z9wX53vI3iOyoASVNPF_Ce-PF4FzHigj_3fI92wk9KqCnNRznyY2HGko1y-hJ7zGRCg4EsNn7BncfinXl8It-UtiIHDanoipuiKCHgGaYEsfVeNqqXVDCZebRUfhPX0jxRmtuAWMzc30x71Ad5B6STEQ7AlNFlrPrxVv8KQn2fGOB7"/>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <section className="w-[400px] border-r border-slate-100 flex flex-col bg-white shrink-0">
            <div className="p-8 pb-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tactical Feed</h2>
                <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-1.5">
                   <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[8px] font-black uppercase">Live Link</span>
                </div>
              </div>
              <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl mb-4">
                <button onClick={() => setFilter('active')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-[0.1em] rounded-lg transition-all ${filter === 'active' ? 'bg-white text-primary shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Active</button>
                <button onClick={() => setFilter('resolved')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-[0.1em] rounded-lg transition-all ${filter === 'resolved' ? 'bg-white text-primary shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Resolved</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4 custom-scrollbar">
              {filteredIncidents.length > 0 ? filteredIncidents.map((incident) => (
                <div key={incident.id} onClick={() => setSelectedIncidentId(incident.id)} className={`p-5 border-2 rounded-[24px] relative cursor-pointer transition-all active:scale-[0.97] ${selectedIncidentId === incident.id ? 'bg-white border-primary shadow-xl' : 'bg-white/50 border-transparent hover:border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`font-black text-[8px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded ${incident.severity === 'CRITICAL' ? 'bg-error text-white' : 'bg-primary/10 text-primary'}`}>{incident.severity}</span>
                    <span className="font-mono text-[9px] text-slate-300 font-bold">{new Date(incident.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <h3 className="font-black text-slate-800 text-xs mb-1 uppercase tracking-tight">{incident.type} ANOMALY</h3>
                  <p className="text-[10px] text-slate-500 mb-4 line-clamp-2 leading-relaxed italic opacity-80 font-medium">"{incident.agentAnalysis.split('\n')[0]}"</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                     <span className="text-[8px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded uppercase font-mono">D-GRID {incident.id.slice(-2)}</span>
                     <span className="text-[9px] font-black text-primary/40 tracking-widest">CONF: {incident.riskScore}%</span>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center opacity-10 flex flex-col items-center justify-center">
                   <span className="material-symbols-outlined text-6xl font-thin">inventory_2</span>
                   <p className="text-xs font-black uppercase tracking-[0.4em] mt-6">Dossier Locked</p>
                </div>
              )}
            </div>
          </section>

          <section className="flex-1 flex flex-col overflow-hidden bg-slate-50/10">
            {selectedIncident ? (
              <>
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] ${selectedIncident.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-primary text-white'}`}>{selectedIncident.severity} RESPONSE</span>
                      <span className="font-mono text-[9px] text-slate-300 font-bold uppercase border-l border-slate-100 pl-3">ID: {selectedIncident.id.slice(-8)}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{selectedIncident.type} COMMAND</h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleArchive} className="px-6 py-2 border border-slate-200 text-slate-400 text-[9px] font-black uppercase tracking-[0.1em] rounded-xl hover:bg-slate-50 shadow-sm transition-all">Archive Case</button>
                    <button onClick={handleDispatch} className="px-6 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.1em] rounded-xl shadow-xl shadow-slate-200 active:scale-95 transition-all hover:bg-black">{dispatchStatus || "Dispatch Units"}</button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  <IntelligenceStats />
                  <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8 space-y-8">
                      <div className="aspect-video bg-white rounded-[32px] relative overflow-hidden border-[8px] border-white shadow-2xl group ring-1 ring-slate-100">
                        <MapView />
                        <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 z-10 flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-error animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                           <span className="text-[9px] font-black text-white uppercase tracking-widest">Signal Epicenter Locked</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm">
                          <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-3"><span className="material-symbols-outlined text-sm">psychology</span>AI Agent Data</h4>
                          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl mb-6">
                            <p className="text-[11px] text-slate-600 font-bold leading-relaxed italic opacity-80">"{selectedIncident.agentAnalysis}"</p>
                          </div>
                          <div className="flex items-center justify-between px-2">
                             <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase">Confidence</span><span className="text-xl font-black text-slate-800">{selectedIncident.riskScore}%</span></div>
                             <div className="flex flex-col text-right"><span className="text-[8px] font-black text-slate-400 uppercase">Status</span><span className="text-sm font-black text-emerald-500 uppercase">{selectedIncident.status}</span></div>
                          </div>
                        </div>

                        <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm">
                          <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-3"><span className="material-symbols-outlined text-sm">hail</span>Tactical Matrix</h4>
                          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl mb-6 flex items-center justify-between">
                             <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-xl">local_police</span><span className="text-[10px] font-black uppercase text-slate-800">Unit Alpha Attached</span></div>
                             <span className="text-[8px] font-black text-primary animate-pulse">LIVE</span>
                          </div>
                          <button onClick={handleAirBackup} className="w-full py-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all hover:bg-black">Call Air Backup</button>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-4 space-y-8">
                      <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm">
                        <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-3"><span className="material-symbols-outlined text-sm">history</span> Case Timeline</h4>
                        <div className="relative pl-8 space-y-10 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
                          {generateTimeline(selectedIncident).map((step, idx) => (
                            <div key={idx} className="relative">
                              <span className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-lg ${idx === 0 ? 'bg-primary' : 'bg-slate-200'}`}></span>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{step.t}</p>
                              <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{step.label}</p>
                              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed opacity-60">{step.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm">
                        <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-primary mb-8 flex items-center gap-3"><span className="material-symbols-outlined text-sm">inventory_2</span>Linked Evidence</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {vaultItems.length > 0 ? vaultItems.slice(0, 3).map((item) => (
                             <div key={item.id} className="aspect-square bg-slate-900 rounded-[28px] overflow-hidden border-4 border-white shadow-2xl group relative cursor-pointer hover:scale-105 transition-transform">
                                {item.type.includes('video') ? (
                                   <video src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                   <img 
                                     src={item.url} 
                                     onError={(e) => {
                                       (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=300";
                                     }}
                                     className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                                     alt="vault" 
                                   />
                                )}
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <span className="material-symbols-outlined text-white text-xl font-black">play_circle</span>
                                </div>
                             </div>
                          )) : (
                            <div className="col-span-2 py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                               <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Dossier Locked</p>
                            </div>
                          )}
                          <input type="file" id="vault-attach-admin" hidden onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                addVaultItem({ id: 'user-attach-' + Date.now(), url, type: file.type, source: `Chief Attachment: ${selectedIncident.type}`, timestamp: new Date().toLocaleTimeString() });
                              }
                          }} />
                          <button onClick={() => document.getElementById('vault-attach-admin')?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"><span className="material-symbols-outlined text-sm font-black">add_a_photo</span></button>
                        </div>
                        <Link href="/vault" className="mt-6 block w-full py-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] text-center rounded-xl shadow-lg hover:bg-black transition-all">Access Cloud Vault ({vaultItems.length})</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-100">
                <span className="material-symbols-outlined text-[10rem] mb-6 font-thin opacity-30 animate-pulse">analytics</span>
                <p className="font-black uppercase tracking-[0.6em] text-xs text-slate-400">Tactical Hub Synchronized</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
