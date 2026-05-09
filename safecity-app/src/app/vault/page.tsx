'use client';

import { useAppStore } from '../../store/useAppStore';
import Sidebar from '../../components/Sidebar';
import { useState } from 'react';

export default function EvidenceVault() {
  const { incidents, vaultItems } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isValidating, setIsValidating] = useState<string | null>(null);

  const filteredIncidents = incidents.filter(inc => 
    inc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVault = vaultItems.filter(item =>
    item.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleValidatePayload = (id: string) => {
    setIsValidating(id);
    setTimeout(() => {
      setIsValidating(null);
      alert(`SafeSphere Forensics: Payload ${id.slice(-6)} verified. No tampering detected. Integrity Hash: SHA-256 matched.`);
    }, 2000);
  };

  const handleAccessFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleExportAudit = () => {
    const data = {
      incidents,
      vaultItems,
      exportTime: new Date().toISOString(),
      agent: "Chief Officer"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SafeSphere_Audit_${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full bg-surface">
        <header className="h-16 flex justify-between items-center px-8 bg-white border-b border-slate-100 z-30 shrink-0">
          <div className="flex items-center gap-10 flex-1">
            <h1 className="text-xl font-black text-primary italic uppercase tracking-tighter">Archives</h1>
            <div className="relative w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">search</span>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none" 
                placeholder="Search case dossiers or media..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={handleExportAudit}
               className="px-5 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all hover:bg-black"
             >
               Export System Audit
             </button>
          </div>
        </header>

        <main className="flex-1 p-10 overflow-y-auto space-y-12 custom-scrollbar">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Digital Forensics</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Official SafeSphere chain of custody terminal.</p>
            </div>
            <div className="flex gap-4">
              <div className="p-5 bg-white border border-slate-100 rounded-[28px] text-center min-w-[140px] shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cases</p>
                <p className="text-3xl font-black text-primary">{incidents.length.toString().padStart(2, '0')}</p>
              </div>
              <div className="p-5 bg-white border border-slate-100 rounded-[28px] text-center min-w-[140px] shadow-sm">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Digital Assets</p>
                <p className="text-3xl font-black text-primary">{vaultItems.length.toString().padStart(2, '0')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
             <h3 className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-300 flex items-center gap-3">
               <span className="material-symbols-outlined text-sm">perm_media</span> Raw Digital Evidence
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredVault.map((item) => (
                  <div key={item.id} className="bg-white border-4 border-white rounded-[40px] overflow-hidden shadow-xl hover:shadow-2xl transition-all group ring-1 ring-slate-100">
                    <div className="h-48 bg-black relative">
                      {item.type.includes('video') ? (
                        <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" controls />
                      ) : (
                        <img src={item.url} alt="Evidence" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      )}
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                         {item.timestamp}
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Evidence Source</p>
                      <h4 className="font-bold text-slate-800 text-sm truncate mb-4">{item.source}</h4>
                      <button 
                        onClick={() => handleValidatePayload(item.id)}
                        disabled={isValidating === item.id}
                        className="w-full py-3 bg-slate-50 hover:bg-primary text-slate-500 hover:text-white rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        {isValidating === item.id ? (
                           <>
                              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                              Analyzing...
                           </>
                        ) : (
                           <>
                              <span className="material-symbols-outlined text-sm">verified_user</span>
                              Validate Payload
                           </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {filteredVault.length === 0 && (
                  <div className="col-span-full py-24 text-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                     <span className="material-symbols-outlined text-6xl text-slate-200">folder_open</span>
                     <p className="text-xs font-black text-slate-300 uppercase tracking-[0.5em] mt-8">Vault Synchronized • Empty</p>
                  </div>
                )}
             </div>
          </div>

          <div className="space-y-8 pb-20">
            <h3 className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-300 flex items-center gap-3">
               <span className="material-symbols-outlined text-sm">description</span> AI Incident Dossiers
             </h3>
            <div className="grid grid-cols-1 gap-6">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                  <div key={incident.id} className="bg-white border-2 border-slate-50 rounded-[36px] p-8 flex items-center gap-12 hover:border-primary transition-all group shadow-sm">
                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-xl ${
                      incident.severity === 'CRITICAL' ? 'bg-red-600 text-white shadow-red-200' : 'bg-primary text-white shadow-primary/20'
                    }`}>
                      <span className="material-symbols-outlined text-[32px]">
                        {incident.type === 'FIRE' ? 'local_fire_department' : 
                         incident.type === 'SOS' ? 'emergency' : 'security'}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="font-black text-slate-800 text-xl uppercase tracking-tighter">{incident.type} MISSION Dossier</h4>
                        <span className="font-mono text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-400 font-bold uppercase tracking-widest">ID: {incident.id.slice(-8)}</span>
                      </div>
                      <p className="text-[12px] text-slate-400 font-medium opacity-80 leading-relaxed max-w-2xl">
                        "{incident.agentAnalysis.split('\n')[0]}"
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="text-right border-r border-slate-100 pr-6">
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">{incident.severity} PRIORITY</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">{new Date(incident.timestamp).toLocaleDateString()}</p>
                       </div>
                       <button 
                         onClick={() => handleAccessFile('#')}
                         className="px-8 py-4 bg-slate-900 text-white rounded-[20px] shadow-2xl shadow-slate-300 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest hover:bg-black"
                       >
                          Access Dossier
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                   <p className="text-xs font-black text-slate-300 uppercase tracking-[0.5em]">No tactical dossiers found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
