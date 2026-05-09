import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  emergencyContacts: Array<{ name: string; phone: string; email: string }>;
  medicalDetails?: string;
  safetyPreferences: {
    autoSOS: boolean;
    streamToTraccar: boolean;
    notifyNearbyVolunteers: boolean;
  };
}

export interface Responder {
  type: string;
  eta: string;
  unit: string;
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  type: "SOS" | "CRASH" | "FIRE" | "DISTRESS";
  userId: string;
  userName: string;
  location: Location;
  timestamp: string;
  riskScore: number;
  status: "active" | "resolved" | "false_alarm";
  evidenceUrls?: string[];
  agentAnalysis?: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  responders?: Responder[];
}

export interface Report {
  id: string;
  type: "POTHOLE" | "UNSAFE_ROAD" | "LOW_LIGHT" | "SUSPICIOUS";
  userId: string;
  location: Location;
  media?: { url: string; type: string }[];
  severity: number;
  notes: string;
  timestamp: string;
  status: "pending" | "verified" | "resolved";
  upvotes: number;
}

export interface VaultItem {
  id: string;
  url: string;
  type: string;
  source: string;
  timestamp: string;
}

interface AppState {
  // Data
  user: UserProfile | null;
  incidents: Incident[];
  reports: Report[];
  vaultItems: VaultItem[];
  riskHotspots: Array<{ lat: number; lng: number; radius: number; color: string; label: string }>;
  userId: string;
  
  // UI State
  mapMode: 'light' | 'dark';
  sosState: 'idle' | 'countdown' | 'active';
  safetyScore: number;
  cityReasoning: string;
  citySeverity: string;
  
  // Detection Probabilities
  detections: {
    screamProbability: number;
    fallDetected: boolean;
    fireProbability: number;
    keywordsDetected: string[];
  };

  // Actions
  setUser: (user: UserProfile | null) => void;
  setIncidents: (incidents: Incident[]) => void;
  setReports: (reports: Report[]) => void;
  addVaultItem: (item: VaultItem) => void;
  setMapMode: (mode: 'light' | 'dark') => void;
  setSosState: (state: 'idle' | 'countdown' | 'active') => void;
  setSafetyScore: (score: number) => void;
  updateDetections: (detections: Partial<AppState['detections']>) => void;
  initBackend: () => () => void;
  setUserRole: (role: string) => void;
  syncReportToCloud: (reportId: string, cloudMedia: { url: string, type: string }[]) => void;
  resolveIncident: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        emergencyContacts: [],
        safetyPreferences: { autoSOS: true, streamToTraccar: true, notifyNearbyVolunteers: true }
      },
      incidents: [],
      reports: [],
      vaultItems: [],
      riskHotspots: [],
      userId: "user_123",
      mapMode: 'light',
      sosState: 'idle',
      safetyScore: 10,
      cityReasoning: "SafeSphere Neural Link: ESTABLISHED",
      citySeverity: "LOW",
      detections: { screamProbability: 0, fallDetected: false, fireProbability: 0, keywordsDetected: [] },

      setUser: (user) => set({ user }),
      setIncidents: (incidents) => set({ incidents }),
      setReports: (reports) => set({ reports }),
      addVaultItem: (item) => set((state) => {
        const exists = state.vaultItems.find(vi => vi.id === item.id);
        if (exists) return state;
        return { vaultItems: [item, ...state.vaultItems] };
      }),
      setMapMode: (mapMode) => set({ mapMode }),
      setSosState: (sosState) => set({ sosState }),
      setSafetyScore: (safetyScore) => set({ safetyScore }),
      updateDetections: (newDetections) => set((state) => ({ 
        detections: { ...state.detections, ...newDetections } 
      })),

      resolveIncident: (id: string) => set((state) => ({
        incidents: state.incidents.map(i => i.id === id ? { ...i, status: 'resolved' } : i)
      })),

      syncReportToCloud: (reportId: string, cloudMedia: { url: string, type: string }[]) => {        set((state) => ({
          reports: state.reports.map(r => 
            r.id === reportId ? { ...r, media: cloudMedia, status: 'verified' as const } : r
          ),
          vaultItems: state.vaultItems.map(v => {
            if (v.id.startsWith(`vault-${reportId}`)) {
               const idx = parseInt(v.id.split('-').pop() || '0');
               return { ...v, url: cloudMedia[idx]?.url || v.url };
            }
            return v;
          })
        }));
      },

      initBackend: () => {
        console.log("SafeSphere: Initializing AI & Cloud Sync Engine...");
        
        // 1. WebSocket for real-time sensor streams
        const socket = new WebSocket('ws://localhost:8000/ws');
        socket.onmessage = (event) => {
          const { type, data } = JSON.parse(event.data);
          if (type === 'EVENT') {
            set((state) => ({ incidents: [data as any, ...state.incidents] }));
          } else if (type === 'SEVERITY') {
            set({ 
              safetyScore: data.score,
              cityReasoning: data.reasoning,
              citySeverity: data.level
            });
          }
        };

        // 2. Cloud Firestore Real-time Sync (Reports)
        const reportsQuery = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50));
        const unsubReports = onSnapshot(reportsQuery, (snapshot) => {
          const cloudReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
          
          set((state) => {
            const pendingReports = state.reports.filter(r => 
               !cloudReports.find(c => c.timestamp === r.timestamp)
            );
            const merged = [...cloudReports, ...pendingReports];
            return { reports: merged.sort((a,b) => b.timestamp.localeCompare(a.timestamp)) };
          });

          // Sync media from cloud reports into the Digital Vault
          cloudReports.forEach(report => {
            if (report.media) {
               report.media.forEach((m: any, idx: number) => {
                  const vaultId = `vault-cloud-report-${report.id}-${idx}`;
                  get().addVaultItem({
                    id: vaultId,
                    url: m.url,
                    type: m.type,
                    source: `Cloud: ${report.type}`,
                    timestamp: new Date(report.timestamp).toLocaleTimeString()
                  });
               });
            }
          });
        }, (err) => console.warn("Firestore reports link offline (Demo mode)"));

        // 3. Cloud Firestore Sync (AI Incidents)
        const aiQuery = query(collection(db, 'ai_incidents'), orderBy('timestamp', 'desc'), limit(50));
        const unsubAI = onSnapshot(aiQuery, (snapshot) => {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const vaultId = `vault-cloud-ai-${doc.id}`;
            get().addVaultItem({
              id: vaultId,
              url: data.evidenceUrl,
              type: 'video/mp4',
              source: `AI Auto: Fire Detection`,
              timestamp: new Date(data.timestamp).toLocaleTimeString()
            });
          });
        }, (err) => console.warn("Firestore AI incidents link offline (Demo mode)"));

        return () => {
          socket.close();
          unsubReports();
          unsubAI();
        };
      },
      setUserRole: (role) => console.log('Role set:', role)
    }),
    {
      name: 'safesphere-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        reports: state.reports, 
        incidents: state.incidents, 
        vaultItems: state.vaultItems,
        user: state.user 
      }),
    }
  )
);
