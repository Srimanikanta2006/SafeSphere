'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import MapView from '../../components/MapView';
import { processSafetyQuery } from '../actions/aiAssistant';
import Sidebar from '../../components/Sidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantPage() {
  const { incidents, safetyScore, initBackend, setSosState } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Good afternoon, Chief. SafeSphere Intelligence Hub is online. I am monitoring all district telemetry. How can I assist you with tactical analysis today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiMarkers, setAiMarkers] = useState<Array<{lat: number, lng: number, label: string}>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initBackend();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Logic to parse [[MAP_MARKER: lat, lng, label]] from AI string
  const parseMarkers = (text: string) => {
    const markerRegex = /\[\[MAP_MARKER:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+),\s*(.*?)\]\]/g;
    let match;
    const newMarkers = [...aiMarkers];
    while ((match = markerRegex.exec(text)) !== null) {
      newMarkers.push({
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2]),
        label: match[3].trim()
      });
    }
    if (newMarkers.length !== aiMarkers.length) {
      setAiMarkers(newMarkers);
    }
    return text.replace(markerRegex, '').trim(); // Remove tag from display text
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    const cityState = {
      incidents: incidents.slice(-5), 
      safetyScore: safetyScore || 12
    };

    try {
      const result = await processSafetyQuery(userMsg, cityState);
      setIsThinking(false);
      
      if (result.success) {
        const cleanText = parseMarkers(result.response);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: cleanText
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Chief, I'm experiencing a neural link interruption. Please verify terminal credentials." }]);
      }
    } catch (e) {
      setIsThinking(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Critical system link failure." }]);
    }
  };

  return (
    <div className="bg-white text-slate-900 font-sans h-screen flex overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* 1. Header - Flush with sidebar */}
        <header className="h-16 flex justify-between items-center px-8 border-b border-slate-100 shrink-0 bg-white z-50">
          <div className="flex items-center gap-10 flex-1">
            <h1 className="text-xl font-black text-primary italic tracking-tighter uppercase">Intelligence Hub</h1>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-black uppercase tracking-widest">SafeSphere AI Live</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSosState('active')}
              className="px-6 py-2 bg-error text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-error/20 uppercase text-[10px] tracking-widest"
            >
              Quick SOS
            </button>
            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner grayscale">
              <img alt="Chief" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoIlb4cGCA5ma_DagLIuD4ayDJbOPIiY2OR0MVs7gdKCs34mEUYYB7jR7HzoRv6NgRhh3jP-YT_S7EpFllZQABTq5g8dW_T_Z9wX53vI3iOyoASVNPF_Ce-PF4FzHigj_3fI92wk9KqCnNRznyY2HGko1y-hJ7zGRCg4EsNn7BncfinXl8It-UtiIHDanoipuiKCHgGaYEsfVeNqqXVDCZebRUfhPX0jxRmtuAWMzc30x71Ad5B6STEQ7AlNFlrPrxVv8KQn2fGOB7"/>
            </div>
          </div>
        </header>

        {/* 2. Main AI Interface - NO GAPS */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Pane - Attached left */}
          <section className="w-[450px] h-full flex flex-col bg-white border-r border-slate-100 shadow-sm relative z-10">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-slate-900 text-white'}`}>
                    <span className="material-symbols-outlined text-[18px]">{msg.role === 'assistant' ? 'smart_toy' : 'person'}</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className={`p-5 rounded-[24px] shadow-sm border ${msg.role === 'assistant' ? 'bg-slate-50 border-slate-100 rounded-tl-none' : 'bg-primary text-white border-transparent rounded-tr-none max-w-[90%] ml-auto'}`}>
                      <p className="text-[12px] font-medium leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-300 text-[18px]">psychology</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-dashed border-slate-200">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input - Flush bottom */}
            <div className="p-8 bg-white border-t border-slate-50">
              <div className="relative flex items-end gap-3 bg-slate-50 border border-slate-100 rounded-3xl p-4 shadow-inner focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-1 max-h-32 outline-none font-medium" 
                  placeholder="Query SafeSphere Intelligence..." 
                  rows={1}
                ></textarea>
                <button 
                  onClick={handleSend}
                  className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-2xl transition-all active:scale-90 shadow-xl shadow-primary/20 hover:brightness-110"
                >
                  <span className="material-symbols-outlined font-black">arrow_upward</span>
                </button>
              </div>
              <p className="text-[8px] text-slate-400 mt-4 text-center font-black uppercase tracking-widest opacity-60">SafeSphere Neural Core v4.2 • Secured Terminal</p>
            </div>
          </section>

          {/* Map Section - Full Space */}
          <section className="flex-1 h-full relative overflow-hidden bg-slate-100">
            <div className="absolute inset-0 z-0">
              <MapView aiMarkers={aiMarkers} />
            </div>
            <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            
            {/* Map Overlay Indicator */}
            {aiMarkers.length > 0 && (
              <div className="absolute top-8 right-8 z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-2xl max-w-[200px]">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">AI Markings</span>
                 </div>
                 <div className="space-y-2">
                    {aiMarkers.map((m, idx) => (
                       <div key={idx} className="text-[9px] font-bold text-slate-500 border-l-2 border-primary pl-2 truncate">{m.label}</div>
                    ))}
                 </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
