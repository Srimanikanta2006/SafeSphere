'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAppStore } from '../store/useAppStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { vaultItems, incidents } = useAppStore();

  const links = [
    { name: 'Command Center', icon: 'dashboard', href: '/' },
    { name: 'Live Map', icon: 'map', href: '/map' },
    { name: 'Incidents', icon: 'warning', href: '/admin' },
    { name: 'AI Assistant', icon: 'smart_toy', href: '/ai' },
    { name: 'Evidence Vault', icon: 'inventory_2', href: '/vault' },
  ];

  return (
    <aside className="h-full w-72 z-50 flex flex-col bg-slate-50 border-r border-slate-200 shrink-0">
      <div className="p-8 pb-4">
        <h2 className="text-2xl font-black text-primary italic tracking-tight">SafeSphere</h2>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black opacity-70 mt-1">Intelligence Hub</p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <Link 
            key={link.href}
            href={link.href}
            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all active:scale-95 ${pathname === link.href ? 'bg-primary text-white font-bold shadow-lg' : 'text-on-surface-variant hover:bg-surface-container-high/50'}`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">{link.icon}</span>
              <span className="text-sm">{link.name}</span>
            </div>
            {link.name === 'Evidence Vault' && vaultItems.length > 0 && (
               <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${pathname === link.href ? 'bg-white text-primary' : 'bg-primary text-white animate-pulse'}`}>
                 {vaultItems.length}
               </span>
            )}
          </Link>
        ))}
      </nav>
      
      {/* Evidence Vault Preview in Sidebar */}
      <div className="px-4 pb-4">
        <div className="bg-surface-container-high p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
          <p className="text-[9px] font-black uppercase text-on-surface-variant opacity-60 mb-3 tracking-widest">Active Vault Hub</p>
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold">Digital Assets</span>
                <span className="text-[10px] font-mono font-black text-primary">{vaultItems.length.toString().padStart(2, '0')}</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold">AI Cases</span>
                <span className="text-[10px] font-mono font-black text-primary">{incidents.length.toString().padStart(2, '0')}</span>
             </div>
             <div className="h-1.5 w-full bg-surface-container rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: vaultItems.length > 0 ? '100%' : '10%' }}></div>
             </div>
             <p className="text-[8px] text-on-surface-variant opacity-40 font-medium italic mt-2">Chain of custody is secured via SafeSphere Neural Core.</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-outline-variant/30 space-y-1">
        <div className="bg-surface-container p-4 rounded-xl mb-4">
          <p className="text-[9px] font-bold uppercase text-on-surface-variant opacity-60 mb-2">System Health</p>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold">Neural Core</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold">Agents Sync</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
        </div>
        <Link className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high/50 rounded-lg" href="/login">
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm">Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
